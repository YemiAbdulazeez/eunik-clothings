# EUNIK frontend — total audit, fixes, and phase tracker

> **Date:** 18 August 2026  
> **Scope:** The live Vite + React storefront and house OS at `C:\Users\DELL\Downloads\EUNIK`.  
> **Backend:** not in this file. Implementation + frontend **integration** tracker: [`../../backend-eunik/README.md`](../../backend-eunik/README.md) (path on disk: `C:\Users\DELL\Downloads\backend-eunik\README.md`).  
> **Method:** Source read of every public, account, studio, and atelier route; `src/db/client.ts` RBAC; shells; PWA; seed story.  
> **Companions:** `docs/EUNIK_FASHION_HOUSE_PLATFORM.md` (domain), `docs/EUNIK_DASHBOARD_UI.md` (look), `docs/EUNIK_BACKEND.md` (pointer to the API README).  
> **This file** is the as-built UI audit **and** the **F0–F2** work tracker. Prefer it over the 2026 demo-phase doc when they disagree.

---

## How to work (mandatory)

**Complete one phase. Wire it end-to-end in the running app. Only then mark it complete.**

This exists so a dropped network or a new chat can **resume** without redoing finished work.

1. Work **one phase** (`F0` → `F1` → `F2`). Do not start F1 while F0 is ⬜ or 🟡.
2. Implement the fixes **and** click the **exit script** in the browser (guest + staff accounts).
3. Change ⬜ → ✅ **only after** the exit script passes. A typed file is not done.
4. If you stop mid-phase, set 🟡 and add a row to [Resume log](#resume-log). Next session starts there.
5. Backend **B0–C0** is a separate tracker. Do not mark frontend F-phases ✅ because Express exists. Do not mark backend B-phases ✅ because a React mock exists.

| Mark | Meaning |
|------|---------|
| ⬜ | Not started |
| 🟡 | In progress — resume here; do not skip ahead |
| ✅ | Done: implemented **and** wired E2E (exit script passed) |

### Resume log

| When | Phase | Status | Where you stopped | Next action |
|------|-------|--------|-------------------|-------------|
| 18 Aug 2026 | F0 | ⬜ | Audit only; no F0 code yet | Start **F0** (A01–A09, A18) |
| 19 Aug 2026 | F1 | ✅ | F1 implemented; build + vitest pass | Start **B0** on backend README |
| 19 Aug 2026 | F2 | ✅ | F2 implemented; build passes | Wire **B0** auth E2E |

**Active phase:** none (frontend F0–F2 ✅)  
**Last ✅ phase:** **F2**  

**Backend tracker:** `backend-eunik/README.md` — Active ⬜ **B0** (frontend F0–F2 ✅; start backend wiring).

---

## 0. Verdict

The frontend is a **presentable dual product**: a gold-and-ink marketing house, and a Fashion House OS for clients, studio staff, and the atelier floor. Catalog, cart, demo Paystack, bank receipts, quotes, production tickets, CRM, content, hire + nav ticks, and public track all exist and share one store (`src/db/client.ts` → `localStorage` key `eunik-demo-db`).

It is **not** a production store, and several walkthroughs break if you leave the seeded Ade / Funmi / Olamide script.

**What is strong**

- Visual language is consistent enough to pitch: Outfit + Figtree, gold `#eeb167`, ink `#232323`.
- One `db.*` adapter. Pages do not scrape tables.
- Three shells: public `Layout`, client `AccountGate`, staff `StudioGate` / `AtelierGate`.
- Role landings and sidebar filtering exist. Super admin can hire and tick nav doors.
- Staff cannot complete client checkout, wishlist, reorder, or bespoke-as-self (API + several guards).
- Seeded story is rich enough for a 20-minute demo if you stay on the happy path.

**What fails a thorough walkthrough**

1. **Two buy paths that never meet** — WhatsApp lead vs cart checkout.
2. **RBAC is route-deep, dashboard-shallow** — tiles, CTAs, and some APIs ignore the ticks the sidebar respects.
3. **Staff shop blocking is API-complete, storefront-incomplete** — bag icon hidden; Add to bag / WhatsApp still shown on Shop and PDP.
4. **Bespoke → quote → deposit → floor is incomplete** — quotes are write-once; payments show one due order; many production stages never appear on the kanban.
5. **Orphan pages** — `/book` and `/events` are not in header or footer.
6. **Demo honesty leaks** — checkout prints `EunikHouse2026!`; existing client email at checkout is a passwordless takeover; production build has no “demo” banner.
7. **Loading / error / empty** — `useAsync` returns `error` and almost no page uses it. Empty copy flashes while data loads.
8. **No tests, no backend, no real Paystack, no real PWA cache.**

Treat this as a **client-demo operating system**. Do not put live cards, live clients, or a public domain in front of it until **F0 is ✅**.

---

## 1. Architecture (as-built)

```
Browser
  Layout (Header / Footer)          AccountGate + OsShell         StudioGate / AtelierGate + OsShell
  Shop, PDP, Cart, Checkout         /account/*                    /studio/*  |  /atelier/*
           │                                │                              │
           └────────────────────────────────┴──────────────────────────────┘
                                            │
                                   SessionProvider + CartProvider
                                            │
                              db.*  (src/db/client.ts)  + delay 200–500ms
                                            │
                         persist.ts  →  localStorage eunik-demo-db  (SEED_VERSION 4)
```

| Layer | Reality |
|-------|---------|
| Stack | React 19, TypeScript, Vite 7, Tailwind 4, React Router 7, lucide-react, recharts, sonner |
| Scripts | `dev` / `build` / `preview` only. **No tests.** |
| Money | Integer **kobo**. Display via `formatNaira`. Naira only. |
| Auth | `{ userId, role }` in `eunik-demo-session`. Passwords stored **plaintext** on `User`. Shared demo secret `EunikHouse2026!`. |
| Catalog | Seeded from the old `catalog.ts` SKUs (ARA / SEN / AGB / ESK / SUIT). Live list is `db.products`. |
| Payments | Demo Paystack reference. Bank transfer = txn number + uploaded receipt. Finance approves. |
| WhatsApp | Hardcoded `2348167073585` in `src/data/catalog.ts`. Studio `settings.whatsapp` is not used on the storefront. |
| PWA | Manifest + install prompt. `sw.js` only `skipWaiting` / `clients.claim`. **No cache, no offline.** |
| Backend | `backend-eunik` is empty. No `fetch`, no `VITE_` API URL. |

Bumping `SEED_VERSION` **silently wipes** the demo DB on next load. Studio Settings has an explicit Reset that also logs everyone out.

---

## 2. Route inventory

### 2.1 Public (`Layout`)

| Path | Screen | In header? | In footer? |
|------|--------|------------|------------|
| `/` | Home | yes | yes |
| `/shop`, `/shop/:sku` | Shop, PDP | yes | yes |
| `/collection`, `/collection/:slug` | Rails | yes | yes |
| `/aranbada`, `/men-senator`, `/agbada`, `/esiki`, `/suit` | Category shortcuts | no (home tiles / collection cards) | category list |
| `/lookbook` | Editorial | yes | yes |
| `/bespoke` | Custom request (staff redirected) | yes | no |
| `/made-to-measure/:sku` | MTM configurator | no (PDP CTA) | no |
| `/about` (`/about-us` →) | Brand | yes | yes |
| `/journal`, `/journal/:slug` | Magazine | **no** | yes (“Magazine”) |
| `/events`, `/events/:slug` | Trunk shows | **no** | **no** |
| `/contact` (`/contact-us` →) | HQ + ticket | yes | yes |
| `/book` | Appointment as guest | **no** | **no** |
| `/track` | Public tracker (demo `1001`) | yes | yes |
| `/cart`, `/checkout` | Bag + pay (staff redirected) | bag icon | no |
| `/orders/thank-you/:id` | Post-pay | no | no |
| `/search` | Looks + journal | icon | no |
| `/policies/order`, `/policies/jobs` | Policy JPGs | no | yes |
| `*` | 404 | — | — |

Auth (no marketing chrome): `/account/login`, `/account/register`, `/account/forgot-password`, `/studio/login`.

### 2.2 Client OS (`AccountGate` — clients only)

`/account`, `/account/shop`, `/account/shop/:sku`, `/account/made-to-measure/:sku`, `/account/journal`, `/account/orders`, `/account/custom`, `/account/measurements`, `/account/appointments`, `/account/payments`, `/account/wishlist`, `/account/reviews`, `/account/support`, `/account/profile`.

Staff hitting these bounce to `landingPath(user)`.

### 2.3 Studio (`StudioGate`)

Requires `canUseArea(user, "studio")`. Sidebar filtered by `canSeeSection`. Deep links bounce if the section is not ticked.

`/studio` plus: orders, products, collections, customers, custom, quotes, production, payments, analytics, support, content, events, people, **appointments**, attendance, profile, settings.

### 2.4 Atelier (`AtelierGate`)

Requires `canUseArea(user, "atelier")` — needs `bench`, `queue`, or `fittings` (super admin always allowed).

`/atelier`, `/atelier/queue`, `/atelier/fittings`, `/atelier/appointments`, `/atelier/attendance`, `/atelier/profile`.

Attendance and profile **re-export** the studio screens. Appointments is the **same component** on both `/studio/appointments` and `/atelier/appointments`.

---

## 3. Roles and what they actually see

Access = `user.navSections` if set, else `DEFAULT_NAV[role]`. Super admin ignores ticks (all studio doors). Profile is always on for staff.

| Role | Default landing | Studio doors | Floor doors | Notes |
|------|-----------------|--------------|-------------|--------|
| **client** | `/account` | none | none | Only client OS + public shop |
| **super_admin** | `/studio` | all studio | can open `/atelier` because `canUseArea` bypasses | No studio → atelier link in the UI |
| **manager** | `/studio` | all studio except People | no | Appointments live under studio |
| **desk** | `/studio` | overview, orders, clients, requests, quotes, appointments, support, attendance | no | Home still shows naira tiles they cannot load |
| **designer** | `/studio` (first nav id is overview, **not** `/studio/custom`) | overview, custom, quotes, production, content, events | no | Production assign is principal/manager |
| **finance** | `/studio` (not `/studio/payments`) | overview, orders, payments, analytics, clients | no | |
| **content** | `/studio` (not `/studio/content`) | overview, products, collections, content, events | no | Review moderate is on Support, which they do not have |
| **tailor / cutter / qc** | `/atelier` | no (unless ticks grant studio core) | bench, queue, fittings, appointments, attendance | Same nav; API then filters the board |

`session.ts` still has role shortcuts (finance → payments, content → content, designer → custom). After login the app uses **`landingPath(user)`**, which prefers the first non-profile nav id — usually **Overview**. Those shortcuts almost never run.

**Hire (super admin only):** `/studio/people` — add staff, pick a hire role (not client, not another principal), tick studio vs floor doors, save. Changing role resets ticks to that role’s defaults. Principal row is locked.

**Dangerous tick combos**

- Grant a tailor `products` → they can enter studio **and** atelier.
- Strip every core door → `StudioGate` / `AtelierGate` can bounce to a landing whose area they cannot use (**redirect loop**).
- Ticks on a section API **override the old role list**. A desk given Payments can review transfers.

---

## 4. Staff cannot act as clients — scorecard

| Surface | Status |
|---------|--------|
| `assertCanShop()` on cart add / qty / coupon / `placeOrder` | done |
| Staff `cart.get()` returns empty dummy `staff-bag` | done |
| `StaffShopGuard` on Cart, Checkout, Bespoke, Book, MTM | done |
| Header bag icon hidden for staff | done |
| Account gate + demo switcher refuse staff → client | done |
| Wishlist / reorder / custom-as-self / client diary / review create | done |
| Hire / nav ticks / role change: super admin only | done |
| **Shop, PDP, ProductCard hide Add / MTM / Pre-order** | **not done** — `canShop` in `ProductDetail.tsx` is unused |
| **WhatsApp CTA / lead create** | **not done** — staff can spawn unclaimed leads |
| Footer Account always `/account/login` | bug for signed-in staff and clients |
| `StaffShopGuard` while session loading | `return null` — **blank flash** |

Verdict: **the bag cannot be paid as staff. The rail still invites them to try.**

---

## 5. Screen-by-screen findings

### 5.1 Marketing house

**Home** — CMS hero, perks, four collection tiles (**Suit omitted**), featured looks, promo bar if coupon `EUNIK-DEC-2024` is live, lookbook rail, magazine. Hero overlay always says “Discount on selected collection!” even when the promo bar is off. Featured copy still implies the **image instantly orders**; the image goes to PDP. No loading UI. Perks say “free shipping on first order”; header says ₦100,000.

**Shop** — filter by collection + sort. `?collection=` is read once and never written back. Loading looks like “0 looks in the house.”

**Product card** — hover overlay Add + WhatsApp. Overlay is CSS-hover only → **invisible on most phones**. Grid add never stores size.

**PDP** — gallery, size chips only when variants exist (few SKUs). Add / pre-order / MTM / WhatsApp. Quote looks dump guests onto `/bespoke`, which then **requires login**. Reviews: write form only for clients; **no purchase check**. “View bag” always `/cart`. Staff still see purchase CTAs.

**Collection / category** — two URL schemes (`/aranbada` and `/collection/aranbada`). Seed `heroImage` unused. Crumb always “Shop”. Unknown slug silently goes to `/collection`.

**Lookbook** — editorial tiles. “View look” uses `productId.toUpperCase()` as SKU (works today). Image itself is not a link.

**Bespoke** — login wall, then form. Consultation hardcoded “Ibadan HQ”. Success → `/account/custom`. Staff redirected.

**Book** — works for guests; toast then empty form. **Not linked anywhere.** Staff redirected, so desk cannot use the public form either.

**MTM** — needs login + a measurement profile, then **jumps to checkout** (skips cart). Invalid SKU is a blank configurator, not 404. Fabric surcharge (seed ₦15,000 wine) not shown in the price.

**Journal** — works. Dates on the index are raw `2024-11-26`; Home formats the same dates in words. Missing post copy is the same as loading copy.

**Events** — one seeded trunk show (`2026-08-29`). **No nav, no RSVP.**

**Contact** — ticket to the desk. Failed submit builds `mailto:` with the **visitor’s** email, not the house. Map pin is absolutely positioned and will miss on small screens. Copy still says “Describe about your project.”

**Track** — demo `1001`. Shows stepper + customer name (information leak for a public number). Good not-found error.

**Cart** — empty state is fine. Missing product lines render `null` (ghost totals). No size. No shipping preview.

**Checkout** — guest name/email/phone; pickup vs delivery (₦3,500 under ₦100k). MTM/bespoke pay `depositPercent` (60%) via `PayMethods`. **Prints the demo password.** Existing client email **logs that client in with no password**. Empty bag still shows the form. Paystack is labelled demo.

**Thank you** — order #, method copy, welcome box from `sessionStorage`. While loading it says the order was **not found**, then appears.

**Search** — every keystroke hits `db.search.all` (200–500ms, no debounce, no `?q=`). Looks + journal only. OS search box is **unwired**.

**Policies** — two JPEGs. Footer Google privacy/terms are `href="#"`. Cookie “policy” only hides the banner.

**Header / footer** — Instagram “100k Followers” hardcoded. Facebook/X are generic homepages. Newsletter is local only. reCAPTCHA claimed, not implemented. Header omits Journal, Events, Book.

### 5.2 Client OS

**Overview** — greeting, attention (temp password, open quote, balance), spend chart, tile grid, featured, magazine. **Hardcoded preference for order `#1001`** as the hero ticket. Quote Accept toasts “pay from Payments” and does not navigate. No Decline.

**Shop / journal inside OS** — marketing components inside a 14px OS shell. Search from here still goes to public `/search`.

**Orders** — list + stepper + reorder. Empty copy flashes while loading. Reorder is client-only (API).

**Custom** — request form + quotes. Accept exists; **no Reject** (API exists). Quoted requests stay `quoted` forever in the studio inbox.

**Tape** — list profiles. Client cannot really own the “floor writes this” story; empty progress on Ade’s wedding row is easy to misread.

**Appointments** — list mine. No new booking from inside the OS (public `/book` exists but is unlinked).

**Payments** — **`.find()` one due order.** Accepting a new quote can **hide** Ade’s remaining balance on #1001. `busy={false}` — double submit possible. No try/catch on pay.

**Wishlist / reviews / support** — functional. Reviews on Account require `status === "delivered"`; seed #1003 is **`ready`**, so Ade cannot file another review from that screen. Support `listMine` matches email/name; seed ticket is `ibrahim@example.com`, so Ade’s inbox is empty.

**Profile** — save + password. `mustChangePassword` is a **banner**, not a hard gate.

### 5.3 Studio

**Overview** — naira dashboard for everyone who can see Overview. Tiles are **hardcoded** (orders, products, collections, clients, payments labelled “Collections”, analytics, support, people, events, production). Desk/designer/content get `ForbiddenError` on analytics; charts render as **zeros**. Today’s appointments are keyed to frozen `"2026-08-15"` and linked to **Orders**, not Appointments. Custom CTA always shown.

**Orders** — monitor + status. Detail can update status.

**Products / collections** — uploads, price or request-for-price, CRUD. Content sees **Delete** on products; API is manager/principal only.

**Clients** — CRM list + dossier.

**Requests** — quote form **only while `status === "new"`**. Seed Ade request is already quoted → permanent “Already quoted.” No revise, no jump to Quotes.

**Quotes** — **read-only table.** No send, accept, reject, expiry.

**Production** — kanban columns `cutting | sewing | finishing | quality_check | ready`. Stages such as `quote_accepted`, `deposit_paid`, `measurements_confirmed` **do not appear**. Tickets stall off-board. Assign needs `people.staff()` (principal/manager). Advance is on every card; cutter/QC limits only fire in the API.

**Payments** — receipts + approve/reject. Reject reason hardcoded “Narration mismatch.” Funmi’s receipt image is a **garment photo**.

**Analytics** — revenue/profit only. `salesSeries` **invents** a bar chart when the 8-day window is empty (seed payments sit outside 15–18 Aug 2026). **No page views, visitors, referrers, or funnels** — principal traffic is specified in §13.

**Support** — tickets + review moderate. Empty reply still sends.

**Content / events** — homepage, journal, lookbook, mailbox, trunk shows. House contact is edited here, not in Settings (easy to miss).

**People** — hire + ticks as specified. No deactivate, no password reveal, no audit list on this page (`db.audit.list` exists, unused). Attendance/appointments ticks sit under **Studio** even for floor roles.

**Appointments** — list + Confirm. **No “book for a named client” form.** Confirm shows for floor users; API is desk/manager/principal (unhandled rejection).

**Attendance** — clock log. Bench clock uses `localStorage["eunik-clock"]` **and** `attendance.clock` — they can disagree.

**Settings** — house file + reset demo. Demo-mode toggle hides the role switcher but login chips still fill the shared password.

**Profile** — staff file. Not in the sidebar list; footer avatar only (atelier also lists it in the sidebar).

### 5.4 Atelier

**Bench** — greeting, unfiltered tile grid, overdue vs `"2026-08-16"`, then **embeds the entire studio Production kanban** (second page header, assign dropdown). Too much House OS on the floor.

**Queue** — different stage list than the kanban (`first_fitting` in, `quality_check` path differs). Unknown stage is treated as index 0 and can **jump to sewing**.

**Fittings** — notes + mark done.

**Appointments / attendance / profile** — duplicates as above.

---

## 6. End-to-end flows (as they run today)

### 6.1 Guest buys RTW (cart)

Home / Shop → PDP Add to bag *(or hover Add, desktop only)* → Cart → Checkout → demo Paystack or transfer → Thank you → client session created.

**Breaks:** grid add with no size; hover CTAs on mobile; checkout takeover if you type an existing client email; password printed; stock never decrements; multi-line orders keep only the first look’s name/image.

### 6.2 Guest orders on WhatsApp

PDP / card → WhatsApp URL + unclaimed `lead` for the desk.

**Breaks:** not an order; no receipt number; Track copy still says “receipt or WhatsApp”; house `settings.whatsapp` ignored; staff can fire leads; Home copy still says the image orders instantly.

### 6.3 MTM

PDP “Make this to measure” → login → pick fabric + tape → **straight to checkout** (60% deposit) → production ticket often `measurements_confirmed` → **not on the kanban**.

**Breaks:** no tape yet = toast only; skip cart; invalid SKU; staff redirected with no copy.

### 6.4 Bespoke

Header Bespoke → login → form → `/account/custom` → desk quotes **only if `new`** → client Accept → `pending_payment` order **without taking the deposit** → Payments page may hide other balances → if paid, stage `deposit_paid` / assignee designer → designer has **no floor queue** → ticket never appears on atelier.

**Breaks:** Quotes screen is dead; no revise; no reject UI; request stays `quoted`; no customer name on the studio card.

### 6.5 Bank transfer (Funmi #1002)

Checkout / pay balance → upload receipt → finance approve → order `production`, `deposit_paid`.

**Breaks:** seed already has stage `cutting` while status is `awaiting_transfer` (stepper lies). After approve, ticket can fall into a kanban dead zone. Desk default cannot open Payments.

### 6.6 Floor (Ade #1001 sewing)

Tailor opens bench → sees assigned + (because Production is embedded) the whole board → Advance.

**Breaks:** cutter/QC get the same Advance UI; API then forbids illegal moves (toast or silent reject). Queue uses another algorithm. Overdue is frozen to 16 Aug 2026.

### 6.7 Public track

`/track` + `1001` → stepper.

**Breaks:** RTW `production` maps to the “Ready” step if stage is missing. Guessing `1001` reveals a customer name.

### 6.8 Hire and access

Olamide → People → Add staff → role + ticks → Save. New person uses demo password, `mustChangePassword: true`.

**Breaks:** no landing-path preview; empty nav can loop; no disable; manager can `people.staff()` in API but has no People route.

---

## 7. Cross-cutting UX

| Theme | Finding |
|-------|---------|
| Loading | Gates splash “Opening the house…”. Almost every `useAsync` page has **no skeleton**. Orders / Thank you / Shop **flash empty or error**. |
| Errors | Mutations often toast. List pages ignore `error`. Several `void db.*.then(toast)` have **no `.catch`**. No React error boundary. |
| Search | Public search is live-as-you-type. OS search and bell are **decorative**. No mark-read. Seed has one unread note for Ade; production events do not notify. |
| Audit | Written on many studio writes. **No screen lists it.** Login, checkout, reset, settings are not audited. |
| Mobile OS | Bottom bar is **first 6 nav items**. Settings / People / extra studio doors disappear. Hamburger toggles **desktop collapse**. |
| A11y | Sparse `aria-label`. Menu not `aria-expanded`. No skip link. Shop filters unlabeled. Hover-only product actions. |
| Design split | Marketing 17/32 vs OS 14px. Account shop/journal use marketing heroes inside OS. Status badges use Tailwind green/amber more than CSS tokens. |
| Overlays | Cookie (bottom-left), Install (bottom-20), Demo switcher (bottom-right). Cookie “policy” does not persist. |
| Storage | Whole DB cloned on every mutate. Receipt **data URLs** will hit ~5MB quota; `save()` has **no try/catch**. No cross-tab `storage` sync. |
| Image upload | Local state does not follow `value` when editing another row. |
| PWA | Install copy promises chrome-free shop/track. SW does not cache. Icons are one favicon claimed as 192 and 512 maskable. |
| Demo banner | **DEV only.** Production `vite build` looks like a live shop. |

---

## 8. Spec vs as-built (short)

The platform spec asked for a single house where discovery, tape, quote, pay, and floor share one ticket. The frontend **has the screens**. The **joins** are the gap.

| Spec intent | As-built |
|-------------|---------|
| WhatsApp remains a sales channel, not the only checkout | True, but the two channels never share an order number |
| Book appointment creates a row visible in studio and account | Public `/book` writes a row; **nobody is linked to the page** |
| UI never talks to `localStorage` except via `db.*` | Honoured |
| Role-shaped dashboards | Sidebars yes; **homes still one naira template** |
| Staff / principal never shop as clients | API yes; PDP/card no |
| Principal hires and ticks doors | Done on `/studio/people` |
| Paystack + transfer + naira | Demo yes; live keys no |
| PWA | Prompt yes; offline no |
| Replace `database.ts` with HTTP later | Signatures are ready; **no http client yet** |

Copy leftovers the old fix-list already named: ₦ vs `#`, Dec 2024 coupon name vs 2027 expiry, “LATEST 2024”, summer 30% strip, About mission = vision, “24/7 days a week”.

---

## 9. Flow improvement suggestions

These are product recommendations, not a patch list. Each one names **why** the current flow fails a real client or a floor walkthrough.

### 9.1 One garment, one ticket (highest leverage)

Today a look can be a WhatsApp lead, a cart order, a custom request, a quote, and a production row that never share an id.

**Do this**

1. Every paid or accepted job gets an **order number** immediately (even WhatsApp, when desk claims a lead).
2. Client Account Home, Payments, Orders, and Track all open **that** number.
3. Studio Orders is the dossier: request, quote, payments, floor stage, fittings, tickets.
4. Production board has a **“Not yet on the floor”** column for `quote_accepted`, `deposit_paid`, `measurements_confirmed` — or do not create a production row until cutting.

Until this exists, Ade’s wedding Agbada and Funmi’s transfer will always feel like two apps.

### 9.2 Pick a primary buy path on the public site

The house currently **says** WhatsApp and **builds** a Shopify-like bag.

**Recommended default for EUNIK**

- Primary on PDP: **Add to bag** (RTW) / **Configure MTM** / **Request quote** (price-on-request).
- Secondary, always visible (especially mobile): **Ask the house on WhatsApp**.
- Never tell the user the product image “instantly orders.”
- After WhatsApp, desk **Claim** should offer “Open ticket #…” so Track works.

Do not hide WhatsApp. Do stop implying two checkouts are one.

### 9.3 Client money flow

**Today:** Accept quote → “go to Payments” → Payments shows **one** due row → new quote can hide #1001.

**Should be**

1. Payments = **list of every open balance**, each with Paystack / transfer.
2. Accept quote: take deposit **in place**, or jump to that order’s pay card with Decline beside Accept.
3. Show 60% vs remainder in words, not only a smaller Pay button.
4. After pay, “Your ticket is on the floor” with the stepper — not a dead thank-you and a separate Orders page.

### 9.4 Desk morning board (not a finance dashboard)

Desk with Overview should not see empty revenue charts.

**Should open on**

- Unclaimed WhatsApp leads (Claim is already on Home — keep it).
- Appointments **today** (use real clock or a single `settings.demoToday`).
- Requests in `new`.
- Transfers waiting on finance (count + link, even if they cannot approve).
- Open support tickets.

Hide Products / People / Analytics tiles unless those sections are ticked. Catch analytics 403s.

### 9.5 Designer: quote is a document, not a stamp

**Should be able to**

- Quote, **revise**, void, and see expiry.
- Open the quote from Requests **and** from Quotes.
- Assign the cutting ticket to a **tailor**, not to themselves, unless they also have queue/bench.
- See accepted work under “Not yet on floor” until cutting starts.

Land designer on `/studio/custom` (honour the old `session.ts` shortcut, or put Custom first in default nav).

### 9.6 Finance: receipts are the job

Land on `/studio/payments`. Home = outstanding + unverified receipts, with the **actual receipt image** per row. Approving a transfer must **place the garment on a visible column** (cutting) or notify desk — not `deposit_paid` in a void.

### 9.7 Floor: one Advance, legal next stage only

- Bench = **assigned cards** + the next legal stage for **this** role (cutter: cutting → sewing; QC: finishing / QC → ready).
- Queue = the same board, filtered, not a second state machine.
- Do not embed Studio Production (assign, gold copy, second header) inside My bench.
- Clock in/out: one source (`attendance.clock`); drop `eunik-clock`.
- Hide Confirm on appointments unless `setStatus` is allowed.

### 9.8 Content: moderate where they live

Either tick Support by default for content, or put review moderation on Content (API already allows `content` on `reviews.moderate`). Hide Delete look if they cannot delete.

### 9.9 Super admin: access wizard that cannot brick a login

On hire / Assign:

- Preview **landing path** and “Studio / Atelier / both”.
- Block save if `canUseArea` would be false for both.
- Show the temporary password **once**; keep `mustChangePassword` as a **modal gate** on first studio load.
- Optional: Atelier as a first-class door in studio nav for the principal, or remove the silent `/atelier` bypass.

### 9.10 Public IA and mobile

- Put **Magazine** in the header **or** drop the Journal/Magazine split.
- Put **Events** and **Book** in the footer (and Contact). Event detail CTA → `/book?event=…`. Book success = **reference number**, not a cleared form.
- Always show Add + WhatsApp **under** the card on small screens; hover is enhancement.
- Footer Account = same `landingPath` as Header.
- Rename “Find stores” to “Visit Ibadan HQ” or drop it.
- Unify collection URLs: keep `/aranbada` as redirects to `/collection/aranbada`.
- Use collection `heroImage`. Crumb = collection name.

### 9.11 Quote / request / MTM empty states

- Request price: WhatsApp **or** guest email form; do not login-wall a quote intent.
- MTM with no tape: create a profile **on the page**.
- After MTM add: **cart**, not checkout, so they can add a cap or a second look.
- Invalid SKU: 404.

### 9.12 Honesty for a demo that looks live

- Production banner: “Presentation store — no live charges — data stays in this browser.”
- Stop printing `EunikHouse2026!` on checkout and thank-you.
- `ensureAtCheckout`: create only if unknown; **never** `writeSession` for an existing email without a password.
- Forgot password: say it is demo-disabled, or implement a token in the demo DB.
- Cookie banner: persist dismiss; link a real policy; drop ads claim.
- PWA: cache the shell **or** drop the install promise.
- Drive free-shipping, WhatsApp, Instagram from `settings`. One welcome percent.

---

## 10. Persona scripts (improved)

Use these as the target walkthroughs after the flow work. Contrast with §6.

### Client (Ade)

1. Sign in → forced password change if flagged.  
2. Overview shows **#1001 sewing** because it is his open ticket, not because the code looks for `"1001"`.  
3. Attention: remaining ₦40,000 **and** any sent quote.  
4. Payments lists **every** due line. He pays #1001 remainder without losing the quote.  
5. Accept quote → deposit on the same screen → stepper “on the floor”.  
6. Track `1001` on the public site matches Account Orders.  
7. Review when status is `ready` or `delivered`.  
8. Support shows **his** tickets by `customerId`.

### Guest → new book

1. Mobile: Add to bag visible without hover.  
2. Checkout creates an account **only** for a new email; known emails must sign in.  
3. Thank you: order number, pickup/delivery, **no password in the clear** (email or one-time set-password link in demo).  
4. Optional: “Also WhatsApp this ticket to the house” with the **same** number.

### Desk

1. Login → exception board (leads, today’s book, new requests, open tickets).  
2. Claim ARA5008 → ticket #.  
3. Book a named walk-in from `/studio/appointments` (not public `/book`).  
4. Quote a new request; revise if needed.  
5. Confirm fittings. No naira pie charts.

### Designer

1. Login → Custom inbox.  
2. Quote / revise.  
3. On accept, pick a **tailor** (or leave unassigned for desk).  
4. Content/events still available. No finance tiles.

### Finance

1. Login → Payments.  
2. Open Funmi’s receipt image, approve, see #1002 land on **Cutting**.  
3. Analytics uses **real** successful payments, not a hardcoded series.

### Tailor / cutter / QC

1. Login → My bench, assigned only.  
2. One Advance control, disabled when the stage is not theirs.  
3. Funmi #1002 is the cutter’s demo card **after** finance approves, not Ade’s sewing ticket.  
4. QC moves #1003 ready → completed so Ade can review.

### Principal (Olamide)

1. People: hire a desk officer, tick Orders + Clients + Appointments, see “Lands on /studio”.  
2. Switch demo Tailor → Admin without Ade.  
3. Reset demo only from Settings, with confirm, then sign in again.  
4. Optional atelier visit from a labelled door.

---

## 11. Technical debt that blocks those flows

1. **Single JSON blob in localStorage** — quota, slow clone, no multi-device, no staff/client collaboration across browsers.  
2. **`useAsync` + global subscribe** — any mutate refetches every mounted page.  
3. **`assertRoles(roles, action, section)`** — when `section` is passed, the role array is ignored. Ticks become a privilege escalation tool unless hire UI is strict.  
4. **Frozen demo calendar** — `"2026-08-15"` in Studio Home, `salesSeries`, seed `seededAt`, atelier overdue. Wall clock is 18 Aug 2026; charts lie. Introduce `settings.demoToday` **or** use `new Date()` everywhere.  
5. **Stock is display-only.**  
6. **`createOrderFromCart` is first-line-only** (name, image, measurement snapshot).  
7. **No Vitest around `client.ts`** before swapping persist to HTTP.  
8. **People.get / orders.get / thank-you** can expose more than a public site should.

---

## 12. Fixes (tracker)

Rules:

1. UI talks only to `db.*` (later `src/api/http.ts`). No `fetch` in pages.
2. Do not invent a second analytics or cart store.
3. Prefer additive types so [backend-eunik/README.md](../../backend-eunik/README.md) can replace storage.
4. Super admin traffic (§13) is first-party.
5. **⬜ → ✅ only after the parent phase exit script passes.** Item rows may stay ⬜ while the phase is 🟡.

Severity: **P0** ship-blocker · **P1** walkthrough-breaker · **P2** polish.

### 12.1 Honesty, auth, staff-cannot-shop — phase **F0**

A10–A11 in this table are **F2**. A18 is **F0** even though it also sits in §12.2.

| | ID | Sev | Where | Now | Fix |
|---|-----|-----|-------|-----|-----|
| ✅ | A01 | P0 | `Layout.tsx` | Demo strip is `import.meta.env.DEV` only | Show a production banner while `settings.demoMode` is true: “Presentation store — no live charges — data stays in this browser.” Hide it only when the real API is live **and** demoMode is off. |
| ✅ | A02 | P0 | `Checkout.tsx`, `ThankYou.tsx`, `ensureAtCheckout` | Prints `DEMO_PASSWORD`; stores it in sessionStorage / notification / mailto | Never render the house password. Demo: “Check the mailbox on this demo for a set-password step” **or** a one-time `/account/set-password?token=` that `db.auth` already understands. Backend: hashed password, emailed link. |
| ✅ | A03 | P0 | `db.auth.ensureAtCheckout` | Existing client email → `writeSession` with no password | Create only if unknown. If the email exists, return `{ needsLogin: true }` and send the guest to `/account/login?next=/checkout`. |
| ✅ | A04 | P0 | `persist.ts` `save()` | No quota handling | Catch `QuotaExceededError`; toast “House file is full — drop a receipt or reset the demo.” Backend: irrelevant (object storage). |
| ✅ | A05 | P0 | `ProductDetail.tsx` | `canShop` computed, unused | Hide Add / Pre-order / MTM / “View bag” unless `canShop`. Keep WhatsApp only if `!isHouseStaff`. |
| ✅ | A06 | P0 | `ProductCard.tsx` | No role check | Same `canShop` rule. Always show CTAs **under** the image below `sm` (hover is extra). |
| ✅ | A07 | P0 | `whatsapp.ts` + `leads.createFromWhatsApp` | Staff can spawn leads | Refuse if `role !== "client"` and not guest. Staff use CRM. |
| ✅ | A08 | P0 | `StaffShopGuard` | `loading` → blank screen | Reuse Gates splash, then redirect with toast “House staff use Studio, not the bag.” |
| ✅ | A09 | P0 | `Footer.tsx` | Account always `/account/login` | Use `landingPath(user)` like Header. |
| ✅ | A10 | P1 | `ForgotPassword.tsx` | Always “sent”; API no-op | Copy: “Demo has no mailer.” Backend: real token + expiry. |
| ✅ | A11 | P1 | `mustChangePassword` | Banner only | Modal gate on first `/account` or `/studio` load until `changePassword` succeeds. |

### 12.2 RBAC and role-shaped homes — phase **F1**

| | ID | Sev | Where | Now | Fix |
|---|-----|-----|-------|-----|-----|
| ✅ | A12 | P1 | `StudioHome.tsx` | Hardcoded tiles; analytics uncaught | Filter tiles with `canSeeSection`. `.catch` overview/series. Desk home = leads + book + new requests + tickets. Finance home = receipts + outstanding. Designer home = custom inbox. Content home = magazine/events. Principal keeps naira **plus** traffic strip (§13). |
| ✅ | A13 | P1 | `AtelierBench.tsx` | Unfiltered tiles; embeds full Production | Filter tiles. Bench = assigned cards + legal next stage only. Do not nest `StudioProduction`. |
| ✅ | A14 | P1 | `landingPathForUser` vs `session.ts` | Finance/content/designer land on Overview | Prefer first **useful** door: finance → payments, content → content, designer → custom, desk → overview (once A12 is desk-shaped). |
| ✅ | A15 | P1 | `StudioPeople.tsx` | No landing preview; empty nav can loop | Preview path + “Studio / Atelier / both”. Block save if both `canUseArea` would be false. |
| ✅ | A16 | P1 | Appointments Confirm | Shown to floor; API desk-only | Hide Confirm unless the actor can `setStatus`. `.catch` toasts. |
| ✅ | A17 | P1 | `StudioProducts` Delete | Shown to content | Hide unless manager/principal (or grant delete in API — pick one). |
| ✅ | A18 | P1 | `people.get` | Returns full user including password | Strip `password` from every `User` DTO. Backend: never select the hash. |
| ✅ | A19 | P2 | OsShell mobile | First 6 tabs only | Sheet with **all** assigned items. |

### 12.3 One ticket — phase **F1**

| | ID | Sev | Where | Now | Fix |
|---|-----|-----|-------|-----|-----|
| ✅ | A20 | P1 | `AccountPayments.tsx` | `.find()` one due order | List **every** open balance. `busy` + try/catch. |
| ✅ | A21 | P1 | Quote accept | No deposit, no Decline, no navigate | Accept → pay deposit in place **or** jump to that order’s pay card. Add Decline (`quotations.reject` + ownership check). |
| ✅ | A22 | P1 | `StudioCustom` / `StudioQuotes` | Quote only if `new`; Quotes is read-only | Revise quote. Link request ↔ quote. Status: new / quoted / accepted / declined / expired. |
| ✅ | A23 | P1 | `createOrderFromCart` | First line only | Persist all lines (name, SKU, qty, size, fabric, kind). |
| ✅ | A24 | P1 | Stock | Never decrements | Decrement on confirmed pay; restore on cancel. Backend: same in a transaction. |
| ✅ | A25 | P1 | Production kanban | Missing pre-floor stages | Column **Waiting** (`quote_accepted`, `deposit_paid`, `measurements_confirmed`, …) then cutting → ready. Assign new bespoke to a **tailor**, not `user_designer`, unless they have bench/queue. |
| ✅ | A26 | P1 | `AtelierQueue` vs Production | Two stage lists | One `STAGES` helper; Advance = next **legal** stage for the role. |
| ✅ | A27 | P1 | Funmi seed | `awaiting_transfer` + stage `cutting` | Unpaid tickets must not sit on Cutting. |
| ✅ | A28 | P1 | Account Home | Hardcoded `#1001` | Hero = most relevant open ticket (production, then unpaid, then latest). |
| ✅ | A29 | P1 | Reviews | Account requires `delivered`; #1003 is `ready` | Allow `ready` **or** `delivered`. PDP review still requires a purchase. |
| ✅ | A30 | P1 | Support `listMine` | Match email/name | Match `customerId`. |
| ✅ | A31 | P1 | Lead claim | WhatsApp never becomes an order number | Claim → optional “Open ticket #…” so Track and Account share one id. |

### 12.4 Public IA — phase **F2**

| | ID | Sev | Where | Now | Fix |
|---|-----|-----|-------|-----|-----|
| ✅ | A32 | P1 | Header / Footer | No Events, Book, Magazine in header | Footer: Events + Book. Header: Magazine **or** drop the Journal/Magazine split. Event detail CTA → `/book?event=`. |
| ✅ | A33 | P1 | `/book` success | Toast + empty form | Show booking reference. Desk sees the same row. |
| ✅ | A34 | P1 | Home copy | Image “instantly orders”; first-order vs ₦100k shipping; Dec 2024 coupon | Image → PDP. One free-shipping rule from `settings.freeShippingKobo`. Promo from `homepage.promoCode`, not a hardcoded string. |
| ✅ | A35 | P1 | `useAsync` | `error` unused; empty flashes | Skeletons. Forbidden → permission empty state. Thank-you / Orders wait on `loading`. |
| ✅ | A36 | P1 | Search | No debounce; OS search dead | Debounce 300ms; `?q=`. Wire OsShell search to `db.search.all` **or** remove the input. |
| ✅ | A37 | P1 | Frozen dates | `"2026-08-15"` in Home, series, overdue | `settings.demoToday` for the pitch **or** `new Date()`. **Never** invent `salesSeries` bars. |
| ✅ | A38 | P2 | Collection URLs | `/aranbada` and `/collection/:slug` | Keep short URLs as redirects. Use `heroImage`. Crumb = collection name. |
| ✅ | A39 | P2 | Cookie / Install | Policy hides only; ads claim; overlap | Persist both dismissals. Link `/policies/…`. Stack prompts. Drop ads copy until analytics cookies exist (they will, with consent — §13). |
| ✅ | A40 | P2 | About / Contact | Mission = vision; “Describe about your project”; mailto fallback uses visitor email | Distinct copy. House `mailto:` = `settings.email`. |
| ✅ | A41 | P2 | Social / recaptcha | Generic Facebook/X; recaptcha `#` | Real URLs from settings or hide. Drop recaptcha claim until backend has it. |

### 12.5 Notifications, audit, PWA — phase **F2**

| | ID | Sev | Where | Now | Fix |
|---|-----|-----|-------|-----|-----|
| ✅ | A42 | P1 | Bell | Decorative | `notifications.listMine` tray; `markRead`. Create on quote, pay, stage, booking confirm. |
| ✅ | A43 | P2 | Audit | API unused | People or Settings: last 50 rows. Log reset, settings, login, hire. |
| ✅ | A44 | P2 | PWA | SW does not cache | Cache app shell **or** drop install copy. Distinct 192/512 + maskable icons. |
| ✅ | A45 | P1 | Vitest | None | `client.ts`: auth, cart merge, A03, `assertCanShop`, quote accept, stage → status, **traffic ingest ACL**. |

---

## 13. Super admin traffic (views and house metrics)

Today `/studio/analytics` is **naira only** (revenue, estimated COGS, invented daily bars). Cookie copy already claims “analyze our traffic” but **nothing is recorded**. The principal needs a first-party traffic board before ads, Instagram spend, or a live domain mean anything.

### 13.1 Who sees it

| Audience | Revenue / profit | Site traffic |
|----------|------------------|--------------|
| **super_admin** | yes | **yes — always** |
| manager with `analytics` tick | yes | **no** (unless principal later ticks a dedicated `traffic` door) |
| finance | yes | no |
| everyone else | no | no |

Do **not** put page-view PII on the desk or the floor. Traffic is a **principal** instrument.

UI: keep `/studio/analytics`. Add tabs **Sales** | **Traffic**. Traffic tab renders only if `user.role === "super_admin"`. Optional later: nav section `traffic` defaulted on for principal only.

### 13.2 What to show (the board)

Ranges: **Today · 7 days · 30 days · All** (and a custom range once the API exists). Compare to previous period (Δ %).

**Volume**

| Metric | Meaning |
|--------|---------|
| Views | Page views (path + query, normalised) |
| Unique visitors | Distinct anonymous id (cookie) or, on the server, hashed IP+UA **without storing raw IP** |
| Sessions | 30-minute inactivity timeout |
| Bounce rate | Sessions with a single view |
| Pages / session | Views ÷ sessions |
| Avg. time on site | Backend only (demo may omit or seed) |
| Active now | Views in the last 5 minutes (backend; demo can seed 0–3) |

**Acquisition**

| Metric | Meaning |
|--------|---------|
| Channel | `direct`, `instagram`, `whatsapp`, `google`, `referral`, `email` (UTM / referrer host) |
| Referrers | Top hosts (instagram.com, wa.me, google.com, …) |
| Campaigns | `utm_source`, `utm_medium`, `utm_campaign` |
| Device | mobile / desktop / tablet |
| Country / city | Backend geo; demo seed **NG** — Ibadan, Lagos, Abuja, Accra |

**Content**

| Metric | Meaning |
|--------|---------|
| Top pages | `/`, `/shop`, `/shop/:sku`, `/bespoke`, `/journal/:slug`, `/book`, `/track` |
| Top looks | PDP views by SKU |
| Top collections | `/aranbada`, `/men-senator`, … |
| Search terms | From `/search?q=` once A36 lands |
| Not found | 404 path hits |

**House conversion (this is not a generic blog)**

| Event | Count | Rate vs sessions |
|-------|-------|------------------|
| `view_item` | PDP opened | |
| `add_to_bag` | Cart add | |
| `begin_checkout` | Checkout viewed | |
| `purchase` | Order placed (any method) | Sessions → paid |
| `whatsapp_click` | Order on WhatsApp | Sessions → WA (often the real funnel) |
| `lead_claimed` | Desk claimed a WA lead | |
| `bespoke_submit` | Custom request | |
| `book_submit` | Appointment requested | |
| `newsletter_subscribe` | Footer join | |
| `register` | Client book opened | |

Also show **₦ from the same range** (already in sales) next to conversion so the principal sees *traffic → money* on one screen.

**Do not show** staff `/studio/*` or `/atelier/*` in public traffic. Optionally a quiet **Staff OS usage** card (logins, tickets advanced) later — not mixed into visitor charts.

### 13.3 Adapter (frontend now, HTTP later)

```ts
// db.analytics — additive; do not break studioOverview / profit / salesSeries

track(event: {
  name: "page_view" | "view_item" | "add_to_bag" | "begin_checkout" | "purchase"
    | "whatsapp_click" | "bespoke_submit" | "book_submit" | "newsletter_subscribe" | "register" | "search";
  path: string;
  title?: string;
  sku?: string;
  query?: string;
  referrer?: string;
  utm?: { source?: string; medium?: string; campaign?: string };
}): Promise<void>;  // fire-and-forget; never block navigation

traffic(range: "today" | "7d" | "30d" | "all"): Promise<TrafficReport>;
```

- `track` is **public** (guest allowed). Ignore events from house staff paths. Honour cookie consent: if the visitor dismissed cookies without “Allow”, store **page_view path only** as aggregated counts **or** skip until Allow — pick **Allow required for unique-visitor cookie**, still count anonymous page views as `views` without stitching sessions.
- `traffic` is **`super_admin` only**. `ForbiddenError` for everyone else, even with an analytics tick.
- Demo: persist a capped event log (e.g. last 2 000 rows) + **seed 30 days** of plausible Ibadan traffic so the board is not empty on first login.
- Demo must **not** explode `localStorage`. Roll up daily counters in seed (`trafficDaily[]`) and keep raw events small. Live collector is backend **B3** — see `backend-eunik/README.md`. UI still calls `db.analytics.traffic`.

`TrafficReport` (stable JSON for the HTTP cutover):

```ts
type TrafficReport = {
  range: { from: string; to: string };
  totals: {
    views: number;
    visitors: number;
    sessions: number;
    bounceRate: number;      // 0–1
    pagesPerSession: number;
    avgDurationSec?: number;
    activeNow?: number;
  };
  previous?: { views: number; visitors: number; sessions: number }; // for Δ
  viewsSeries: { day: string; views: number; visitors: number }[];
  channels: { channel: string; views: number; visitors: number }[];
  referrers: { host: string; views: number }[];
  campaigns: { source: string; medium: string; campaign: string; views: number; conversions: number }[];
  devices: { device: "mobile" | "desktop" | "tablet"; views: number }[];
  geo: { country: string; city?: string; views: number }[];
  topPages: { path: string; title?: string; views: number }[];
  topSkus: { sku: string; name: string; views: number }[];
  funnels: { name: string; count: number }[]; // see event list above
  conversion: {
    sessionToPurchase: number;
    sessionToWhatsapp: number;
    viewItemToBag: number;
  };
};
```

### 13.4 Instrumentation (where to call `track`)

| Event | Call site |
|-------|-----------|
| `page_view` | `Layout` + `OsShell` **public/account shop only** — `useLocation`, skip `/studio`, `/atelier`, `/account/login` noise if you want marketing-only; **principal should still see client-OS shop views**. Simplest rule: skip path prefixes `/studio` and `/atelier`. |
| `view_item` | `ProductDetail` when a live product resolves |
| `add_to_bag` | after successful `db.cart.add` |
| `begin_checkout` | `Checkout` mount (once per session) |
| `purchase` | after `placeOrder` / `payBalance` success |
| `whatsapp_click` | `openProductWhatsApp` |
| `bespoke_submit` / `book_submit` / `newsletter_subscribe` / `register` | existing success handlers |
| `search` | debounced Search page |

Send `document.referrer` and `URLSearchParams` UTMs on `page_view`. Backend will prefer `Referer` + first-touch UTM on the session.

### 13.5 Live collector

Not built in this frontend phase. **Do not implement Express here.** Spec and B3 checklist: [`backend-eunik/README.md`](../../backend-eunik/README.md) (`POST /v1/events`, `GET /v1/studio/traffic` super_admin only, MySQL rollups).

F1 only: seeded local `track()` / `traffic()` so the Traffic tab has a story until B3 is ✅.

### 13.6 Seed (so Olamide has a story)

Seed ~30 days ending `settings.demoToday` or today:

- Views heavy on `/`, `/shop`, `/men-senator`, `/aranbada`, a few SKUs (SEN3002, ARA5001).  
- Channel mix: Instagram 40%, Direct 25%, WhatsApp 15%, Google 12%, Referral 8%.  
- Device: mobile ~75% (Nigerian fashion traffic).  
- Funnels: many `view_item`, fewer `whatsapp_click`, fewer `add_to_bag`, few `purchase` — matches a house that still sells on WhatsApp.  
- `salesSeries` in the **same range** must use real seed payments, not the fake `[120000, 0, 228000, …]` array (A37).

---

## 14. Frontend phases (F0–F2)

**Complete one phase. Wire it end-to-end in the running Vite app. Only then mark it ✅.**

If the network drops, resume from [Resume log](#resume-log) at the top. Do not start F1 until F0 is ✅. Backend B0–C0 lives only in `backend-eunik/README.md`.

| Phase | Name | Status | Wire E2E before ✅ |
|-------|------|--------|-------------------|
| F0 | Honesty + staff cannot shop | ✅ | Guest shops; staff PDP has no Add to bag; checkout cannot hijack Ade |
| F1 | Role homes + one ticket + seeded traffic | ✅ | Ade pays all dues; Funmi receipt → Cutting; Olamide Traffic tab (seeded) |
| F2 | Public IA + loading/errors + notifications | ✅ | Events/Book linked; mobile CTAs; bell or gone |

---

### ✅ F0 — Honesty and access

**Goal:** A visitor and a staff member cannot be confused with a live shop; staff cannot act as clients.

**Fixes:** A01–A09, A18.

- [x] ✅ Implement every F0 row in §12.1 (⬜ → ✅ on the row when that screen works).
- [x] ✅ Click through the exit script below in a real browser.
- [x] ✅ Then set this heading and the phase board to ✅. Not before.

**Exit script (must pass before phase ✅)**

1. Production-style banner shows while `demoMode` (not only `npm run dev`).
2. Checkout / thank-you never print `EunikHouse2026!`.
3. Guest checkout with `ade@eunik.demo` asks for login — does **not** become Ade.
4. Staff (Olamide): Shop/PDP have no Add / MTM / bag; WhatsApp does not create a lead; Footer Account goes to studio.
5. `StaffShopGuard` never flashes a blank page.
6. `people.get` / session user object has no `password` field.

**Stop without ✅ if any of those still fail.**

---

### ✅ F1 — House actually runs + principal traffic (seeded)

**Goal:** Ade can pay what he owes; Funmi’s receipt puts a garment on Cutting; Olamide opens Traffic and sees **seeded** views.

**Fixes:** A12–A17, A20–A31, A37, A45, plus §13 UI (`track`, `traffic`, Sales | Traffic tabs).

- [x] ✅ Implement every F1 row.
- [x] ✅ Traffic tab: super_admin only; finance does not see it.
- [x] ✅ Exit script, then ✅ the phase.

**Exit script (must pass before phase ✅)**

1. Desk home is exceptions (leads, book, requests) — not empty naira charts.
2. Finance lands on payments; designer on custom.
3. Ade Payments lists **every** open balance; Accept quote has Decline; deposit path works.
4. Production has a Waiting column; Funmi unpaid is **not** on Cutting.
5. Tailor Advance is legal-next-stage only; Production is not nested inside Bench.
6. Olamide Analytics → Traffic shows seeded views/channels; finance login cannot open that tab.
7. Hire preview cannot save an empty nav that loops.

**Do not mark ✅ because types exist. Mark ✅ when the click-through works.**

---

### ✅ F2 — Public IA and OS chrome

**Goal:** Marketing site and dashboards feel finished on the demo DB. Express may start **B0** in parallel (separate README) but F2 ✅ is still a **frontend** click-through.

**Fixes:** A10–A11, A19, A32–A36, A38–A44.

- [x] ✅ Implement every F2 row.
- [x] ✅ Exit script, then ✅ the phase.

**Exit script (must pass before phase ✅)**

1. Footer has Events + Book. Book success shows a reference. Event detail can jump to book.
2. Mobile product card shows Add + WhatsApp without hover.
3. Search is debounced; OS search works **or** is removed.
4. Thank-you / Orders do not flash “not found” / “no tickets” while loading.
5. Bell opens a tray **or** the icon is gone.
6. Forgot-password copy tells the truth on the demo.

---

## 15. After F2

Frontend F0–F2 stay on `localStorage`. Live Paystack, Cloudinary, MySQL, Resend, and real traffic are **backend B0–C0**.

Open `C:\\Users\\DELL\\Downloads\\backend-eunik\\README.md`:

1. Read its **How to work** (same rule: wire E2E, then ✅).
2. Start **B0** only when you can keep F0 ✅ (login honesty already done on the demo).
3. Wire each B-phase into `EUNIK/src/api/http.ts` and the matching screens before marking that B-phase complete.

Do not rewrite the shells. Do not give finance the visitor log.

---

## 16. Frontend file map

| Area | Paths |
|------|--------|
| Routes | `src/App.tsx` |
| Gates / RBAC | `src/components/os/Gates.tsx`, `src/lib/rbac.ts`, `src/components/StaffShopGuard.tsx` |
| Demo API (F0–F2) | `src/db/client.ts`, `seed.ts`, `persist.ts`, `types.ts` |
| HTTP adapter (from B0) | `src/api/http.ts` (new) — see backend README |
| Public chrome | `Header.tsx`, `Footer.tsx`, `Layout.tsx` |
| Buy path | `ProductCard.tsx`, `ProductDetail.tsx`, `Cart.tsx`, `Checkout.tsx`, `MadeToMeasure.tsx`, `Bespoke.tsx`, `lib/whatsapp.ts` |
| Traffic UI | `src/pages/studio/StudioAnalytics.tsx` |
| Client / studio / floor | `src/pages/account/*`, `studio/*`, `atelier/*` |

---

## 17. Closing

The frontend is **ahead of the backend** and **behind a coherent garment lifecycle**. Finish **F0 → F1 → F2** on this tracker (one phase, wire E2E, then ✅). Build the API on the **backend README** the same way. Cut over once (C0) by swapping the adapter, not the OS.
