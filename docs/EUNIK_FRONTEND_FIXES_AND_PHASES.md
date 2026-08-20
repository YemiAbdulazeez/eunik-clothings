# EUNIK Frontend — Fixes, Demo Database & Implementation Phases

> **Purpose:** Build a **client-presentable, fully clickable fashion house** on the current Vite React app **without a live backend**. One TypeScript module — `src/db/database.ts` — is the **single source of truth**. It holds demo seed data for every user type, exposes functions that **look like API calls**, and persists mutations so a walkthrough survives refresh.
>
> **When the backend is ready:** swap `src/db/database.ts` for `src/api/http.ts` behind the same function signatures in `src/db/client.ts`. UI code must never import tables directly.
>
> **Companion specs (do not contradict visual rules)**
> | File | Authority |
> |------|-----------|
> | `docs/EUNIK_DASHBOARD_UI.md` | How auth, `/account`, `/studio`, `/atelier` **look** |
> | `docs/EUNIK_FASHION_HOUSE_PLATFORM.md` | Domain, routes, SKUs, workflows, ₦, WhatsApp |
> | **This file** | **Fixes, demo architecture, seeds, phases, presentation script** |
>
> **This file supersedes** platform spec §0.7 (“do not fake backend”) and §26 (API-first phases) **for the client demo only**. Those sections return to force once `backend-eunik` exists. Until then, a coherent in-browser store **is** the product.
>
> **North star:** *The founder can log in as a client, a tailor, and himself, buy a Senator, request a bespoke Agbada, see it on the cutting rail, and it still looks like EUNIK — not a spreadsheet in a tuxedo.*

---

## 0. Non-negotiable demo rules

1. **One database module.** No second product list in `Home.tsx`. `catalog.ts` becomes a thin re-export from `database` or is deleted after migration.
2. **One adapter.** Pages call `db.products.list()`, `db.auth.login()`, `db.orders.create()` — never `SEED.products.filter` from a component.
3. **All user types are seeded and log-in-able.** Demo emails + one shared password, visible on auth screens as presentation chips.
4. **Mutations are real inside the demo.** Adding to bag, accepting a quote, moving a garment from Cutting → Sewing must update the same store every screen reads.
5. **Persist to `localStorage` key `eunik-demo-db`.** Survive refresh during a pitch. Provide **Reset demo** in studio settings (and `db.reset()`).
6. **Fake network.** Every adapter function `await delay(200–500)` so skeletons flash and it feels like a server.
7. **Payments are Naira only, two methods:** (1) **Paystack** (demo popup/reference — no live charge until keys exist). (2) **Bank transfer** — customer must enter a **transaction number** and **upload a receipt image**; finance approves in studio. Banner on Paystack: *Demo checkout — no card is charged.* Never add Flutterwave.
8. **WhatsApp stays.** Dual CTA on PDP: Add to bag (db) + Order on WhatsApp (existing helper, plus `db.leads.create`).
9. **Marketing look stays.** Gold `#eeb167`, ink `#232323`, Outfit + Figtree, existing Header/Footer on public routes.
10. **Catch-all route is a bug.** Replace `path="/:slug"` before adding `/shop` or `/account` or those URLs will render `CategoryPage`.

---

## 1. Current-app fixes (do these in Phase 0)

These are defects or leftovers from the HTML conversion. Fix them **before** new commerce chrome so the client does not see them in the pitch.

### 1.1 Copy & currency

| ID | Where | Now | Fix |
|----|-------|-----|-----|
| F01 | `Header.tsx` gold bar | `orders over #100,000` | `orders over ₦100,000` |
| F02 | `Home.tsx` marquee | `orders over #100,000` | `₦100,000` |
| F03 | `Home.tsx` perks | `30 days of free ammendment` | `30 days of free amendment` |
| F04 | `About.tsx` trust strip | `10000+` people, `4.9` / `8549` reviews | CMS/demo stats from `db.settings` **or** hide the fake 8549. Suggested demo: “Clients across Oyo, Lagos, Abuja & Ekiti” + hide numeric review count until real reviews exist |
| F05 | `Home.tsx` promo `EUNIK-DEC-2024` | Static, undated | Bind to `db.coupons.get('EUNIK-DEC-2024')`. If `expires_at` is past, hide strip. Seed as active for the demo |
| F06 | Footer copyright | Hardcoded 2024 in old HTML (React already uses `new Date()`) | Keep dynamic year; no change if already current |

