# StartStore Frontend

Production storefront and admin console for the StartStore e-commerce MVP.

Every business operation goes through the Django REST API. Supabase Auth is used
to verify identity; **no protected table is ever queried from the browser**.

---

## Table of contents

- [Architecture](#architecture)
- [Quick start](#quick-start)
- [Environment](#environment)
- [Auth](#auth)
- [Project layout](#project-layout)
- [Design system](#design-system)
- [State and data](#state-and-data)
- [API layer](#api-layer)
- [Routes](#routes)
- [Verification](#verification)
- [Deployment](#deployment)
- [Known limits](#known-limits)

---

## Architecture

```
Browser
  │
  ├── pages / layouts          route-level components (lazy loaded)
  ├── components/*             product, cart, checkout, admin, layout, common
  ├── hooks/*                  React Query bindings + small utilities
  ├── services/*               the only place axios is used
  ├── store/*                  Zustand: session, cart UI, wishlist mirror, toasts
  ├── types/*                  mirrors of the DRF serializers
  └── utils/*                  formatting, constants, zod schemas, env
        │
        ▼
  Django REST API  ──►  Supabase Auth (identity only)
```

Three rules the codebase holds to:

1. **Components never call axios.** They use a hook, the hook uses a service, the
   service uses `api.ts`. Swapping the transport touches exactly one file.
2. **Server data lives in React Query; UI state lives in Zustand.** The cart's
   *contents* are the server's. Zustand only holds the drawer, the badge count
   and the optimistic wishlist id set.
3. **No secrets in the bundle.** Only `VITE_`-prefixed variables are inlined, and
   the service-role key never gets that prefix.

---

## Quick start

```bash
cd frontend
npm install
cp .env.example .env          # Windows: copy .env.example .env
npm run dev
```

The dev server proxies `/api` to the Django backend, so there is no CORS setup
and the frontend keeps using a relative base URL locally.

| Command | What |
| --- | --- |
| `npm run dev` | Dev server on <http://127.0.0.1:5173> with `/api` proxy |
| `npm run build` | Type-check then produce a production bundle in `dist/` |
| `npm run preview` | Serve `dist/` locally, still proxying `/api` |
| `npm run typecheck` | `tsc --noEmit` |

The backend must be running on the port in `VITE_API_URL` (default
`http://127.0.0.1:8000`). See `../backend/README.md` to start it.

---

## Environment

| Variable | Required | Purpose |
| --- | --- | --- |
| `VITE_API_URL` | yes | Django REST base URL, no trailing slash |
| `VITE_SUPABASE_URL` | optional | Only for the alternative Supabase sign-in path |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | optional | Publishable/anon key — safe in a `VITE_` variable |
| `VITE_CURRENCY` | no | Display currency, default `TND` |
| `VITE_STORE_NAME` | no | Default `StartStore` |

> **Never** add a `VITE_` prefix to the Supabase **service-role** key. Anything
> with that prefix is inlined into the JavaScript bundle and is readable by every
> visitor. The backend does not need it in the browser at all, so it is absent
> from `.env.example` and from `lib/supabase.ts`.

---

## Auth

Sign-in goes through Django, which asks Supabase to verify the password:

```
POST /api/auth/login/  { email, password }
  → Django → POST {SUPABASE_URL}/auth/v1/token?grant_type=password
  → Django upserts public.profiles, returns { access, refresh, expires_in, user }
```

Access tokens are short lived; the refresh token rotates and is blacklisted on
logout. On a `401` the Axios interceptor refreshes **once** — concurrent 401s
share a single in-flight refresh via `Promise` memoisation — then replays the
original request. If the refresh token is spent, the session is cleared and every
subscriber to `sessionEvents` reacts, so guards redirect immediately.

A **second, opt-in path** is available on the login page: sign in with Supabase
directly and send that access token to Django as a bearer token. The backend
validates it against Supabase and syncs the profile. It is opt-in because it
skips refresh rotation.

Route guards mirror what the API enforces, so nobody lands on a page that would
immediately `403`:

| Guard | Behaviour |
| --- | --- |
| `GuestRoute` | Signed-in users are bounced away from login/register |
| `ProtectedRoute` | Requires a session; remembers the destination |
| `CustomerRoute` | Customers only — staff are sent to the admin console |
| `AdminRoute` | `role === 'admin'`; customers are sent to their profile |

---

## Project layout

```
src/
├── components/
│   ├── auth/          RouteGuards
│   ├── common/        Button, form controls, feedback, overlays, display, status badges
│   ├── layout/        Navbar, Footer, layout primitives
│   ├── product/       ProductCard, ProductGrid, gallery, filters, CategoryCard
│   ├── cart/          CartItemRow, CartSummary, CartDrawer
│   ├── checkout/      steps, address form, order timeline
│   └── admin/         stat cards, tables, charts, product form
├── layouts/           PublicLayout, AuthLayout, AdminLayout
├── pages/             7 public + 8 customer + 7 admin
├── hooks/             useAuth, useCart, useWishlist, useOrders, useUser,
│                      useProducts, useProductFilters, useAdmin, media/debounce/title
├── services/          api, auth, product, category, cart, wishlist, order,
│                      user, address, newsletter
├── store/             authStore, cartStore, wishlistStore, uiStore
├── types/             API contract mirrors
├── utils/             format, constants, validation (zod), env, storage
└── lib/               queryClient, cn, supabase
```

---

## Design system

Tailwind with a custom `brand` scale — a violet-shifted indigo rather than
Tailwind's stock 500/600, because the default reads as generic. Neutrals come
from `zinc` via `ink.*`, on a white/`surface` background.

- **Type**: Inter, `tracking-tight` on headings, tabular numerals for money.
- **Shape**: `rounded-2xl` cards, `rounded-xl` controls.
- **Depth**: three shadow tokens (`card`, `card-hover`, `float`) instead of
  scattered `shadow-*`.
- **Motion**: 150–280 ms on `cubic-bezier(0.16, 1, 0.3, 1)`, and the whole
  system respects `prefers-reduced-motion`.
- **Focus**: a visible brand ring on keyboard focus only.

Responsive behaviour is explicit at every breakpoint — filter sidebar on desktop
and a slide-over drawer on mobile, a sticky order summary that becomes a stacked
rail, an admin sidebar that becomes a menu, and grids from 2 to 4 columns.

---

## State and data

| Concern | Owner | Why |
| --- | --- | --- |
| Products, categories, orders, addresses | React Query | Server-owned; caching, dedup, background refetch |
| Mutations | React Query | Invalidate exactly the affected keys after a write |
| Session, tokens | Zustand + `localStorage` | Tokens live outside React so Axios can read them without a cycle |
| Bag drawer, badge count | Zustand | Pure UI state, no server round trip |
| Wishlist ids | Zustand mirror | Optimistic hearts across a product grid without N queries |
| Toasts, mobile nav | Zustand | Imperative, dismissible UI state |

React Query retries are asymmetric: 4xx is deterministic and never retried,
network/5xx gets one more attempt. Pagination uses `placeholderData: previous`
so the grid never flashes empty between pages.

---

## API layer

`services/api.ts` owns Axios:

- base URL from `VITE_API_URL`;
- `Authorization: Bearer` injected on every request;
- single-flight refresh with automatic replay of the failed request;
- every failure normalised into an `ApiError` carrying `status`, `code` and
  `details`, so components switch on `error.code` rather than parsing text.

`applyServerErrors()` maps the API's field-keyed `details` onto
react-hook-form, so a server-side validation failure lands on the input that
caused it instead of a banner.

Listing pages keep their filters in the query string, so a filtered view is
shareable and survives the back button.

---

## Routes

| Path | Access |
| --- | --- |
| `/` | public |
| `/products`, `/products/:productId` | public |
| `/categories`, `/search` | public |
| `/login`, `/register` | guests only |
| `/cart`, `/wishlist`, `/orders`, `/orders/:id`, `/orders/:id/success` | signed in |
| `/profile`, `/addresses` | signed in |
| `/checkout` | customers only |
| `/admin` · `/admin/products` · `/admin/products/new` · `/admin/products/:id` · `/admin/categories` · `/admin/orders` · `/admin/users` | staff only |
| `*` | 404 page |

All pages are `React.lazy`, so a first-time visitor downloads the shell and the
home page only — the admin console is never fetched by a shopper.

---

## Verification

```bash
npm run typecheck     # strict mode, no unused locals/params
npm run build         # type-check + production bundle
```

Both pass. The build produces ~52 chunks with no chunk over 500 kB: ~152 kB
gzipped for the initial shell plus React/Query/forms vendors, and each route as
its own small chunk.

Cross-repo contract check (run from `backend/`):

```bash
python scripts/check_frontend_contract.py
```

It extracts every path literal from `frontend/src/services/*.ts` and resolves
each against Django's URLconf — all **29** resolve. TypeScript is happy with a
typo'd path and Django is happy to 404 at runtime, so this closes that gap.

Verified live against the running backend: the SPA shell and deep links
(`/admin/orders`) serve correctly, `/api` proxies through Vite, the catalogue
and category queries return data, and `/api/cart/` correctly refuses an
unauthenticated request with `401`.

---

## Deployment

```bash
npm ci
npm run build            # emits dist/
```

Serve `dist/` from any static host. Two settings matter:

1. **History fallback** — unknown paths must return `index.html`, otherwise deep
   links 404. Netlify: `/* /index.html 200`. Nginx:
   `try_files $uri $uri/ /index.html;`. Vercel: a rewrite to `/index.html`.
2. **Correct API origin** — set `VITE_API_URL` to the public backend URL at build
   time, or terminate `/api` at the same origin via a proxy.

```nginx
location /api/ {
    proxy_pass http://django:8000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
}
location / {
    try_files $uri $uri/ /index.html;
}
```

---

## Known limits

Honest gaps, each with the seam to fill it:

- **Newsletter sign-up has no endpoint.** `services/newsletter.service.ts` throws a
  typed `501` and the section says so, rather than faking a success. Point that
  one function at a real endpoint.
- **Payment is a placeholder.** The checkout's payment step records the choice and
  creates the order as `awaiting payment`; the backend exposes a staff capture
  endpoint for a real gateway.
- **Password reset and email verification** are not wired; the login page says so
  rather than linking to a dead form.
- **Best-seller ranking** is only available on the admin product endpoint
  (`ordering=-units_sold`). The public home page uses ordering the public API
  actually supports, rather than inventing a ranking.
- **`search_vector` is unused.** The backend maintains a generated tsvector; `?search=`
  is a portable `icontains` match. Swap in `SearchVector`/`SearchRank` when
  ranking matters.
- **Reviews, coupons and tax** are out of scope, matching the backend.
