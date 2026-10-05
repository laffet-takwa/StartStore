"""Verify every API path the frontend calls actually resolves in Django.

The two halves of StartStore live in separate trees and can drift silently: the
TypeScript compiler is happy with a path string, and Django is happy to 404 at
runtime. This script closes that gap by extracting the path literals from
``frontend/src/services/*.ts`` and resolving each one against the URLconf.

Usage::

    python scripts/check_frontend_contract.py
    python scripts/check_frontend_contract.py --frontend ../frontend --api-prefix /api
"""

from __future__ import annotations

import argparse
import os
import re
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent

# Path literals passed to the api.ts helpers, plus template-literal URLs.
CALL_PATTERN = re.compile(r"(?:get|post|patch|put|del|postForm|patchForm)<[^>]*>\(\s*'([^']+)'")
TEMPLATE_PATTERN = re.compile(r"`(/[^`]*\$\{[^}]+\}[^`]*)`")

#: Values substituted for `${...}` placeholders so `resolve()` can match.
SAMPLE_ID = "11111111-1111-1111-1111-111111111111"


def collect_paths(services_dir: Path) -> set[str]:
    paths: set[str] = set()
    for module in sorted(services_dir.glob("*.ts")):
        source = module.read_text(encoding="utf-8")
        paths.update(CALL_PATTERN.findall(source))
        for template in TEMPLATE_PATTERN.findall(source):
            paths.add(re.sub(r"\$\{[^}]+\}", SAMPLE_ID, template))
    return paths


def probe(path: str, api_prefix: str) -> str:
    """Turn a baseURL-relative path into something `resolve()` understands."""
    candidate = f"{api_prefix.rstrip('/')}{path}" if path.startswith("/") else path
    return candidate.replace("//", "/")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--frontend",
        type=Path,
        default=BACKEND_DIR.parent / "frontend",
        help="Path to the frontend project (default: ../frontend).",
    )
    parser.add_argument(
        "--api-prefix",
        default="/api",
        help="Prefix the frontend's baseURL adds to every path (default: /api).",
    )
    args = parser.parse_args()

    services_dir = args.frontend / "src" / "services"
    if not services_dir.is_dir():
        print(f"Could not find {services_dir}. Pass --frontend.", file=sys.stderr)
        return 2

    sys.path.insert(0, str(BACKEND_DIR))
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")
    os.environ.setdefault("USE_SQLITE", "true")

    import django
    from django.urls import resolve

    django.setup()

    paths = sorted(collect_paths(services_dir))
    print(f"Checking {len(paths)} API paths from {services_dir}\n")

    failures: list[tuple[str, str, str]] = []
    for path in paths:
        if not path.startswith("/"):
            continue
        probe_path = probe(path, args.api_prefix)
        try:
            match = resolve(probe_path)
        except Exception as exc:  # noqa: BLE001 - any resolution error is a failure
            failures.append((path, probe_path, str(exc).splitlines()[0][:160]))
            continue
        view = getattr(match.func, "cls", None)
        label = f"{view.__name__}.{match.url_name}" if view else match.func.__name__
        print(f"  OK    {probe_path:<48} {label}")

    print()
    if failures:
        print(f"FAILED: {len(failures)} path(s) do not resolve\n")
        for path, probe_path, reason in failures:
            print(f"  {path}")
            print(f"    probed {probe_path}")
            print(f"    {reason}\n")
        return 1

    print(f"All {len(paths)} frontend API paths resolve against Django.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