### 1.2 Routing

| ID | Where | Now | Fix |
|----|-------|-----|-----|
| F07 | `App.tsx` | `/:slug` catch-all after contact | **Explicit** category routes: `/aranbada`, `/men-senator`, `/agbada`, `/esiki`, `/suit`. Unknown paths → a small `NotFound` marketing page, not Category |
| F08 | Header Featured / Magazine | Hash `/#featured`, `/#news` | Keep hashes on Home. From other pages, `to="/#featured"` already works via `Layout` scroll. After Journal CMS, Magazine can go to `/journal` **and** keep home `#news` |
| F09 | Future `/shop`, `/account`, `/studio` | Would be eaten by `/:slug` | F07 unblocks this. Register OS routes **outside** the marketing `Layout` route group |

### 1.3 Data architecture

| ID | Where | Now | Fix |
|----|-------|-----|-----|
| F10 | `src/data/catalog.ts` | Only SSOT for products | Fold into `database` seed. `catalog.ts` re-exports `db.products` helpers **or** delete and update imports in Home/Collection/Category/ProductCard |
| F11 | `Product` type | `id, sku, name, image, category, featured?` | Extend in `src/db/types.ts`: prices (kobo), descriptions, flags `sells_rtw` / `sells_mtm`, images[], featured_rank, status |
| F12 | Case-sensitive images | `ara5000.JPG`, `sen3005.JPG`, `sen3006.JPG` | Keep exact paths in seed. Do not lowercase |
| F13 | `public/images/sen3020.jpg` | On disk, not in catalog | Do **not** auto-publish. Optional seed `status: 'draft'` media only |
| F14 | Prices | None | Seed demo ₦ prices (see §5.5) so cart/checkout/studio KPI charts have numbers |

### 1.4 Commerce leftovers

| ID | Where | Now | Fix |
|----|-------|-----|-----|
| F15 | `ProductCard` | WhatsApp only | Add hover/stack: Order Now (WhatsApp) **and** Add to bag when `sells_rtw` or `sells_mtm`. Bag writes `db.cart.add` |
| F16 | Contact form | `mailto:` only | `db.tickets.create` + toast “Received at the house.” Optional mailto fallback |
| F17 | Footer newsletter | Local React state | `db.newsletter.subscribe(email)` persisted |
| F18 | Footer payment line | Missing icons from old HTML | Text: **Paystack · Bank transfer**. No Flutterwave |
| F19 | Policies | Raw JPG links | Routes `/policies/order` and `/policies/jobs` that still show the existing JPGs |
| F20 | About “10000+ / 4.9” | Template | Tied to F04 |

### 1.5 Product OS tokens (no visual change on `/`)

| ID | Where | Now | Fix |
|----|-------|-----|-----|
| F21 | `src/index.css` | Marketing `@theme` only | Add `.eunik-os { … }` tokens from dashboard spec §18 **without renaming** `--color-gold` / `--color-ink` |
| F22 | `App.tsx` | Single `Layout` | Nested routers: marketing `Layout` vs `AccountLayout` / `StudioLayout` / `AtelierLayout` with class `eunik-os` |

### 1.6 UX paper cuts

| ID | Where | Now | Fix |
|----|-------|-----|-----|
| F23 | Home hero | 3 slides, store empty titles | Keep; later bind to `db.homepage.heroSlides` |
| F24 | Category sidebar labels | Mixed “Aran'bada” vs “Ara'nbada” | Standardize **Ara'nbada** everywhere |
| F25 | Cookie banner | localStorage `eunik-cookies` | Keep; do not collide with `eunik-demo-db` |
| F26 | No 404 | Catch-all hid this | Dedicated `NotFound.tsx` in marketing shell |

Do **not** wait for all of F01–F26 to finish commerce, but **F07 + F10 + F11 + F14 + F21** are blockers for a honest demo.

---

## 2. Demo architecture — single source of truth

