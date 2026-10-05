# StartStore API

Production-ready Django REST Framework backend for the **StartStore** e-commerce MVP,
built to run against the existing Supabase PostgreSQL schema.

**Supabase owns identity and the data.** `public.profiles.id` is a foreign key to
`auth.users.id`, passwords live in GoTrue, and every table uses UUID primary keys.
Django is the business and API layer — it never stores a password and never owns a
credential table.

---

## Table of contents

- [Stack](#stack)
- [Schema alignment](#schema-alignment)
- [Quick start](#quick-start)
- [Authentication](#authentication)
- [Configuration](#configuration)
- [API surface](#api-surface)
- [Conventions](#conventions)
- [Error handling](#error-handling)
- [Architecture](#architecture)
- [Security](#security)
- [Testing](#testing)
- [Deployment](#deployment)
- [Known scope limits](#known-scope-limits)

---

## Stack

| Concern | Choice |
| --- | --- |
| Language | Python 3.12+ |
| Framework | Django 5.1 LTS, Django REST Framework 3.15 |
| Database | Supabase PostgreSQL (SQLite for local/test bootstrap) |
| Identity | Supabase Auth (GoTrue) + SimpleJWT for API tokens |
| Filtering | django-filter |
| Docs | drf-spectacular (OpenAPI 3, Swagger UI, ReDoc) |
| Images | Pillow |
| Config | python-dotenv |
| CORS | django-cors-headers |
| Serving | gunicorn + WhiteNoise |

---

## Schema alignment

Every model maps to a column that already exists in Supabase. Nothing here needs a
`CREATE TABLE`.

| Table | Model | Notes |
| --- | --- | --- |
| `profiles` | `accounts.Profile` | UUID pk = `auth.users.id`. **No password column.** Nullable `full_name`, `phone`, `avatar_url`. |
| `addresses` | `accounts.Address` | `address_line` (not `address_line1`), no `state`/`address_line2`. |
| `categories` | `categories.Category` | `name` is **not** unique; `slug` is. |
| `products` | `products.Product` | `category_id` and `sku` are **nullable**; `search_vector` is a generated tsvector Django never writes. |
| `product_images` | `products.ProductImage` | `created_at` only (no `updated_at`); `image_url` is NOT NULL. |
| `carts` | `cart.Cart` | `user_id` UNIQUE — one cart per profile. |
| `cart_items` | `cart.CartItem` | **No unique constraint** on `(cart_id, product_id)`; idempotency lives in `CartService`. |
| `wishlists` | `wishlist.Wishlist` | `created_at` only; no unique constraint. |
| `orders` | `orders.Order` | `shipping_address` jsonb. **No `currency` column** — money is a bare decimal. |
| `order_items` | `orders.OrderItem` | No `sku`, no timestamps. Snapshot columns only. |

Two deliberate deviations, both additive and reversible:

- **Indexes.** Models declare extra indexes (`is_active`, `role`, `user + created_at`,
  …). They are a superset of the schema and change no behaviour.
- **Django infrastructure tables.** `django_migrations`, `django_content_type`,
  `auth_*` and `token_blacklist_*` are created by Django itself. SimpleJWT imports
  `django.contrib.auth.models`, so that app must stay installed even though local
  password authentication is disabled (`AUTHENTICATION_BACKENDS = []`).

Because the tables already exist, record the migrations without emitting DDL:

```bash
python manage.py migrate --fake-initial
```

`--fake-initial` inspects the database and marks any migration whose tables are
already present as applied. Verify with `makemigrations --check --dry-run`.

---

## Quick start

```bash
cd backend

# 1. Virtual environment
python -m venv .venv
# Windows:            .venv\Scripts\activate
# macOS / Linux:      source .venv/bin/activate
pip install -r requirements.txt

# 2. Environment
copy .env.example .env          # Windows
# cp .env.example .env          # macOS / Linux
# Fill in DJANGO_SECRET_KEY, DATABASE_URL, SUPABASE_URL, SUPABASE_ANON_KEY.

# 3. Database (tables already exist in Supabase)
python manage.py migrate --fake-initial

# 4. Demo catalogue (optional)
python manage.py seed_demo

# 5. Make yourself an admin
#    Register through the API first (that creates the Supabase auth user and the
#    profiles row), then:
python manage.py set_role --email you@example.com --role admin

# 6. Run
python manage.py runserver
```

| URL | What |
| --- | --- |
| <http://127.0.0.1:8000/api/docs/> | Swagger UI |
| <http://127.0.0.1:8000/api/redoc/> | ReDoc |
| <http://127.0.0.1:8000/api/schema/> | Raw OpenAPI 3 document |

> **No Supabase password yet?** Set `USE_SQLITE=True` in `.env`. The project boots and
> the full test suite runs against a local SQLite file. Note that a `profiles` row can
> only be created with an explicit UUID, so use `manage.py shell` or the test helpers
> for local fixtures.

> **There is no `/admin/`.** Django has no password to authenticate an administrator
> with, so a session-based admin site is impossible by construction. Staff operations
> live under `/api/admin/`.

---

## Authentication

Two bearer tokens are accepted, tried in order:

1. **StartStore JWT** — `POST /api/auth/login/` sends the credentials to GoTrue; on
   success Django mirrors the auth user into `profiles` and returns its own
   short-lived `access` token plus a rotatable `refresh` token.
2. **Supabase JWT** — a GoTrue access token used directly. It is validated against
   Supabase, the `profiles` row is synced, and the request proceeds.

Both resolve to `request.user` being a `Profile`, so every permission class,
serializer and service is unchanged.

```
Client                     Django                        Supabase
  │  POST /auth/login/       │                              │
  │  {email, password} ─────►│  POST /auth/v1/token         │
  │                          │────────────────────────────►│
  │                          │  {access_token, user}       │
  │                          │◄────────────────────────────│
  │                          │  upsert public.profiles      │
  │  {access, refresh, user} │                              │
  │◄─────────────────────────┘                              │
  │                                                            │
  │  GET /products/  Authorization: Bearer <either token>     │
```

### Auth endpoints — `/api/auth/`

| Method | Path | Notes |
| --- | --- | --- |
| `POST` | `register/` | Creates the auth user via `POST /auth/v1/signup` and mirrors it into `profiles` with the `customer` role. |
| `POST` | `login/` | Returns `access`, `refresh`, `expires_in` and `user`. Generic failure message — an email's existence is never disclosed. |
| `POST` | `refresh/` | Rotates the refresh token and blacklists the old one. |
| `POST` | `logout/` | Blacklists one `refresh`, or every session when the body is empty. Send `supabase_access_token` to also end the GoTrue session. |
| `GET` | `me/` | Current profile. |
| `PATCH` | `me/` | `full_name`, `phone`, `avatar_url` only. `role` is read-only. |

### Granting admin

`role` is the only privilege column. Two ways to set it:

```bash
python manage.py set_role --email you@example.com --role admin
```

```
POST /api/admin/users/{id}/role/   {"role": "admin"}
```

An admin cannot demote themselves. Account deactivation happens in Supabase Auth
(not in `profiles`), so there is no `is_active` flag on this API.

---

## Configuration

### Store rules

| Variable | Default | Notes |
| --- | --- | --- |
| `STARTSTORE_CURRENCY` | `USD` | Presentation only — `orders` has no currency column. |
| `STARTSTORE_SHIPPING_FLAT_RATE` | `9.99` | |
| `STARTSTORE_FREE_SHIPPING_THRESHOLD` | `100.00` | Subtotal at or above this ships free. |
| `STARTSTORE_CART_ITEM_MAX_QUANTITY` | `99` | Per cart line. |
| `JWT_ACCESS_TOKEN_LIFETIME_MINUTES` | `30` | |
| `JWT_REFRESH_TOKEN_LIFETIME_DAYS` | `7` | |
| `THROTTLE_ANON_RATE` / `THROTTLE_USER_RATE` | `300/hour` / `2000/hour` | |
| `THROTTLE_AUTH_LOGIN_RATE` / `THROTTLE_AUTH_REGISTER_RATE` | `10/minute` / `10/hour` | |
| `SUPABASE_AUTH_TIMEOUT` | `10` | Seconds for a GoTrue call. |

> **Why the `STARTSTORE_` prefix?** Windows exports a `CURRENCY` variable holding the
> user's locale currency (`CURRENCY=TND` on some machines). An unprefixed name silently
> overrides the project setting.
>
> **Precedence:** real environment variables always win over `.env`, so a container or CI
> runner can override any file value without editing it.

### Supabase

| Variable | Exposure |
| --- | --- |
| `SUPABASE_URL` | Public by design. |
| `SUPABASE_ANON_KEY` | The publishable key. Safe server-side; the API sends it as `apikey` to GoTrue. |
| `SUPABASE_SERVICE_ROLE_KEY` | **SERVER ONLY, AND NOT READ BY THIS CODE.** It is deliberately absent from every settings module, so there is no code path that could leak it. Rotate immediately if it leaks. |
| `SUPABASE_STORAGE_BUCKET` | Bucket used for uploaded media. |

`NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are accepted as
aliases so Django and Next.js can share one `.env`.

### Useful commands

```bash
python manage.py migrate --fake-initial   # record migrations, skip existing tables
python manage.py makemigrations --check --dry-run
python manage.py seed_demo                # idempotent demo catalogue
python manage.py set_role --email a@b.c --role admin
python manage.py spectacular --file schema.yml --validate
python manage.py test                     # 277 tests
python manage.py check --deploy           # production security audit
```

`manage.py test` automatically switches to `config.settings.testing` (in-memory
SQLite, throttling off). An explicit `--settings=...` still wins.

---

## API surface

Base URL `/api`. All timestamps ISO-8601. Ids are UUIDs rendered as JSON strings.

### Addresses — `/api/addresses/`

`GET /` · `POST /` · `GET /{id}/` · `PATCH /{id}/` · `DELETE /{id}/` ·
`POST /{id}/set-default/`. Owner-scoped; another profile's id is `404`, not `403`.
The first address saved always becomes the default. Filters: `?is_default=`,
`?city=`, `?search=`.

### Categories — `/api/categories/`

`GET /` (public, active only) · `GET /{id}/` · `POST /` · `PATCH /{id}/` ·
`DELETE /{id}/`. Writes are staff-only; `DELETE` soft-deactivates. `slug` is
server-owned and stays stable across renames.

### Products — `/api/products/`

`GET /` (public, active only) · `GET /{id}/` · `POST /` · `PATCH /{id}/` ·
`DELETE /{id}/`. Writes are staff-only; `DELETE` soft-deactivates.

| Parameter | Meaning |
| --- | --- |
| `category=` | Category **id (UUID) or slug** |
| `min_price=` / `max_price=` | Inclusive bounds on the **effective** price (discount applied) |
| `search=` | Matches name, description or SKU |
| `in_stock=true` | Only items with `stock > 0` |
| `is_on_sale=true` | Only discounted items |
| `ordering=` | `name`, `price`, `discount_price`, `stock`, `created_at` (prefix `-` to reverse) |
| `page`, `page_size` | Pagination (`page_size` capped at 100) |

`category_id` is optional on create — `products.category_id` is nullable, so an
uncategorised product is valid. Staff extras:
`PATCH /api/products/{id}/stock/` and `/api/products/{product_id}/images/`.

### Cart — `/api/cart/`

`GET /` · `DELETE /` · `POST /api/cart/items/` · `GET /api/cart/items/` ·
`PATCH /api/cart/items/{id}/` · `DELETE /api/cart/items/{id}/`.

Adding a product already in the cart tops up the existing line — the service
enforces this because the schema has no unique constraint behind it. The response
carries server-computed `subtotal`, `shipping_cost`, `total` and
`free_shipping_threshold`.

### Wishlist — `/api/wishlist/`

`GET /` · `POST /toggle/` (`{"product_id": "..."}`) · `DELETE /{product_id}/`.
Toggle returns `{in_wishlist, product_id, count}`.

### Orders — `/api/orders/`

`POST /` (checkout) · `GET /` · `GET /{id}/` · `POST /{id}/cancel/`.
Staff: `GET /api/admin/orders/`, `PATCH /api/admin/orders/{id}/status/`,
`POST /api/admin/orders/{id}/cancel/`.

Checkout accepts **exactly one** destination:

```json
{ "address_id": "4365885e-2f06-40da-86cb-d0ece19b4515" }
```

```json
{ "shipping_address": {
    "full_name": "Ada Lovelace",
    "phone": "+15551234567",
    "address_line": "1 Analytical Engine Way",
    "city": "London",
    "postal_code": "EC1A 1BB",
    "country": "GB"
} }
```

Both are normalised into the same dictionary before being snapshotted onto
`orders.shipping_address`. Columns are nullable, so a saved address that is missing
any required field is rejected with `shipping_address_incomplete` rather than
producing an undeliverable order.

### Payments — `/api/payments/`

`POST /api/payments/{order_id}/capture/` — **staff only**. There is no `payments`
table: `orders.payment_status` is the only payment state, and the `payments` app is a
model-free integration seam. The capture is a sandbox stand-in for a real gateway;
replacing `PaymentService.capture` with a PSP SDK call plus a webhook is the only
change needed.

### Admin — `/api/admin/`

| Method | Path |
| --- | --- |
| `GET` | `dashboard/` — KPIs, 5 recent orders, 10 lowest-stock products |
| `GET` | `orders/` — filters on status, payment status, customer (uuid), date range, search |
| `PATCH` | `orders/{id}/status/` — `{"status": "shipped", "payment_status": "paid"}` |
| `POST` | `orders/{id}/cancel/` |
| `GET` | `users/` — with `order_count` and `address_count`; filters on role, search, join date |
| `PATCH` | `users/{id}/` — staff may correct `full_name`, `phone`, `avatar_url`, `role` |
| `POST` | `users/{id}/role/` — promote or demote |
| `GET` | `products/` — includes inactive rows; `?ordering=-units_sold` supported |
| `GET` | `products/summary/` — catalogue and inventory totals |

---

## Conventions

**Foreign keys read nested, write by id.** A product comes back with a nested
`category` object but is created with `category_id`.

**Nullable means nullable.** `full_name`, `phone`, `avatar_url`, `sku` and
`category_id` accept `null`, and an emptied string is stored as `NULL` so `IS NULL`
stays meaningful.

**Money is always a string.** `Decimal` fields serialise as `"129.00"`. Ids are UUID
strings. Clients should parse with a decimal type, not `parseFloat`.

**Derived product fields are read-only**: `final_price`, `is_on_sale`,
`discount_percentage`, `in_stock`.

**Soft deletes.** Categories and products are flagged `is_active = false` rather than
deleted, so historic orders keep intact references. `GET` hides inactive rows from
everyone except staff.

**Order items are snapshots.** `product_name`, `unit_price`, `quantity` and
`subtotal` are frozen at purchase time. `product_id` is `SET NULL` on delete — the
catalogue may change, history may not.

**Status transitions are a state machine.** Admin status updates are validated against
`common.constants.ORDER_STATUS_TRANSITIONS`; an illegal jump returns `400` listing the
allowed targets.

**The database allows `price >= 0`, the API requires `> 0`.** The column carries an
integrity floor; the stricter rule is a business rule and lives in the serializer.

---

## Error handling

Every failure uses one envelope, so the client only ever branches on `error.code`:

```json
{
  "error": {
    "code": "insufficient_stock",
    "message": "One or more items do not have enough stock to fulfil the order.",
    "details": {
      "items": [{
        "product_id": "f5db14fa-fbf3-4525-af87-ea4fe7e96bf5",
        "product_name": "Aurora Mechanical Keyboard",
        "reason": "insufficient_stock",
        "requested_quantity": 5,
        "available_quantity": 2
      }]
    }
  }
}
```

Stable codes: `validation_error`, `invalid_credentials`, `invalid_token`,
`not_authenticated`, `permission_denied`, `not_found`, `method_not_allowed`,
`throttled`, `invalid_quantity`, `insufficient_stock`, `product_unavailable`,
`empty_cart`, `shipping_address_required`, `shipping_address_incomplete`,
`address_not_found`, `order_not_cancellable`, `invalid_status_transition`,
`stock_conflict`, `refresh_token_mismatch`, `auth_provider_unavailable`, `conflict`.

Third-party codes are aliased in `common/exceptions.py` so the public contract does not
move when SimpleJWT renames its own.

---

## Architecture

```
HTTP  →  authenticators  →  permissions  →  serializer (input validation)
                                                  ↓
                                             service layer (business rules, transactions)
                                                  ↓
                                              models / database
```

- **Serializers** validate shape only. They never compute a price or mutate stock.
- **Services** own business logic: `CartService`, `CheckoutService`, `OrderService`,
  `ShippingService`, `PaymentService`, `ProfileService`, `AddressService`. This is
  where the transaction boundary lives, so views stay thin.
- **Permissions** (`common/permissions.py`): `IsAdmin`, `IsCustomer`, `IsOwner`,
  `IsAdminOrReadOnly`. `IsOwner` resolves dotted paths, which is how a cart item is
  owned through its cart (`cart.user`).
- **Ownership is enforced by scoping the queryset**, not by a permission check.
  Requesting another profile's cart item, order, wishlist entry or address returns
  `404` — a `403` would confirm the id exists.
- **The Supabase gateway is a single seam.** `accounts.services.get_supabase_auth_gateway()`
  is the only place credentials leave the process, and tests replace exactly that.

### Checkout, step by step

`CheckoutService.execute` runs inside one `transaction.atomic()`:

1. Lock the cart row (`SELECT … FOR UPDATE` on PostgreSQL).
2. **Reject an empty cart** → `400 empty_cart`.
3. Re-run cart availability rules → `400 insufficient_stock` / `product_unavailable`.
4. Price every line from `product.final_price` — **client input is never read**.
5. Compute shipping and the total.
6. Create the order with a collision-checked `order_number` (`SS-YYYYMMDD-XXXXXX`).
7. Bulk-create order items with their price/name snapshots.
8. Decrement stock with a compare-and-set (`UPDATE … SET stock = stock - qty WHERE
   stock >= qty`); a lost race raises `409 stock_conflict` and rolls everything back.
9. Empty the cart.

Any failure at any step rolls back completely — no orphan orders, no lost stock.

### Performance

N+1 queries are avoided deliberately: `select_related`/`prefetch_related` on every list
endpoint, `bulk_create` for order items, and `F()` expressions for stock arithmetic so
updates are single round-trips. The dashboard is one hand-tuned aggregate rather than a
queryset per metric.

---

## Security

- **No password ever touches Django.** `profiles` has no password column,
  `AUTHENTICATION_BACKENDS` is empty, and no view calls `authenticate()`.
- **Two-token design.** Short-lived API access tokens; refresh tokens rotate and are
  blacklisted on logout or reuse. Logout can also end the GoTrue session.
- **Privilege escalation is impossible from the client.** `role` is read-only on
  `PATCH /api/auth/me/`, sign-up metadata cannot influence `role`
  (`ProfileService.sync_from_supabase` applies it only when explicitly allowed), and
  self-registration always creates a customer. `is_admin` and `is_staff` are derived
  from `role`, so they cannot disagree.
- **JWT claims are serialised deliberately.** `Profile.pk` is a UUID, which is not JSON
  serialisable; the `user_id` claim is stringified, and `RefreshToken.for_user` is
  unusable because it rejects non-int ids. `outstand()` is called explicitly so
  "log out everywhere" has rows to revoke.
- **CORS** is an explicit allow-list, never `*` in production.
- **Rate limiting** covers anonymous traffic, authenticated traffic, login
  (`10/min`), registration (`10/hour`) and checkout.
- **Production hardening**: the settings module refuses to boot without a
  `SECRET_KEY`, and refuses to boot if that key is a documented example placeholder or
  shorter than 50 characters — otherwise anyone who read this repository could forge
  access tokens. `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS` and `SUPABASE_URL` /
  `SUPABASE_ANON_KEY` are likewise mandatory, `USE_SQLITE=true` is rejected, HSTS and
  secure cookies are on, `nosniff` and `X-Frame-Options: DENY` are set, and Postgres must
  set `sslmode`. `manage.py check --deploy` passes with **zero warnings**.
- **Secrets stay out of Git.** `.env` is ignored; `.env.example` holds placeholders.
  A test asserts the service-role key never appears in `/api/schema/` or any response,
  and that no settings module even loads it.
- **No mass assignment.** Order totals, order status and payment status are never
  writable by a customer.

---

## Testing

```bash
python manage.py test                       # everything
python manage.py test orders payments       # a subset
python manage.py test cart.tests.test_cart.CartItemTests.test_add_item
```

**277 tests**, all passing:

| Area | Highlights |
| --- | --- |
| Schema fidelity | `db_table` names, UUID primary keys, nullable columns stored as `NULL`, **no password field**, no `payments`/`currency`/`sku` columns, empty `AUTHENTICATION_BACKENDS` |
| Supabase gateway | Register/login round-trip, profile mirroring, role never taken from metadata, non-UUID user id rejected, email conflict reported as a clean error |
| Authentication | StartStore JWT and Supabase JWT both authenticate, rotation, logout blacklisting, logout-everywhere, cross-profile logout rejection, deleted profile, garbage token, generic login failure |
| Product CRUD | Public reads hide inactive rows, admin CRUD, SKU normalisation + uniqueness, nullable category and SKU, discount/price/stock validation, soft delete, stock set/increment/decrement, gallery ordering |
| Filtering | Category by **uuid and slug**, effective-price bounds, search, `in_stock`, `is_on_sale`, ordering, combinations, pagination |
| Permissions | Anonymous vs customer vs admin on every write path, staff locked out of customer flows |
| Cart | Add/top-up, quantity > 0, stock ceilings, inactive products, line updates, removal, server-computed totals and shipping, cross-profile isolation (404) |
| Wishlist | Toggle idempotency, delete by product id, unknown/inactive products, cross-profile isolation |
| Checkout | Empty cart, destination required, both-at-once rejected, incomplete saved address blocked, foreign address 404, **client prices ignored**, stock decrement, insufficient stock rolls back, snapshots survive catalogue edits and product deletion, unique order numbers |
| Orders | History scoping, 404 on foreign orders, cancellation with restock, paid → refunded, cannot cancel shipped/cancelled, staff cannot check out |
| Admin | Dashboard KPIs and low-stock list, cross-customer order list, full lifecycle, illegal transitions with allowed targets, self-promotion guards, product summary |
| Payments | No table, sandbox capture is staff-only, double capture conflict, cancelled/refunded guards, status change does not fabricate a payment |
| Addresses | Owner scoping, first address becomes default, `set-default` demotes the previous, country normalised, incomplete address blocked at checkout |
| Errors & secrets | Envelope for 400/401/403/404/405, nested field errors, no service-role key anywhere, placeholder/short production secrets refused |

Tests run against in-memory SQLite with an in-memory fake GoTrue — **no network calls**.
Checkout uses `select_for_update()` and `F()` compare-and-set, both no-ops on SQLite, so
run the suite against Supabase PostgreSQL in CI to exercise real row locking.

---

## Deployment

```bash
export DJANGO_SETTINGS_MODULE=config.settings.production
export DJANGO_SECRET_KEY=...            # required, >= 50 chars, not the placeholder
export DJANGO_ALLOWED_HOSTS=...         # required
export CORS_ALLOWED_ORIGINS=...         # required
export SUPABASE_URL=...                 # required
export SUPABASE_ANON_KEY=...            # required
export DATABASE_URL=postgresql://...    # required, sslmode=require
export USE_SQLITE=false

python manage.py migrate --fake-initial  # tables already exist
python manage.py collectstatic --noinput
python manage.py check --deploy          # must be clean

gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 3
```

The throttle cache defaults to `locmem`, which is per-process. Behind more than one
worker, point `CACHES` at Redis so limits are shared.

---

## Known scope limits

Deliberately out of scope, and where to add each:

- **Real payments.** `payments` holds a ledger-free service layer and a sandbox capture.
  Add a PSP SDK call in `PaymentService.capture` plus a webhook that funnels into
  `mark_paid` / `mark_failed`.
- **Supabase Storage uploads.** Uploads currently go to Django's `MEDIA_ROOT` after
  being normalised by `common/images.py` (EXIF-corrected, downscaled, WebP + thumbnail).
  Point `STORAGES["default"]` at Supabase Storage to move the bytes; `image_url` is
  already just a URL.
- **Full-text search.** `products.search_vector` is a generated tsvector this code does
  not use; `?search=` is a portable `icontains` match over name, description and SKU.
  Switch to `SearchVector`/`SearchRank` when you want ranking.
- **Row Level Security.** Nothing here writes with the service-role key, so enable RLS
  on these tables freely — it is a second line of defence, not a dependency.
- **Order emails and stock notifications.** Hook `OrderService` on transitions.
- **Product reviews, coupons, refunds workflow, tax calculation.**
