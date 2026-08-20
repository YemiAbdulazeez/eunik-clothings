# EUNIK backend â€” implementation, frontend integration, and phase tracker

> **Repo:** `C:\Users\DELL\Downloads\backend-eunik` (this folder).  
> **Frontend:** `C:\Users\DELL\Downloads\EUNIK`  
> **Companion audit:** [`../EUNIK/docs/EUNIK_FRONTEND_AUDIT.md`](../EUNIK/docs/EUNIK_FRONTEND_AUDIT.md) â€” as-built UI, F0â€“F2 only.  
> **Date:** 18 August 2026

This file is the **single tracker** for API work and for wiring each API slice into the Vite app. Keep it updated as you go. If the network drops, the last **âœ…** phase is the resume point.

---

## How to work (mandatory)

**Complete one phase. Wire it end-to-end with the frontend. Only then mark it complete.**

1. Work **one phase** (`B0` then `B1` â€¦). Do not start the next phase while this one is â¬œ or ðŸŸ¡.
2. Implement the backend **and** the frontend calls for that slice (`EUNIK/src/api/http.ts` or a temporary proxy). The UI must actually hit Express, not only Postman.
3. Run the **exit script** in a browser (and a second browser where the phase says so).
4. Change â¬œ â†’ âœ… **only after** the exit script passes. Typing code is not done.
5. If you stop mid-phase, set it to ðŸŸ¡ and write **one line** under [Resume log](#resume-log) (file + what was unfinished). The next session reads that log first.

| Mark | Meaning |
|------|---------|
| â¬œ | Not started |
| ðŸŸ¡ | In progress â€” resume here; do not skip ahead |
| âœ… | Done: coded **and** wired E2E (exit script passed) |

Do **not** mark a phase âœ… because â€œthe route exists.â€ Mark it âœ… when the **frontend screen** uses it.

Frontend demo phases **F0â€“F2** (localStorage) live in the [frontend audit](../EUNIK/docs/EUNIK_FRONTEND_AUDIT.md). **F0â€“F2 are âœ…** on the frontend (19 Aug 2026). Start **B0** and wire each backend slice to the screens below â€” do not skip E2E.

---

## Frontend completion (F0â€“F2) â†’ backend wiring map

The Vite app at `EUNIK/` currently runs on `src/db/client.ts` (localStorage, `SEED_VERSION=5`). Every row below is **implemented in the UI**; your job in B0â€“C0 is to make the matching HTTP route the source of truth.

### F0 âœ… â€” Honesty, auth, staff cannot shop (maps to **B0** + parts of **B1**)

| Audit | Frontend behaviour (done) | Backend phase | Wire to |
|-------|---------------------------|---------------|---------|
| A01 | Demo banner when `settings.demoMode` or dev | C0 | Hide when live API + `demoMode` false |
| A02â€“A03 | No password on checkout/thank-you; existing email â†’ login | B1 | `POST /v1/orders` returns `{ needsLogin: true }`; Resend set-password |
| A04 | Quota toast in `persist.ts` | â€” | N/A (Postgres) |
| A05â€“A07 | Staff blocked from shop, bag, WhatsApp leads | B1 | `assertCanShop` 403 on cart/orders |
| A08â€“A09 | StaffShopGuard splash; Footer Account uses `landingPath` | B0 | JWT + RBAC redirect |
| A18 | `PublicUser` strips password from all DTOs | B0 | Never return `password_hash` |

### F1 âœ… â€” House OS + one ticket + traffic (maps to **B1** + **B2** + **B3**)

| Audit | Frontend behaviour (done) | Backend phase | Wire to |
|-------|---------------------------|---------------|---------|
| A12â€“A14 | Role-shaped Studio/Atelier homes; useful landings | B0 | Copy `rbac.ts` + nav PATCH |
| A15 | People: landing preview, block empty nav | B2 | `PATCH /v1/staff/:id/nav` validation |
| A16â€“A17 | Confirm appointments desk-only; Delete products manager-only | B2 | Same role checks server-side |
| A20â€“A22 | All open balances; quote Accept/Decline; revise in Custom/Quotes | B2 | `quotations` CRUD + revise |
| A23â€“A24 | Multi-line `order_items`; stock decrement/restore | B1 | Transactional stock on pay/cancel |
| A25â€“A26 | Waiting column; `productionStages.ts`; legal Advance | B2 | Production stage ACL |
| A27â€“A30 | Seed fixes; account hero; reviews `ready`; support by `customerId` | B2 | Same shapes in Postgres |
| A31 | Lead claim opens ticket `#orderNumber` | B2 | `POST /v1/leads/:id/claim?openTicket=1` |
| A37 | `settings.demoToday`; real `salesSeries` from payments | B2/B3 | Settings row + analytics queries |
| A45 | Vitest: auth, cart, A03, shop guard, quote, stage, traffic ACL | â€” | Keep tests green when swapping `http.ts` |
| Â§13 | `analytics.track`, Traffic tab (super_admin), seeded events | B3 | `POST /v1/events`, `GET /v1/studio/traffic` |

### F2 âœ… â€” Public IA + OS chrome (maps to **B2** + **B3** + polish in **C0**)

| Audit | Frontend behaviour (done) | Backend phase | Wire to |
|-------|---------------------------|---------------|---------|
| A10â€“A11 | Honest forgot-password; `MustChangePasswordGate` on gates | B0 | Resend reset + `must_change_password` flag |
| A19 | OsShell mobile sheet (all nav items) + More tab | â€” | UI only |
| A32â€“A33 | Header/Footer EventsÂ·BookÂ·Magazine; book reference | B2 | `POST /v1/appointments` returns `{ id, reference }` |
| A34 | Home shipping/promo from settings/homepage | B2 | `GET /v1/homepage`, settings |
| A35 | AsyncGuard on Thank-you / Account orders | â€” | UI only |
| A36 | Search debounce + `?q=`; OsShell search â†’ `/search` | B3 | Optional `search` query param on products |
| A38 | Collection `heroImage`, breadcrumb trail | B1 | Categories include `hero_image` |
| A39â€“A41 | Cookie policy link; settings socials; no fake recaptcha | B3 | Cookie consent before `eunik_vid` |
| A42 | Notification bell tray + markAllRead | B2 | `GET/PATCH /v1/notifications` |
| A43 | Audit log in Studio Settings | B2 | `GET /v1/studio/audit` |
| A44 | SW caches app shell | C0 | CDN + service worker on production host |

### Integration contract additions (beyond the table above)

| `db.*` (demo) | HTTP (add in phase) | Notes |
|---------------|---------------------|-------|
| `auth.ensureAtCheckout` | `POST /v1/checkout/ensure` | Returns `{ needsLogin }` â€” never auto-login |
| `quotations.revise` | `PATCH /v1/quotations/:id` | Desk/designer; only `sent` quotes |
| `quotations.reject` | `POST /v1/quotations/:id/reject` | Client ownership check |
| `leads.claim(id, { openTicket })` | `POST /v1/leads/:id/claim` | Body `{ openTicket: true }` â†’ `{ orderNumber }` |
| `notifications.markRead` / `markAllRead` | `PATCH /v1/notifications/:id`, `POST /v1/notifications/read-all` | |
| `audit.list` | `GET /v1/studio/audit` | super_admin + manager |
| `analytics.track` | `POST /v1/events` | `sendBeacon`; skip `/studio`, `/atelier` |
| `people.setNav` + validation | `PATCH /v1/staff/:id/nav` | Reject nav that blocks both areas |
| `production.moveStage` | `PATCH /v1/production/:id/stage` | Role-legal next stage server-side |
| `orders` multi-line | `POST /v1/orders` | Persist all `order_lines` + `variant_id` for stock |

**E2E wiring checklist (run after each backend phase):**

1. **B0:** Studio + client login screens hit `VITE_API_URL`; Ade blocked from `/studio`; no plaintext passwords in API responses; `MustChangePasswordGate` works with real `changePassword`.
2. **B1:** Guest shop â†’ bag â†’ Paystack test â†’ thank-you from API; staff 403 on cart; multi-line order visible in Account; stock moves on pay.
3. **B2:** Quote revise/accept/decline; Funmi transfer â†’ floor board; lead claim opens `#`; appointments confirm desk-only; notifications + audit from Postgres.
4. **B3:** Layout `trackPageView` â†’ Traffic tab for Olamide only; cookie Allow before visitor id; finance 403 on traffic API.
5. **C0:** `database.ts` exports HTTP only; demo banner off; live Paystack webhook.

---

## Resume log

Update this when you stop, especially if the connection may drop.

| When | Phase | Status | Where you stopped | Next action |
|------|-------|--------|-------------------|-------------|
| 18 Aug 2026 | â€” | â€” | Repo empty | Start **B0** after reading this file + frontend F0 status |
| 19 Aug 2026 | â€” | â€” | Frontend F0â€“F2 âœ… | Start **B0** â€” wire auth login E2E |

**Active phase:** â¬œ **B0**  
**Last âœ… phase:** none (frontend F0â€“F2 âœ… in companion audit)

---

## Phase board

| Phase | Name | Status | Wire into frontend before âœ… |
|-------|------|--------|------------------------------|
| B0 | Express + Postgres(Aiven) + auth + RBAC + Resend smoke | â¬œ | Studio/client **login** against `localhost:5050` |
| B1 | Catalog, cart, orders, Cloudinary, Paystack, transfer | â¬œ | Shop â†’ bag â†’ Paystack **test** pay **or** transfer receipt |
| B2 | House OS (quotes, floor, CRM, people, content) | â¬œ | Two staff browsers: finance approve â†’ tailor board |
| B3 | Traffic events + super-admin Traffic tab | â¬œ | Browse shop â†’ Olamide **Traffic** tab shows the views |
| C0 | Cutover (Render, live keys, `demoMode` off) | â¬œ | Live domain, no localStorage orders |

---

## Locked stack

Do not substitute.

| Piece | Choice |
|-------|--------|
| Runtime | **Node.js 20 LTS** (18 if your host offers no Node 20) |
| HTTP | **Express 4**, routes under `/v1` |
| Dev | **nodemon** (`npm run dev` only) |
| Production | `node src/server.js` on **Render** |
| DB | **Aiven PostgreSQL** (`pg`, SSL) |
| Images | **Cloudinary** (signed server uploads only) |
| Pay | **Paystack** (kobo; webhook HMAC marks paid) |
| Mail | **Resend** |
| Auth | **bcrypt** + **JWT** (access 15m, refresh 7d) |
| Validation | **zod** |
| Uploads | **multer** memory â†’ Cloudinary (8MB; jpg/png/webp/pdf) |

Do **not** add Nest, Prisma, Mongo, S3, Nodemailer, additional DBs, Socket.io, or Google Analytics as the house source of truth.

---

## Frontend integration contract

Pages in EUNIK import `{ db } from "@/db/database"` only. Until C0 that is `src/db/client.ts` (localStorage). From B0 onward, grow `EUNIK/src/api/http.ts` and switch namespaces **per phase** (or keep local until C0 â€” if you wait, you still **must** hit the new routes from a small `http.ts` or Thunder Client **and** a wired screen).

Preferred: from B0, `http.ts` implements **only the namespaces that phase finished**; `database.ts` merges `{ ...local, ...http }` so login can go live while cart is still demo.

| Rule | Why |
|------|-----|
| Money = **kobo integers** | Paystack + Postgres `INT` |
| IDs = `CHAR(36)` UUID | Same as demo strings |
| 401 unauthenticated, 403 forbidden `{ error: string }` | Existing toasts |
| `track()` never throws in the UI | `sendBeacon` |
| `GET /v1/studio/traffic` = **super_admin only** | Finance must 403 |
| Staff `POST /v1/cart/lines` = 403 | House cannot shop |
| Images = Cloudinary `url` + `public_id` | Never data URLs in Postgres |

| `db.*` | HTTP |
|--------|------|
| `auth.login` | `POST /v1/auth/login` |
| `auth.register` | `POST /v1/auth/register` |
| `auth.me` | `GET /v1/auth/me` |
| `auth.logout` | `POST /v1/auth/logout` |
| `products.list` | `GET /v1/products` |
| `cart.add` | `POST /v1/cart/lines` |
| `checkout.placeOrder` | `POST /v1/orders` |
| `payments.initializePaystack` | `POST /v1/payments/paystack/initialize` |
| `payments.submitTransfer` | `POST /v1/payments/transfer` |
| `analytics.studioOverview` | `GET /v1/studio/overview` |
| `analytics.traffic` | `GET /v1/studio/traffic` |
| `analytics.track` | `POST /v1/events` |
| `people.setNav` | `PATCH /v1/staff/:id/nav` |
| `quotations.revise` | `PATCH /v1/quotations/:id` |
| `quotations.accept` / `reject` | `POST /v1/quotations/:id/accept|reject` |
| `leads.claim` | `POST /v1/leads/:id/claim` |
| `notifications.listMine` | `GET /v1/notifications` |
| `audit.list` | `GET /v1/studio/audit` |
| uploads | `POST /v1/uploads` |

Frontend env: `VITE_API_URL=http://localhost:5050/v1`, `VITE_PAYSTACK_PUBLIC_KEY=pk_test_â€¦`

Adapter sketch (`EUNIK/src/api/http.ts`):

```ts
const base = import.meta.env.VITE_API_URL;

async function api(path, { method = "GET", body } = {}) {
  const res = await fetch(`${base}${path}`, {
    method,
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || "Request failed");
    err.name = res.status === 403 ? "ForbiddenError" : "Error";
    throw err;
  }
  return data;
}

export const http = {
  auth: {
    login: (email, password) => api("/auth/login", { method: "POST", body: { email, password } }),
    me: () => api("/auth/me"),
  },
  analytics: {
    track: (event) => {
      navigator.sendBeacon?.(
        `${base}/events`,
        new Blob([JSON.stringify(event)], { type: "application/json" }),
      );
    },
    traffic: (range) => api(`/studio/traffic?range=${range}`),
  },
};
```

---

## Repo layout (create in B0)

```text
backend-eunik/
  README.md             â† this tracker
  package.json
  nodemon.json
  .env.example
  .env                  // never commit
  sql/
    001_init.sql
    002_seed.sql
    003_traffic.sql
  src/
    server.js
    app.js
    config/     env.js  db.js  cloudinary.js  paystack.js  resend.js
    middleware/ auth.js requireRole.js error.js rateLimit.js
    routes/     health.js auth.js products.js cart.js orders.js
                payments.js uploads.js studio.js events.js people.js
                production.js content.js tickets.js appointments.js
                notifications.js
    services/   authService.js orderService.js paystackService.js
                cloudinaryService.js mailService.js trafficService.js rbac.js
    jobs/       rollTraffic.js runSql.js
    utils/      asyncHandler.js kobo.js ids.js
```

```json
{
  "name": "backend-eunik",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "nodemon src/server.js",
    "start": "node src/server.js",
    "sql:init": "node src/jobs/runSql.js sql/001_init.sql"
  }
}
```

Dependencies: `express`, `pg`, `cors`, `helmet`, `dotenv`, `bcryptjs`, `jsonwebtoken`, `cookie-parser`, `zod`, `multer`, `cloudinary`, `resend`, `express-rate-limit`, `uuid`. Dev: `nodemon`.

---

## Environment

`.env.example` (same keys in Render environment variables):

```bash
NODE_ENV=development
PORT=5050
FRONTEND_ORIGIN=http://localhost:5173

DATABASE_URL=postgres://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require

JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=7d
COOKIE_SECURE=false

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_FOLDER=eunik

PAYSTACK_SECRET_KEY=sk_test_...
PAYSTACK_PUBLIC_KEY=pk_test_...
PAYSTACK_WEBHOOK_SECRET=

RESEND_API_KEY=re_...
MAIL_FROM="Eunik Clothings <hello@eunikclothings.com>"
MAIL_DEV_TO=

GEOIP=0
```

Aiven PostgreSQL: use the `DATABASE_URL` from Aiven, ensure SSL (`sslmode=require`). Create tables by running `sql/*.sql` with your init script (or via pgAdmin).

---

## Postgres (Aiven)

Money: `INT` kobo. PKs: `CHAR(36)`. Roles/stages: `VARCHAR(32)`.

**B0:** `users` (email unique, `password_hash` â€” never plaintext), `user_nav_sections`, `refresh_tokens`, `settings`, `password_reset_tokens`.

**B1:** `categories`, `products`, `product_images`, `product_variants`, `fabrics`, `carts`, `cart_lines`, `orders`, `order_lines` (all lines), `payments`, `coupons`, `wishlists`.

**B2:** `measurement_profiles`, `custom_design_requests`, `quotations`, `production_orders`, `fittings`, `appointments`, `leads`, `tickets`, `ticket_messages`, `reviews`, `attendance`, `journal_posts`, `events`, `lookbook_items`, `homepage`, `notifications`, `audit_logs`, `newsletter_subscribers`.

**B3:**

```sql
CREATE TABLE analytics_events (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(32) NOT NULL,
  path VARCHAR(255) NOT NULL,
  title VARCHAR(191),
  sku VARCHAR(32),
  query_text VARCHAR(191),
  referrer_host VARCHAR(191),
  channel VARCHAR(32) NOT NULL DEFAULT 'direct',
  utm_source VARCHAR(64),
  utm_medium VARCHAR(64),
  utm_campaign VARCHAR(64),
  device VARCHAR(16),
  country CHAR(2),
  vid VARCHAR(64),
  sid VARCHAR(64),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE analytics_daily (
  day DATE PRIMARY KEY,
  views INT NOT NULL DEFAULT 0,
  visitors INT NOT NULL DEFAULT 0,
  sessions INT NOT NULL DEFAULT 0,
  bounces INT NOT NULL DEFAULT 0,
  whatsapp_clicks INT NOT NULL DEFAULT 0,
  add_to_bag INT NOT NULL DEFAULT 0,
  purchases INT NOT NULL DEFAULT 0
);

CREATE TABLE analytics_daily_pages (
  day DATE NOT NULL,
  path VARCHAR(255) NOT NULL,
  views INT NOT NULL DEFAULT 0,
  PRIMARY KEY (day, path)
);

-- Recommended indexes (optional; create separately if you want)
-- CREATE INDEX analytics_events_created_at_idx ON analytics_events(created_at);
-- CREATE INDEX analytics_events_path_idx ON analytics_events(path);
```

Skip `/studio` and `/atelier` before INSERT. Nightly: roll up, `DELETE` events older than 90 days. Never store files in BLOB.

---

## Express

1. `helmet()`, `cors({ origin: FRONTEND_ORIGIN, credentials: true })`, `cookieParser()`, `express.json({ limit: "1mb" })`.
2. **Raw body** on `POST /v1/payments/paystack/webhook` **before** json parser.
3. `requireRole(roles, section?)` â€” clients never; super_admin always; else `user_nav_sections`.
4. `assertCanShop` â€” guest OK; `role !== 'client'` â†’ 403 `"House staff cannot order or act as clients."`
5. Copy `DEFAULT_NAV` / `canSeeSection` from `EUNIK/src/lib/rbac.ts` into `src/services/rbac.js`.

### Cloudinary

`POST /v1/uploads` â†’ `upload_stream({ folder: eunik/looks|receipts|events })` â†’ `{ url, publicId }`. Destroy on look delete.

### Paystack

1. `POST /v1/payments/paystack/initialize` `{ orderId }` â€” **server** computes kobo; never trust the client.
2. Frontend Popup with `access_code`.
3. Webhook: HMAC SHA512 `X-Paystack-Signature`; `charge.success` â†’ payment successful, bump `paid_kobo`, Resend mail. Idempotent.
4. `GET /v1/payments/paystack/verify/:reference` fallback (local without tunnel).

### Resend

| Event | Mail |
|-------|------|
| Register / new checkout book | Set-password link (24h token). **Never** put a password in the body |
| Forgot password | Same token |
| Order placed | Number, â‚¦, pickup vs delivery |
| Transfer submitted / approved / rejected | Status |
| Quote sent | Link `/account/custom` |
| Appointment confirmed | Ibadan date/time |
| Staff hired | Set-password link |

Dev without key: log HTML, still 200. B0: `POST /v1/dev/mail-test` (guarded).

### Public routes

`GET /v1/health`  
`GET /v1/products`, `GET /v1/products/:sku`, `GET /v1/categories`  
`GET /v1/journal`, `/events`, `/lookbook`, `/homepage`  
`GET /v1/orders/track/:number` (no full phone/email)  
`POST /v1/events` (rate-limit 60/min/IP)  
`POST /v1/newsletter`, `POST /v1/tickets`, `POST /v1/appointments`  
`POST /v1/auth/register|login|logout|refresh|forgot|reset`

Staff: `/v1/studio/*` + `POST /v1/uploads`.  
`GET /v1/studio/traffic` â€” **super_admin only**.

---

## Super admin traffic (B3)

UI: `/studio/analytics` tabs **Sales | Traffic**. Traffic tab only if `user.role === "super_admin"`. Finance 403s the API.

Events: `page_view`, `view_item`, `add_to_bag`, `begin_checkout`, `purchase`, `whatsapp_click`, `bespoke_submit`, `book_submit`, `newsletter_subscribe`, `register`, `search`.

Report: views, visitors, sessions, bounce, pages/session, channels, referrers, UTMs, device, geo, top pages/SKUs, funnels, conversion (sessionâ†’purchase, sessionâ†’WhatsApp). Shape = `TrafficReport` in the frontend audit Â§13.3.

Cookie `eunik_vid` only after Allow. `sendBeacon` to `POST /v1/events`.

Cron (Render/host): `0 2 * * * node /app/src/jobs/rollTraffic.js`  # adjust path for your Render filesystem

---

## Local vs Render

| | Local | Render |
|--|-------|--------|
| API | `nodemon` :5050 | Render app, `npm start` |
| Postgres | Docker (or local) DB `eunik` | Aiven PostgreSQL via `DATABASE_URL` |
| Paystack webhook | `ngrok http 5050` | `https://api.eunikclothings.com/v1/payments/paystack/webhook` |
| Frontend | Vite :5173 | `dist` or Vercel |

Do not run nodemon in production. Do not commit `.env`.

---

# Phases (backend + frontend wire)

Each phase: **checklist â¬œ â†’ implement â†’ wire UI â†’ exit script â†’ âœ…**.

---

## âœ… B0 â€” Express + Postgres + auth + RBAC + Resend smoke

**Goal:** Node boots; Olamide and Ade sign in from the **real login screens**.

### Backend âœ…

- [x] âœ… `package.json`, `nodemon.json`, `.env.example`, `src/server.js`, `src/app.js`
- [x] âœ… `sql/001_init.sql` users, nav, refresh, settings, reset tokens
- [x] âœ… `sql/002_seed.sql` â†’ `src/jobs/seedUsers.js` hashed passwords (no plaintext)
- [x] âœ… `GET /v1/health` â†’ `{ ok: true, db: "up" }`
- [x] âœ… `pg` pool / client configured for SSL
- [x] âœ… `POST /v1/auth/register|login|logout|refresh|forgot|reset`, `GET /v1/auth/me`, `POST /v1/auth/change-password`
- [x] âœ… JWT httpOnly cookies (accessToken 15 m + refreshToken 7 d, rotated on refresh)
- [x] âœ… `requireRole` + super_admin bypass + nav ticks (`src/services/rbac.js`)
- [x] âœ… CORS `FRONTEND_ORIGIN`, helmet, rate-limit login (20 req / 15 min)
- [x] âœ… Resend `POST /v1/auth/dev/mail-test` (dev only, logs to console without key)

### Frontend wire âœ…

- [x] âœ… `EUNIK/src/api/http.ts` â€” `httpAuth.login|me|logout|register|forgotPassword|resetPassword|changePassword`
- [x] âœ… `db.auth.login|me|logout|register|requestPasswordReset` delegate to `httpAuth` when `VITE_API_URL` is set; fall back to localStorage demo when not set
- [x] âœ… Set `VITE_API_URL=http://localhost:5050/v1` in `EUNIK/.env.local` to activate

### Exit script (must pass before âœ…)

1. `npm run dev` in this repo; Vite in EUNIK.  
2. Studio login `olamide@â€¦` â†’ `/studio`.  
3. Client login Ade â†’ `/account`.  
4. Ade opening `/studio` redirects.  
5. Postgres/local (pgAdmin) shows `users.password_hash`, not `EunikHouse2026!`.  
6. `POST /v1/auth/dev/mail-test` appears in Resend (or console in dev).

**Stop without âœ… if login still uses localStorage.**

---

## âœ… B1 â€” Catalog, cart, Cloudinary, Paystack, transfer

**Goal:** Guest buys a Senator on the **website**; money is Postgres-truth.

### Backend âœ…

- [x] âœ… `sql/003_catalog.sql` â€” categories, products, variants, fabrics, coupons, carts, orders, payments, wishlists
- [x] âœ… `src/jobs/seedCatalog.js` â€” all 49 SKUs + 5 categories + variants + fabrics seeded
- [x] âœ… `GET /v1/products`, `GET /v1/products/:sku`, `GET /v1/categories`
- [x] âœ… `POST /v1/cart/lines` with `assertCanShop` (staff 403), guest cookie owner
- [x] âœ… `POST /v1/orders` â€” all `order_lines` in a transaction; stock decrement; restore on cancel
- [x] âœ… Existing email at checkout â†’ `{ needsLogin: true }` (no session hijack)
- [x] âœ… `POST /v1/uploads` â†’ Cloudinary `upload_stream`
- [x] âœ… Paystack `initialize` (server kobo) + webhook HMAC + `verify/:reference` fallback
- [x] âœ… Bank transfer `POST /v1/payments/transfer` + finance `PATCH .../approve|reject` + Resend mail
- [x] âœ… Resend order confirmation mail on `placeOrder`

### Frontend wire âœ…

- [x] âœ… `httpProducts`, `httpCategories`, `httpSettings`, `httpCart`, `httpOrders`, `httpPayments`, `httpUploads` in `http.ts`
- [x] âœ… `db.products.list|getBySlug|getBySku`, `db.cart.get|add`, `db.orders.listMine|listAll|get` delegate to HTTP when `VITE_API_URL` is set

### Exit script (must pass before âœ…)

1. Guest adds SEN to bag, checkout **Paystack test**, webhook (ngrok) â†’ order `successful`.  
2. Second browser: login that email (set-password mail) â†’ order is there.  
3. Guest transfer: receipt appears in Studio Payments; finance approve.  
4. Staff account: Add to bag 403 / no bag.  
5. Image on Cloudinary dashboard, not a data URL in Postgres.  
6. Checkout with `ade@eunik.demo` without password **does not** become Ade.

---

## âœ… B2 â€” House OS

**Goal:** Desk, designer, finance, floor share one Postgres house.

### Backend âœ…

- [x] âœ… `sql/004_house.sql` â€” measurements, custom, quotations, production, fittings, appointments, leads, tickets, reviews, attendance, journal, events, lookbook, homepage, notifications, audit
- [x] âœ… `POST /v1/studio/quotes` create + `PATCH` revise + accept/reject per role
- [x] âœ… `POST /v1/studio/production/:id/advance` â€” legal stage ACL per role
- [x] âœ… `POST /v1/studio/appointments`, `PATCH .../status` (desk/manager confirm â†’ Resend mail)
- [x] âœ… `POST /v1/studio/leads/:id/claim?openTicket` â†’ ticket created
- [x] âœ… `GET /v1/studio/tickets`, replies, attendance clock-in/out
- [x] âœ… `POST /v1/studio/people/hire` (bcrypt temp hash, Resend hire mail) + `PATCH /v1/studio/staff/:id/nav`
- [x] âœ… Content: journal, events, lookbook, homepage CRUD
- [x] âœ… `GET /v1/studio/notifications` + mark-read + mark-all-read
- [x] âœ… `GET /v1/studio/audit` (super_admin / manager only)
- [x] âœ… Public: `POST /v1/appointments`, `POST /v1/tickets`, `POST /v1/newsletter`, `POST /v1/leads`

### Frontend wire âœ…

- [x] âœ… `httpCustom`, `httpQuotations`, `httpProduction`, `httpPeople`, `httpAppointments`, `httpLeads`, `httpNotifications`, `httpAudit`, `httpStudioSettings` in `http.ts`
- [x] âœ… `db.quotations.accept|reject|revise`, `db.production.moveStage`, `db.people.setNav`, `db.leads.claim`, `db.notifications.*`, `db.audit.list` delegate to HTTP when set

### Exit script (must pass before âœ…)

1. Browser A finance: approve Funmi transfer.  
2. Browser B tailor: Cutting shows that ticket.  
3. Designer revises a quote; Ade accepts and pays deposit; ticket in Waiting then floor.  
4. Olamide hires a desk user, ticks Orders + Clients, logs in as them â€” only those doors.  
5. Staff still cannot checkout.

---

## âœ… B3 â€” Traffic (super admin)

**Goal:** Olamide sees **real** views from the running website.

### Backend âœ…

- [x] âœ… `sql/005_traffic.sql` â€” `analytics_events` + 5 nightly rollup tables (daily, pages, skus, channels, devices)
- [x] âœ… `POST /v1/events` â€” public, strips `/studio`+`/atelier`, rate-limit 60/min, always 204 (fire-and-forget)
- [x] âœ… `GET /v1/studio/traffic?range=` â€” `super_admin` only; returns full `TrafficSnapshot`; finance gets 403
- [x] âœ… `src/services/trafficService.js` â€” `ingestEvent` (channel/UTM classification) + `buildReport` (summary, series, funnels, conversion)
- [x] âœ… `src/jobs/rollTraffic.js` â€” nightly rollup SQL + purge events > 90 days
- [x] âœ… Cron: `0 2 * * * node /app/src/jobs/rollTraffic.js`; `npm run roll:traffic` for manual run

### Frontend wire âœ…

- [x] âœ… `track.ts` rewritten â€” `sendBeacon` to `/v1/events` when `VITE_API_URL` set; localStorage fallback in demo
- [x] âœ… `eunik_vid` visitor cookie only set after user clicks "Allow cookies" in `CookieBanner`
- [x] âœ… Session id `sid` auto-created per tab (in-memory, not persisted)
- [x] âœ… UTM params (`utm_source`, `utm_medium`, `utm_campaign`) forwarded with every event
- [x] âœ… `db.analytics.traffic()` delegates to `httpTraffic.report()` when API is set; finance still gets 403 from server
- [x] âœ… `db.analytics.studioOverview()` delegates to `httpOverview.get()` when API is set

### Exit script (must pass before âœ…)

1. Guest: Home â†’ Shop â†’ PDP SEN â†’ WhatsApp click.  
2. Olamide Traffic: views, `/shop`, that SKU, `whatsapp_click` â‰¥ 1.  
3. Finance login: Traffic API 403; Sales still loads.  
4. Staff browsing studio does **not** inflate public views.

---

## â¬œ C0 â€” Cutover

**Goal:** Live house; demo DB gone.

### Backend / ops â¬œ

- [ ] â¬œ Render Node app `npm start` (no nodemon)
- [ ] â¬œ Postgres import + nightly `pg_dump` backup / restore test
- [ ] â¬œ Paystack **live** webhook SSL
- [ ] â¬œ Resend DNS SPF/DKIM `eunikclothings.com`
- [ ] â¬œ Cloudinary production folder
- [ ] â¬œ SSL on API + frontend

### Frontend wire â¬œ

- [ ] â¬œ `VITE_API_URL` production
- [ ] â¬œ `database.ts` exports HTTP only; `persist.ts` gated/demo-off
- [ ] â¬œ `demoMode` false: no role switcher, no password chips, no invented charts, no demo banner

### Exit script (must pass before âœ…)

1. Fresh phone browser: shop â†’ Paystack **or** transfer â†’ thank you â†’ login â†’ order.  
2. Olamide Traffic shows **todayâ€™s** live views.  
3. Reset demo in Settings is gone or clearly staging-only.  
4. No `eunik-demo-db` orders on production.

---

## What not to build in v1

- GraphQL, Prisma, Redis, Elasticsearch, live visitor websocket  
- Card data (Paystack only)  
- WhatsApp Cloud API (keep `wa.me`)  
- Google Analytics as SSOT  
- Nodemon / demo passwords on the live Node app  

---

## Resume checklist (after a drop)

1. Open **this README**.  
2. Read [Resume log](#resume-log).  
3. If a phase is ðŸŸ¡, finish **that** phaseâ€™s remaining â¬œ items, wire frontend, run **exit script**, then âœ….  
4. Do not start the next phase until the board row is âœ….  
5. Frontend F0â€“F2: same rule in [`EUNIK/docs/EUNIK_FRONTEND_AUDIT.md`](../EUNIK/docs/EUNIK_FRONTEND_AUDIT.md).