### 2.1 File map

```text
src/db/
  types.ts          // all domain types (Product, User, Order, …)
  seed.ts           // immutable factory: returns a fresh SeedState
  persist.ts        // load/save localStorage, version migrate
  delay.ts          // sleep(ms) for fake latency
  session.ts        // currentUserId in sessionStorage (tab-scoped)
  client.ts         // THE adapter: db.auth, db.products, db.orders, …
  database.ts       // re-exports db + types (import { db } from '@/db/database')
  index.ts          // optional barrel

src/context/
  SessionProvider.tsx   // current user, login, logout
  CartProvider.tsx      // wraps db.cart for header badge

src/data/catalog.ts     // deprecated: re-export from db until call sites move
```

**Vite alias:** `"@": "/src"` in `vite.config.ts`.

### 2.2 Shape of the store

```ts
type DbState = {
  meta: { version: number; seededAt: string };
  settings: Settings;
  users: User[];                 // clients + staff (role on user)
  products: Product[];
  categories: Category[];
  collections: Collection[];
  fabrics: Fabric[];
  variants: ProductVariant[];
  customizations: ProductCustomization[];
  coupons: Coupon[];
  carts: Cart[];                 // one per userId or guestId
  wishlists: WishlistItem[];
  measurementProfiles: MeasurementProfile[];
  customDesignRequests: CustomDesignRequest[];
  quotations: Quotation[];
  orders: Order[];
  orderItems: OrderItem[];
  payments: Payment[];
  productionOrders: ProductionOrder[];
  productionTasks: ProductionTask[];
  appointments: Appointment[];
  fittings: Fitting[];
  alterations: Alteration[];
  qualityChecks: QualityCheck[];
  reviews: Review[];
  tickets: SupportTicket[];
  notifications: Notification[];
  leads: ChannelLead[];          // WhatsApp
  journalPosts: BlogPost[];
  events: Event[];
  lookbookItems: LookbookItem[];
  homepage: HomepageContent;
  media: MediaAsset[];
  auditLogs: AuditLog[];
  attendance: AttendanceEvent[];
};
```

`SEED_VERSION`: bump when seed shape changes; `persist.ts` wipes storage if stored version < seed version so old pitches do not crash.

### 2.3 Persistence protocol

```text
Boot
  if localStorage['eunik-demo-db'] missing or version stale
    → state = seed()
    → save()
  else
    → state = JSON.parse

Every db.*.write
  → mutate in-memory singleton
  → save()
  → return Promise.resolve(result) after delay

db.reset()
  → localStorage.removeItem
  → state = seed()
  → clear session
```

In-memory singleton (module scope) so React query hooks and a second tab in the same SPA share data after save. Pitch: one browser profile.

### 2.4 Adapter signatures (mimic backend)

This is the **contract** the future HTTP client must match. Keep return types stable.

```ts
export const db = {
  auth: {
    login(email, password): Promise<Session>
    register(input): Promise<Session>          // role always 'client'
    logout(): Promise<void>
    me(): Promise<User | null>
    requestPasswordReset(email): Promise<void> // demo: always “sent”
    demoAccounts(): DemoChip[]                 // for login page only
  },
  products: {
    list(filter?: ProductFilter): Promise<Product[]>
    getBySlug(slug: string): Promise<Product | null>
    getBySku(sku: string): Promise<Product | null>
    featured(): Promise<Product[]>             // preserve featuredOrder
    update(id, patch): Promise<Product>        // studio only
  },
  categories: { list(), get(slug), counts() },
  cart: {
    get(userId | guestId): Promise<Cart>
    add(line): Promise<Cart>
    updateQty(lineId, qty): Promise<Cart>
    remove(lineId): Promise<Cart>
    revalidate(): Promise<{ cart, warnings[] }> // stub: prices from products
  },
  checkout: {
    quoteShipping(address | 'pickup_ibadan'): Promise<number /* kobo */>
    applyCoupon(code): Promise<Coupon | { error }>
    placeOrder(payload): Promise<Order>
    // payload.payment.method: 'paystack' | 'bank_transfer'
  },
  payments: {
    list(),
    getByOrder(orderId),
    initializePaystack(orderId, amountKobo): Promise<{ reference: string; demo?: boolean }>
    completePaystack(reference): Promise<Payment>       // demo verify; later webhook
    submitTransfer(orderId, { transactionNumber, receiptFile }): Promise<Payment>
      // status awaiting_verification; receipt stored as data URL / media blob in demo
    reviewTransfer(paymentId, 'approve' | 'reject', reason?: string): Promise<Payment>
  },
  orders: {
    listMine(), listAll(filter), get(id),
    updateStatus(id, status),
    payBalance(orderId, paymentChoice)         // same two methods as checkout
  },
  wishlist: { list(), add(productId), remove() },
  measurements: {
    listByCustomer(customerId),
    get(id),
    create(input),
    snapshotForOrder(profileId)                // freeze JSON
  },
  customDesigns: { create(), listMine(), listAll(), get() },
  quotations: {
    createFromRequest(requestId, lines),       // staff
    accept(id), reject(id)                     // client → may spawn Order
  },
  production: {
    listBoard(),
    moveStage(productionOrderId, stage),
    assignTask(taskId, staffUserId)
  },
  fittings: { list(), create(), update() },
  appointments: { create(), listMine(), listAll(), setStatus() },
  leads: { createFromWhatsApp(productId), listUnclaimed(), claim(id, staffId) },
  tickets: { create(), list() },
  newsletter: { subscribe(email) },
  reviews: { create(), listApproved(), moderate() },
  content: {
    homepage(), journal(), events(), lookbook(),
    updateHomepage(patch)                      // content manager
  },
  analytics: { studioOverview(), salesSeries(), revenueMix() },
  people: { customers(), staff(), updateUser() },
  settings: { get(), update() },
  audit: { log(), list() },
  reset(): Promise<void>
};
```

**Authorization in the demo:** `assertRole(user, permission)` inside adapter writes. If the logged-in tailor hits `db.products.update`, throw `ForbiddenError` so the UI can toast. This makes the RBAC story visible to the client even without a server.

**IDs:** `crypto.randomUUID()` or `ord_1003` sequential for readable pitch numbers.

**Money:** integers **kobo**. UI formats with `en-NG`. `45_000_00` = ₦45,000.

### 2.5 Session

- `sessionStorage['eunik-demo-session'] = { userId, role }`
- Tab-scoped: safer if the presenter opens client + studio in two windows? Use **localStorage** for session if they demo two windows in one profile — **use localStorage `eunik-demo-session`** so two tabs share the store AND need two browsers (or incognito) for two roles at once.
- **Presentation recommendation:** Chrome normal = Super Admin; Chrome Incognito = Client. Same `eunik-demo-db` in localStorage is origin-shared even in incognito? **Incognito does NOT share localStorage with normal.** For a two-role live demo, use **one tab and the studio “View as”** OR a floating **role switcher** visible only when `settings.demoMode === true`.

**Must-have for pitch:** `DemoRoleSwitcher` in a gold/ink pill, bottom-right, **only if** current user has `staff` and `settings.demoMode`. Actions: “Act as Client (Ade)” / “Act as Tailor” / “Back to admin”. Swaps session userId without logout dance.

### 2.6 How the real backend will replace this

```text
Today:   Page → db.orders.create() → mutate memory + localStorage
Later:   Page → db.orders.create() → fetch('/api/orders') 
```

`src/db/client.ts` becomes:

```ts
export const db = import.meta.env.VITE_API_URL
  ? createHttpClient(import.meta.env.VITE_API_URL)
  : createDemoClient();
```

Do not sprinkle `fetch` in pages.

---

## 3. Demo users — every type, log-in-ready

**Shared password (all demo users):** `EunikHouse2026!`  
Document on every auth screen: *Presentation accounts — not production.*

Login pages (`/account/login`, `/studio/login`) render chips from `db.auth.demoAccounts()`. Clicking a chip fills email + password.

### 3.1 Clients (customer portal `/account`)

| Email | Name | Demo story |
|-------|------|------------|
| `ade@eunik.demo` | Adewale “Ade” Banjo | Primary walkthrough client. Has measurement profile, open MTM order, pending quote, ₦ balance, wishlist, appointment |
| `funmi@eunik.demo` | Funmilayo Okonkwo | Wedding bespoke in Sewing. Heavy CRM notes (“relaxed Agbada, wine preferred”) |
| `guest.checkout` | (no user until guest RTW) | Guest cart allowed for RTW only |

Ade password same shared. Phone `0803 111 2222`. Address: Bodija, Ibadan.

### 3.2 Staff (Fashion House OS `/studio` and Atelier `/atelier`)

Route after login by role:

| Role | Email | Lands on | Can see (demo) |
|------|-------|----------|----------------|
| Super Admin | `olamide@eunik.demo` | `/studio` | Everything. Display name **Olasedidun Olamide A.** |
| Manager | `manager@eunik.demo` | `/studio` | Ops, no Settings.staff.permissions edit |
| Sales / Front desk | `desk@eunik.demo` | `/studio` (commerce) | Clients, quotes, appointments, WhatsApp leads |
| Fashion Designer | `designer@eunik.demo` | `/studio/custom` | Requests, lookbook notes |
| Tailor | `tailor@eunik.demo` | `/atelier` | Assigned sewing only, no ₦ KPIs |
| Cutter | `cutter@eunik.demo` | `/atelier` | Cutting queue |
| Finishing / QC | `qc@eunik.demo` | `/atelier` | QC checklist |
| Finance | `finance@eunik.demo` | `/studio/payments` | Payments, balances, no production move |
| Content Manager | `content@eunik.demo` | `/studio/content` | Homepage, journal, events, lookbook |

Add `studioSections[]` per dashboard spec so Manager vs Content nav differs.

**IDs:** `user_ade`, `user_olamide`, `user_tailor`, etc. for readable seed FKs.

### 3.3 Permissions cheat-sheet (demo enforce)

```text
olamide     * 
manager     all except staff.create, settings.payments
desk        customers, orders, quotes, appointments, leads
designer    custom-designs, lookbook, products.view
tailor      production.update on assigned tasks, fittings.notes
cutter      production.update if stage in {cutting}
qc          quality.approve
finance     payments.*, analytics.finance, refunds.create
content     content.*, media.*, products.view
ade/funmi   own orders, measurements, appointments, wishlist
```

---

## 4. Seed content the pitch must be able to open

Do not seed an empty studio. Preload a **living house**.

### 4.1 Catalog

- All **49** products from platform spec §1.4
- Categories + counts
- `featured_rank` exact home order
- Demo prices (kobo) — suggested bands:
  - Ara'nbada: ₦85,000–₦140,000
  - Senator: ₦65,000–₦120,000
  - Agbada: ₦180,000–₦450,000
  - Esiki: ₦90,000–₦160,000
  - SUIT6000: ₦220,000
- Featured looks: `sells_rtw: true` **and** `sells_mtm: true`
- Most natives: `sells_mtm: true`, `sells_rtw: false` (bag path = MTM configurator)
- At least 3 RTW-with-stock variants (e.g. SEN3002 sizes M/L/XL stock 4/2/1) so classic checkout works
- SUIT6000 RTW sizes
- Fabrics: Navy, Wine, Black, Cream, Grey Guinea / Senator cloth with yardage and one `low` status fabric for Need attention
- Coupon `EUNIK-DEC-2024` 25% on `product.tags includes dress-style` **or** storewide 25% for demo simplicity, `expires_at` far future
- `sen3020` media unused

### 4.2 Ade’s storyline (login as client)

1. Wishlist: ARA5001, SEN3008
2. Measurement profile “Ade — Current” (filled cm) + “Ade — Wedding” (empty extra native fields)
3. Order `#1001` MTM SEN3002, stage **Sewing**, deposit ₦70,000 paid of ₦110,000 via **Paystack** (`PAY_demo_ade_deposit`), balance ₦40,000
4. Quotation `Q-2026-00012` for a custom wine Agbada, status **sent**, deposit ₦250,000 of ₦450,000 — waiting accept (pay with Paystack **or** transfer + receipt)
5. Appointment: Measurement follow-up tomorrow 11:00 Ibadan HQ
6. Notification: “SEN3002 at sewing — we’ll call for first fitting”

### 4.3 Funmi’s storyline

- Bespoke Agbada AGB2003-inspired, production **Cutting**, assigned cutter
- Internal CRM note on Funmi

### 4.4 House operations

- ChannelLead: one unclaimed WhatsApp click for ARA5008
- Production board: #1001 Sewing (tailor), Funmi Cutting (cutter), one Ready for pickup
- Today’s appointments: Ade + a walk-in consultation
- Low stock fabric “Wine brocade”
- Journal: 4 existing magazine quotes as `BlogPost` published (bind Home `#news` to `db.content.journal()`)
- Events: one upcoming “Heritage trunk show — Ibadan”
- Lookbook: 5 tiles from arrival rail images
- Support ticket from Contact seed
- Payments: Ade deposit successful, method `paystack`. Funmi (or a third row) **awaiting_verification** bank transfer with a seeded receipt image + transaction number for finance to Approve in the pitch
- Audit log: two lines (price change SUIT6000, stage move #1001)

### 4.5 Homepage seed

Mirror current `Home.tsx` sections as `homepage.sections[]` so Content Manager can hide magazine without code. Default = today’s design.

### 4.6 Settings seed

```text
company: EUNIK CLOTHINGS
rc: 1869194
phone: 08167073585
whatsapp: 2348167073585
email: info@eunikclothings.com
address: Ibadan, Oyo State, Nigeria
currency: NGN
freeShippingKobo: 10000000   // ₦100,000
demoMode: true
depositPercentDefault: 60
pickupLocation: Eunik HQ, Ibadan
bank:
  bankName: Access Bank (demo)
  accountName: EUNIK MULTIPURPOSE COMPANY NIGERIA LIMITED
  accountNumber: 0000000000   // replace with real house account before go-live
  narrationHint: "Use your order number as narration"
paystack:
  publicKey: pk_test_xxx   // from env later; demo ignores live charge
```
```

---

## 5. Implementation phases (frontend + database.ts)

Each phase is **demo-complete**: something the client can click. Do not open Phase 2 until Phase 1 bag/checkout works.

Visual: marketing = existing language; OS = `EUNIK_DASHBOARD_UI.md`.

---

### Phase 0 — Foundation, fixes, database

**Goal:** App still looks like today, but data comes from `db`, routes are safe, copy is clean.

**Do**

1. Add `@` alias, `src/db/**`, `SEED_VERSION = 1`
2. Port `catalog.ts` 49 products + categories into `seed.ts` + demo prices
3. Migrate Home, Collection, Category, ProductCard to `db.products.*` / `db.categories.*`
4. Apply fixes F01–F07, F10–F14, F21, F24, F26
5. Explicit routes; `NotFound`
6. `SessionProvider` (null user)
7. Banner only in `import.meta.env.DEV`: “Demo store · Reset from studio later”

**Done when:** `npm run build` passes; `/` identical visually except ₦ in gold bar and amendment spelling; products still WhatsApp-orderable; incognito fresh load reseeds.

**Present:** optional — “under the hood we now have a real data layer.”

---

### Phase 1 — Shop, PDP, bag, demo checkout (client wow #1)

**Goal:** Walk from Home → PDP → bag → checkout → confirmation **as guest**, then see the order in `db.orders`.

**Do**

- Header: Shop, Bag (count from `CartProvider`)
- `/shop` filters: category, sort featured/newest/price
- `/shop/:sku` marketing PDP: gallery (single image ok), ₦, SKU pill, Add to bag, Order on WhatsApp, MTM CTA if `sells_mtm`, size selector if variants
- `/cart`, `/checkout`
  - Pickup Ibadan vs delivery
  - Coupon `EUNIK-DEC-2024`
  - **Pay with Paystack** (demo success + `PAY_demo_*` reference, labelled *Demo — no card charged*)
  - **or Pay by bank transfer**: show house account, required **transaction number** + **receipt upload**; status `awaiting_verification` until finance approves
- Free shipping ≥ ₦100,000
- Confirmation page `/orders/thank-you/:id`
- `db.leads.createFromWhatsApp` when WhatsApp clicked
- Policies pages

**Still no auth required** for RTW. MTM “Make to measure” on PDP can deep-link to Phase 3 or prompt “Create account” stub.

**Done when:** Guest buys SUIT6000 or SEN3002 L; thank-you shows ₦; localStorage contains the order; WhatsApp still opens.

**Present:** classic e-commerce on the existing gold/ink site.

---

### Phase 2 — Auth + three shells + demo users (client wow #2)

**Goal:** Log in as Ade, Olamide, Tailor. Dashboards read the same `db`.

**Do**

- Auth split screens per dashboard spec (campaign photos client; ink gradient staff)
- Demo account chips
- `DemoRoleSwitcher` if `demoMode`
- `/account` overview: greeting, need-action (Ade’s quote + balance + fitting), 4 KPIs, tracker for #1001
- `/account/orders`, measurements (read-only list ok), appointments, wishlist, payments
- `/studio` overview: Need attention (unclaimed WA, delayed, low fabric, today’s fittings), ₦ KPIs from `db.analytics.studioOverview()`, donut revenue mix, recent orders table
- `/atelier` : “On your bench” from assigned tasks
- RBAC: tailor visiting `/studio` redirects to `/atelier`; client cannot open `/studio`
- `db.reset()` behind studio Settings → “Reset presentation data”

**Done when:** Three browsers/tabs via role switcher show Ade’s sewing order as revenue on Olamide’s dashboard and as a card on the tailor’s bench.

**Present:** “One house, three doors.”

---

### Phase 3 — MTM, bespoke, quotes, production (client wow #3)

**Goal:** Full house story without a backend.

**Do**

- PDP “Make this to measure” → fabric pills → measurement profile (Ade’s) → deposit checkout → `ProductionOrder` at Measurements confirmed
- `/bespoke` form → `customDesignRequests` → desk/designer sees it → `quotations.createFromRequest` → Ade Accept → deposit
- Production Kanban `/studio/production` + `/atelier` move stage (`db.production.moveStage`) with audit log
- Fitting create, QC checklist unlocks Ready
- Balance pay on `/account` when status Ready
- `/book` appointment writes row visible to desk
- Contact / newsletter → tickets / subscribers

**Done when:** You can take Funmi from Cutting → Sewing as tailor and Ade’s tracker ring updates after refresh.

**Present:** this is why EUNIK is not Jumia.

---

### Phase 4 — Content, lookbook, journal, events, CRM polish

**Goal:** Marketing pages become data-driven; still look editorial.

**Do**

- Bind Home hero, magazine, new-arrival, promo to `db.content`
- `/lookbook`, `/journal`, `/journal/:slug`, `/events`
- About stats from settings
- `/studio/content` simple forms (not a full CMS builder) to edit homepage headline + hide a section
- Customer dossier `/studio/customers/:id` with CRM note
- Search overlay querying products + journal
- Footer Account link
- PWA manifest optional (nice for phone pitch)

**Done when:** Content user changes magazine title in studio and Home updates after reload.

---

### Phase 5 — Presentation hardening

**Goal:** 20-minute investor/client script never 404s.

**Do**

- Empty/error/skeleton states (dashboard spec copy)
- Sonner toasts, LoadingButton
- Seed more notifications
- Demo watermark off in screenshot mode (`settings.demoMode` hides switcher)
- Script rehearsal §7
- `README` or this file’s §7 printed for the presenter
- Performance: images already large — optional `loading="lazy"` on grids
- Confirm `npm run build`

**Out of scope until backend:** live Paystack keys/webhooks, production receipt storage (S3), real SMS/email, multi-device sync, true security. Demo Paystack and `localStorage` receipts are for the pitch only.

---

## 6. Route checklist (final frontend)

### Marketing `Layout` (Header/Footer)

```text
/ /
/shop
/shop/:sku
/collection
/aranbada /men-senator /agbada /esiki /suit
/lookbook
/bespoke
/made-to-measure
/about
/journal /journal/:slug
/events /events/:slug
/contact
/book
/cart
/checkout
/orders/thank-you/:id
/search
/policies/order /policies/jobs
/404
```

### Auth (no marketing header)

```text
/account/login /account/register /account/forgot-password
/studio/login
```

Staff login can route tailor/qc/cutter → `/atelier`, others → `/studio`.

### Client `.eunik-os` `/account/*`

Overview, orders, custom-designs, measurements, appointments, fittings, payments, wishlist, reviews, support, profile, notifications.

### Studio `/studio/*`

Overview, orders, products, inventory, fabrics, customers, quotes, measurements, appointments, production, fittings, QC, payments, content, people, analytics, settings (reset demo).

### Atelier `/atelier/*`

Bench, queue, measurements, fittings, appointments, notes, attendance (stub clock in).

Redirects keep: `/about-us`, `/contact-us`.

---

## 7. Client presentation script (20 minutes)

Use **DemoRoleSwitcher** or two windows.

| Min | Action | What they should feel |
|-----|--------|------------------------|
| 0–2 | `/` Home, gold bar ₦, hero Ara'nbada, scroll featured | “This is still our site.” |
| 2–5 | Open SEN3002 PDP, ₦ price, Add to bag **and** WhatsApp | Dual world |
| 5–8 | Checkout: show **Paystack**, then **bank transfer** with transaction number + receipt upload | Naira; two ways to pay |
| 8–10 | `olamide@eunik.demo` → Payments → Approve waiting transfer receipt | Finance trust |
| 10–13 | `ade@eunik.demo` — sewing tracker, ₦40,000 balance, pending quote | Client book |
| 13–15 | Ade accepts quote (Paystack or transfer) / existing appointment | Relationship |
| 15–17 | Olamide — KPIs, unclaimed WhatsApp lead, Funmi cutting, low fabric | Owner OS |
| 17–19 | `tailor@eunik.demo` — move #1001 Sewing → Finishing; Ade tracker updates | One database |
| 19–20 | Reset demo (optional) | We can start clean |

If time: `/bespoke` form as Ade, appears as request for Olamide.

---

## 8. Definition of done (client demo)

The demo is presentable when **all** are true:

- [ ] F01–F07, F10, F11, F14, F21 fixed
- [ ] 49 products still on category URLs with original images
- [ ] Guest RTW checkout writes an order into `eunik-demo-db`
- [ ] Checkout offers **only** Paystack (demo) **or** bank transfer + receipt + transaction number; all amounts in ₦
- [ ] Finance can Approve/Reject a transfer receipt in `/studio/payments`
- [ ] All 2 clients + 9 staff emails log in with `EunikHouse2026!`
- [ ] Ade / Olamide / Tailor show the **same** order #1001 in three UIs
- [ ] WhatsApp CTA still works and creates a lead
- [ ] Production stage change persists after refresh
- [ ] `db.reset()` returns Ade’s sewing story
- [ ] Public pages still Outfit/Figtree/gold — no DM Sans, no indigo
- [ ] No page imports `SEED` tables; only `db.*`
- [ ] Checkout clearly labelled Demo Paystack / awaiting house confirmation on transfers
- [ ] `npm run build` succeeds

---

## 9. What we explicitly will not do until backend

- Charge real cards; send real SMS/email (toasts only)
- Trust this RBAC as security (client can edit localStorage)
- Sync two different devices (unless they share nothing)
- Inventory reservation races
- Image uploads to S3 (use existing `/images` + optional blob DataURL only if needed)
- SSO, MFA production, NDPC legal copy beyond the measurement privacy chip

Those wait for `backend-eunik`. The adapter in §2.6 is the hand-off.

---

## 10. Suggested ticket order (agents)

1. `db` module + seed + persist + delay + types  
2. Route F07 + NotFound  
3. Copy F01–F04  
4. Migrate catalog consumers  
5. Shop + PDP + cart + demo checkout  
6. Auth + demo chips + three layouts  
7. Seed storylines Ade/Funmi/house  
8. Studio + atelier overviews + Kanban  
9. MTM + quotes + book + leads  
10. Content bind + presentation switcher + reset  
11. Polish skeletons/toasts/PWA optional  

---

## 11. One-line north star

**Fix the naira and the catch-all route, put the whole house in `database.ts`, let every role log in, and walk the client from a gold campaign slide to a sewing ticket on the same order — then, later, unplug the file and plug in the API.**
