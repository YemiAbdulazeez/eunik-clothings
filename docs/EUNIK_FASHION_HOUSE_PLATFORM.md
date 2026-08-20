# EUNIK Clothings — Digital Fashion House Platform Spec

> **Purpose:** Turn the current React marketing site into a **fully functional Nigerian fashion e-commerce + bespoke tailoring operating system**, without throwing away the gold-and-ink house that already exists on the street.
>
> **Who this is for:** An implementing agent. After reading this file **and** `docs/EUNIK_DASHBOARD_UI.md`, there should be no need to reverse-engineer Remsana, the original HTML theme, or guess SKUs.
>
> **Source documents**
> | File | Role |
> |------|------|
> | `docs/FASHION_BUSINESS_REVAMP.md` | Generic platform requirements (commerce, MTM, Production, CRM, APIs). **This document is the EUNIK-specific rewrite.** |
> | `docs/DASHBOARD_UI.md` | Remsana auth/dashboard language. **Do not apply its indigo/DM Sans tokens to EUNIK.** |
> | `docs/EUNIK_DASHBOARD_UI.md` | EUNIK rewrite of that UI language for `/account`, `/studio`, `/atelier`. Look there for type, color, shells, motion. |
> | Live app | `src/pages/*`, `src/components/*`, `src/data/catalog.ts`, `src/index.css` |
> | `docs/EUNIK_FRONTEND_FIXES_AND_PHASES.md` | **Client-demo implementation:** `src/db/database.ts` as SSOT, seed users, phased frontend. **Use that file for build order until `backend-eunik` exists.** |
>
> **North star:** *This is a fashion house where a client discovers Ara'nbada and Senator, works with Olasedidun Olamide, stores measurements, follows a garment from cutting rail to fitting, pays in naira, and still has WhatsApp if he prefers to talk to the house.*

---

## 0. Dual-document contract (read first)

| Concern | Authority |
|---------|-----------|
| How **public** pages look (hero, gold highlight, Outfit 120px, product cards, footer) | Current app + §3 of this file |
| How **auth / portals / OS** look (ink sidebar, pills, greeting-first dashboards) | `EUNIK_DASHBOARD_UI.md` |
| What the product **does** (orders, measurements, quotes, Paystack, production) | **This file** |
| What must **not** change on marketing pages | Locked tokens §2.8 and “KEEP” columns in §6 |

**Non-negotiable**

1. Marketing color language stays: gold `#eeb167`, ink `#232323`, muted `#828282`, paper `#f7f7f7`, nero `#1b1b1b`, line `#e4e4e4`.
2. Marketing type stays: Outfit (display) + Figtree 17/32 (body). Never DM Sans. Never royal `#1a237e`.
3. Public chrome stays: gold delivery bar, centered 34px `eunik.png`, hamburger on marketing mobile.
4. WhatsApp (`2348167073585`) remains a **sales channel**, not the only checkout once cart exists.
5. Every new public page uses `Layout.tsx` (Header + Footer). Product-detail is **not** put inside the studio sidebar.
6. Do not build isolated screens. A “Book appointment” page must create an `Appointment` row and show up on `/studio` and `/account`.
7. `backend-eunik` is currently **empty**. For the **client presentation**, the store is `src/db/database.ts` (see `docs/EUNIK_FRONTEND_FIXES_AND_PHASES.md`). That module mimics the API and persists to `localStorage`. A real backend later must replace it behind the same `db.*` functions — UI code must not call `fetch` directly, and must not treat `localStorage` as the production source of truth.

---

## 1. Current webapp — as-built inventory (August 2026)

Treat this as ground truth. Upgrades **extend** it.

### 1.1 Stack

| Layer | Reality |
|-------|---------|
| Frontend | React 19, TypeScript, Vite 7, Tailwind v4 (`@tailwindcss/vite`), React Router 7 `BrowserRouter` |
| Icons | `lucide-react` only |
| Catalog | Static `src/data/catalog.ts` |
| Checkout | None. `src/lib/whatsapp.ts` builds `api.whatsapp.com/send` URLs |
| Auth | None |
| Cart / PDP / search | None |
| CMS | None (homepage, magazine, about copy are hardcoded) |
| Backend workspace | `C:\Users\DELL\Downloads\backend-eunik` — **no files** |
| Payments | Footer copy mentions reCAPTCHA; no Paystack yet |
| PWA | None |
| Tests | None |

### 1.2 Public routes today (`src/App.tsx`)

| Route | Component | What it is |
|-------|-----------|------------|
| `/` | `Home` | Campaign slider, perks, 4 collection tiles, best sellers, promo strip, new-arrival rail, marquee, magazine |
| `/collection` | `Collection` | Five collection cards |
| `/aranbada` | `Category` | 14 Ara'nbada products + “Other Collections” |
| `/men-senator` | `Category` | 20 Senator products (`senator` slug internally; URL is `/men-senator`) |
| `/agbada` | `Category` | 10 Agbada products |
| `/esiki` | `Category` | 4 Esiki products |
| `/suit` | `Category` | 1 suit |
| `/about` | `About` | Brand story, E-U-N-I-K values, mission/vision |
| `/about-us` | redirect | → `/about` |
| `/contact` | `Contact` | Ibadan HQ, mailto form, `map.png` |
| `/contact-us` | redirect | → `/contact` |
| `/:slug` | `Category` | Catch-all; unknown slugs → `/collection` |

Missing public routes that this spec adds: `/shop`, `/shop/:sku`, `/lookbook`, `/bespoke`, `/made-to-measure`, `/journal`, `/journal/:slug`, `/events`, `/events/:slug`, `/book`, `/cart`, `/checkout`, `/search`, policy HTML pages, account/studio/atelier trees.

### 1.3 Company facts already in the UI (must survive)

Use these exact strings unless content managers later change them in CMS.

| Fact | Current value |
|------|----------------|
| Brand | Eunik Clothings (display: **EUNIK CLOTHINGS**) |
| Founder | Olasedidun Olamide A. |
| Origin | EuNikfits Clothings, 2018 indoor; rebrand 2021 |
| Legal | Subsidiary of **EUNIK MULTIPURPOSE COMPANY NIGERIA LIMITED (RC 1869194)** |
| HQ | Ibadan, Oyo State, Nigeria |
| Phone | `08167073585` / WhatsApp `2348167073585` |
| Email | `info@eunikclothings.com` |
| Instagram | `https://www.instagram.com/eunikclothing?igsh=YWh2bWp0c2p4dGI3&utm_source=qr` (shown as “100k Followers”) |
| Site | `https://eunikclothings.com` |
| Free delivery threshold | **₦100,000** (header currently writes `#100,000` — upgrade copy to **₦100,000**) |
| Promo code on home | `EUNIK-DEC-2024` (25% extra on favourite dress style — currently a static strip; must become a real coupon or be dated in CMS) |
| Policies | `/images/order-policy.jpg`, `/images/job-taking-policy.jpg` |
| Core values | Excellent · Unique · Newness · Innovative · Knowledgeable |
| Developer credit | Abdul-Azeez Adeleye (`https://azeezadeleye.vercel.app/`) |

### 1.4 Catalog reality (seed for `products` table)

**49 garments.** SKU prefixes are sacred: `ARA` 5xxx, `SEN` 3xxx, `AGB` 2xxx, `ESK` 4xxx, `SUIT` 6xxx.

Image paths are **case-sensitive** on Linux/Vercel. Keep these three uppercase extensions:

- `/images/ara5000.JPG`
- `/images/sen3005.JPG`
- `/images/sen3006.JPG`

`public/images/sen3020.jpg` exists on disk but is **not** in `catalog.ts`. Do not auto-publish it. Treat it as unassigned media until merchandising adds `SEN3020`.

#### Ara'nbada (`slug: aranbada`, path `/aranbada`, 14 items, tagline “Vintage elegance”)

| SKU | Name | Featured on home |
|-----|------|------------------|
| ARA5000 | Stripped Vintage Outfit | |
| ARA5001 | Black Vintage Outfit | yes |
| ARA5002 | Stripped Rainbow Vintage Outfit | |
| ARA5003 | White Canvas Outfit | |
| ARA5004 | Green Canvas Outfit | yes |
| ARA5005 | Cream Vintage Outfit | |
| ARA5006 | Black Roundneck Vintage | yes |
| ARA5007 | Patterned Vintage Outfit | |
| ARA5008 | Black-Gold Vintage Outfit | yes |
| ARA5009 | Ash Vintage Shirt | |
| ARA5010 | Green Shirt Outfit | yes |
| ARA5011 | TheBoss Vintage Outfit | |
| ARA5012 | Blue Vintage Outfit | |
| ARA5013 | Gray Vintage Outfit | |

Hero/campaign still: `/images/ara-bg.jpg`. Home category tile uses `/images/ara5002.jpg` (not the collection-page cover). Collection cover: `/images/ara5004.jpg`.

#### Men’s Senator (`slug: senator`, path `/men-senator`, 20 items, tagline “Modern classics”)

SEN3000 Chocolate · SEN3001 Mustard · **SEN3002 Cream (featured)** · SEN3003 White · SEN3006 Navy · **SEN3005 Green (featured)** · SEN3007 Wine · **SEN3008 Green (featured)** · SEN3009 Purple · **SEN3010 Black Classic (featured)** · SEN3011 Green Half Sleeve · **SEN3012 Navy (featured)** · SEN3013 Ash-gray · SEN3014 Gold · SEN3015 Skyblue · SEN3016 Green Half-sleeve · SEN3017 Powderblue · SEN3018 White Half-sleeve · SEN3019 Sky-Navyblue · SEN3021 Ash.

Home tile: `/images/sen3007.jpg`. Collection cover: `/images/sen3009.jpg`. Campaign: `/images/senator-bg.jpg`.

Note: `SEN3004` is missing from both disk catalog usage and product list. Do not invent it.

#### Agbada (`slug: agbada`, path `/agbada`, 10 items, tagline “Traditional regalia”)

AGB2000 Copper Exclusive · **AGB2001 White Vintage (featured)** · AGB2002 Off-White · **AGB2003 Wine (featured)** · AGB2004 Blue Full Embroidery · AGB2005 Green · AGB2006 White-Gold · AGB2007 White-Ash · AGB2008 Black · AGB2009 Red-wine.

Home + collection cover: `/images/agb2000.jpg`. Campaign: `/images/agbada-bg.jpg`. New-arrival rail uses `/images/agb2004.jpg`.

#### Esiki (`slug: esiki`, path `/esiki`, 4 items, tagline “Statement pieces”)

**ESK4000 Off-White (featured)** · **ESK4001 Ash (featured)** · **ESK4002 Black Rainbow (featured)** · ESK4003 Black-Gold. Covers: `/images/esk4000.jpg`.

#### Fashion Suits (`slug: suit`, path `/suit`, 1 item, tagline “For corporates”)

SUIT6000 Men’s Exquisite Suit. Cover `/images/suit6000.jpg`. Not on the four-up homepage category row (home currently hides suit — **keep that editorial choice**; suit remains on `/collection` and new-arrival rail).

#### Home best-seller order (do not scramble)

```
ARA5001, SEN3002, ARA5004, AGB2001, ESK4001,
SEN3005, AGB2003, ESK4002, ARA5006, SEN3008,
ARA5008, ESK4000, SEN3010, ARA5010, SEN3012
```

This list is `featuredOrder` in `catalog.ts`. When products move to the API, store `is_featured` **and** `featured_rank`.

### 1.5 Product record today vs required tomorrow

**Today (`Product` type)**

```ts
id, sku, name, image, category, featured?
```

**Tomorrow (minimum commerce fields)** — see §11. Until then, cards stay visual; WhatsApp still works if price is null.

### 1.6 WhatsApp order template (keep, extend)

Current message (`orderWhatsAppUrl`):

```text
Hello Eunik, Trust you're doing fine. I'll like to order {SKU} as seen on the website | https://eunikclothings.com{image} | Please provide the quote. The measurement details are ....
```

Upgrade:

- If the shopper is logged in, append name, phone, measurement profile id.
- If a cart exists, add “I also have bag #{id}” or pre-create a `Lead` in studio.
- Button label on cards can stay **Order Now**; PDP adds **Add to bag** beside it.
- Studio “WhatsApp orders unclaimed” queue: parse inbound `/ store click-through UTM `?src=web`.

### 1.7 Page-by-page current structure (so upgrades do not delete sections)

#### Home (`Home.tsx`) — KEEP these blocks in this order unless CMS reorders them

1. Full-viewport hero (3 slides: Ara'nbada / Senator / Agbada, 4s autoplay, gold “Discount on selected collection!”, Outfit 120px title, rectangular ink **Shop Collection**)
2. Four perks: Free shipping · 30 days free amendment · Secure payment · Online support (keep the spelling **ammendment** until CMS fixes it, or correct once — prefer **amendment**)
3. Four collection tiles (Ara'nbada, Men’s Senator, Agbada, Esiki) with `{nn} items` pills and white round CTA
4. `#featured` Best seller Products + WhatsApp instruction paragraph
5. Ink promo strip + gold code pill `EUNIK-DEC-2024`
6. `#collections` New arrival collection + horizontal look tiles
7. Giant watermark “new collection”
8. Marquee ticker
9. `#news` Eunik magazine (4 static quotes, author Olamide Olasedidun, Nov 2024 dates)

**Homepage CMS** must be able to edit this without code (FASHION_BUSINESS_REVAMP §3.1). Until CMS ships, keep hardcoded fallbacks identical to today.

#### Collection, Category, About, Contact

- Collection: `PageHero` “Collections” + 5 cards.
- Category: `PageHero` collection name, crumb “Shop”, sidebar “Other Collections”, `ProductGrid` compact.
- About: paper hero, campaign banner + spinning gold seal + logo, journey copy, gallery strip, core values, 10000+ / 4.9 stats (currently **template numbers** — replace with CMS or hide until real), RC 1869194, mission/vision accordion.
- Contact: underline Figtree fields, mailto, `map.png`, overlapping white form card.

#### Header / Footer

- Header left: Find stores → `/contact`, Home, Featured `/#featured`, Collection.
- Header right: Magazine `/#news`, About, Contact, Instagram.
- Footer: Categories (all five), Information, Quick contact, Become a customer newsletter (client-side “Thanks” only).

### 1.8 Gaps vs a functioning fashion e-commerce house

| Capability | Now | Target |
|------------|-----|--------|
| Browse looks | Yes | Yes + filters, sort, search |
| Product detail | No | Full PDP on marketing shell |
| Price | No | ₦ from backend |
| Cart / checkout | No | Yes + pickup Ibadan / delivery Nigeria |
| Size / fabric / colour | No | Variants + MTM options |
| Accounts | No | Client + staff |
| Measurements | WhatsApp ellipsis | Structured profiles |
| Custom design | No | “Design something for me” |
| Quotations / deposits | No | First-class |
| Production / fittings / QC | No | Atelier OS |
| Magazine | 4 hardcoded cards | Blog CMS + related products |
| Events | Mentioned in About copy | Event objects + RSVP |
| Lookbook | New-arrival rail only | Editorial lookbook |
| Inventory / fabric | No | Fabric SKUs |
| Paystack / bank transfer + receipt | No | Two checkout methods only; Paystack webhooks later |
| Admin | No | `/studio` |
| PWA | No | Installable storefront |
| SEO | Title + meta on `index.html` only | Per-page + JSON-LD |

---

## 2. Upgrade principles (how the docs become this app)

### 2.1 Four connected experiences

From FASHION_BUSINESS_REVAMP §1, named in EUNIK language:

| # | Experience | URL prefix | Shell | Audience |
|---|------------|------------|-------|----------|
| 1 | Public fashion house | `/`, `/shop`, `/collection`, … | `Layout.tsx` marketing | Anyone |
| 2 | Client atelier (customer portal) | `/account/*` | `AccountLayout` `.eunik-os` | Logged-in clients |
| 3 | Fashion House OS | `/studio/*` | `StudioLayout` `.eunik-os` | Owner, manager, content, finance |
| 4 | Atelier floor | `/atelier/*` | `AtelierLayout` `.eunik-os` | Tailor, cutter, QC, front desk |

Visual recipes: `EUNIK_DASHBOARD_UI.md` §§12–21. Domain behaviour: this file.

### 2.2 Do not treat EUNIK as a generic marketplace

The original HTML already jumps to WhatsApp with “measurement details are ....”. That is embryonic **made-to-measure**. The upgrade must **not** flatten everything into Amazon-style SKU checkout. Senator in black may sell RTW if a size exists; the same look can open “Make this in my measurements.”

### 2.3 Dual CTA forever

Every purchasable PDP and cart line:

```text
[ Add to bag ]     [ Order on WhatsApp ]
```

Bag uses the platform. WhatsApp uses the template in §1.6 and also writes a `ChannelLead` so front desk sees it in studio.

### 2.4 Historical integrity

Orders freeze: SKU snapshot, image URL, unit price, fabric, customization, **measurement snapshot**, deposit %, staff notes. Never “live-link” only to the client’s latest measurement profile (FASHION_BUSINESS_REVAMP §11).

### 2.5 Backend is source of truth

Pricing, stock, payment status, production stage, RBAC: server-side. `backend-eunik` should own this. Suggested default: Node/Nest or Laravel + PostgreSQL matching `../backend-eunik`. Frontend talks REST (or tRPC) with cookie/JWT; never mark paid because Paystack.js said so.

### 2.6 Mobile-first storefront, operations-dense studio

Storefront: large editorial images, sticky bag bar, PWA tab bar. Studio: tables, filters, Kanban, calendar. See FASHION_BUSINESS_REVAMP §59 + dashboard spec §5.

### 2.7 Locked marketing tokens (copy into any new CSS, never rename)

```css
@theme {
  --font-alt: "Outfit", sans-serif;
  --font-primary: "Figtree", sans-serif;
  --color-gold: #eeb167;
  --color-ink: #232323;
  --color-muted: #828282;
  --color-paper: #f7f7f7;
  --color-nero: #1b1b1b;
  --color-line: #e4e4e4;
}
body { font-size: 17px; line-height: 32px; color: var(--color-muted); background: #fff; }
```

Preserve utilities: `.highlight`, `.animate-marquee` (28s), `.animate-fade-up`, `.animate-spin-slow`, `.product-card` overlay, `.collection-card` scale 1.06.

Product OS tokens live under `.eunik-os` only (`EUNIK_DASHBOARD_UI.md` §4 / §18).

---

## 3. Core business models (mapped to EUNIK garments)

The platform must support **four** product/order types at database level (`product_kind` / `order_kind`):

`ready_to_wear` · `made_to_measure` · `bespoke` · `alteration`

A **single catalog row** (e.g. SEN3002 Cream Senator) can enable RTW **and** MTM via flags `sells_rtw`, `sells_mtm`. Bespoke never requires a catalog SKU (though staff may attach a reference look).

### 3.1 Ready-to-wear

Customer buys a finished piece (or a standard size cut from stock).

Examples in **this** house: Fashion Suits SUIT6000 when sized; selected Senator/Esiki if merchandising marks sizes in stock. Many natives will stay MTM-only.

```text
Browse /shop or /men-senator
→ /shop/sen3002
→ Size / colour (if variants)
→ Add to bag
→ Checkout (₦ — Paystack or transfer + receipt)
→ Order confirmation
→ Processing → Dispatch or Ibadan pickup
→ Review
```

### 3.2 Made-to-measure (the default for most current WhatsApp orders)

Customer selects an **existing design** (ARA/SEN/AGB/ESK/SUIT) and the house cuts it to his body.

```text
Browse design
→ PDP “Make this to measure”
→ Fabric (optional surcharge)
→ Measurement profile (or book measurement at Ibadan)
→ Price / quote (if fabric extras)
→ Deposit or full
→ Production pipeline
→ Fitting(s)
→ Alterations
→ QC
→ Balance
→ Pickup Ibadan or delivery
```

This is the spiritual successor of the WhatsApp sentence “The measurement details are ....”.

### 3.3 Bespoke / custom

No SKU required. First-class flow — **never** stuffed into cart-only checkout.

```text
/bespoke or “Design something for me”
→ Consultation (WhatsApp, video, or Ibadan)
→ Design discussion
→ Fabric
→ Measurements
→ Quotation
→ Accept
→ Deposit
→ Production → Fitting → Alteration → QC
→ Balance
→ Delivery/Pickup
```

Example seed copy (from original spec, EUNIK voice):

> I need a burgundy three-piece for my wedding on December 18, Ibadan. Budget around ₦450,000.

### 3.4 Alteration / job-taking

Honour `job-taking-policy.jpg`. Walk-in or logged-in request: sleeve, waist, length, fit. Creates an `AlterationOrder` linked to a previous order or “garment brought in”.

---

## 4. Information architecture & navigation

### 4.1 Public marketing header (extend, do not replace)

Desktop Outfit 19px, centered logo. Recommended final set:

```text
Left:  Home · Shop · Collections · Lookbook
Logo:  eunik.png 34px
Right: Bespoke · Magazine · About · Contact · Account · Bag
```

Gold top bar stays. “Shop now” → `/shop` (today `/#featured`).

**Find stores** still → `/contact` until a true store locator exists (single HQ).

**Mobile marketing**

1. Keep hamburger for the long list.
2. Add storefront bottom bar (FASHION_BUSINESS_REVAMP §47, dashboard spec §12.1):

```text
Home · Shop · Search · Wishlist · Bag
```

Do **not** use studio 4+More here.

### 4.2 Public sitemap (target)

```text
/                         Home (existing, CMS-managed)
/shop                     All products, filters
/shop/:sku                PDP (sku lowercase ara5001)
/collection               Collection index (existing)
/aranbada                 Category (existing)
/men-senator
/agbada
/esiki
/suit
/lookbook
/lookbook/:slug
/bespoke
/made-to-measure
/about                    existing
/journal                  magazine index (replace dead #news cards when ready)
/journal/:slug
/events
/events/:slug
/contact                  existing
/book                     appointment
/cart
/checkout
/search
/policies/order
/policies/jobs
/account/*                client OS
/studio/login
/studio/*
/atelier/*
```

Keep redirects `/about-us`, `/contact-us`. Optionally `/index.html` style aliases not needed on Vite.

### 4.3 Client portal nav

```text
Overview
My orders
Custom designs
Measurements
Appointments
Fittings
Payments & balances
Wishlist
Reviews
Support
Profile
Notifications
```

Search placeholder: “Search orders, quotations, fittings…”  
Header CTA: “Request a design”.

### 4.4 Fashion House OS groups

```text
Overview

Commerce
  Orders · Products · Categories · Collections · Inventory · Fabrics · Customers · Reviews · Returns

Custom tailoring
  Custom requests · Quotations · Measurements · Appointments · Fittings · Production · Alterations · Quality control

Payments & finance
  Transactions · Refunds · Outstanding balances · Revenue

Content
  Homepage · Magazine · Lookbook · Events · Testimonials · Media

Operations
  Shipping · Pickup · Support · Notifications · Attendance

People
  Customers · Staff · Roles

Analytics
  Sales · Products · Customers · Production · Inventory

System
  Settings · Audit logs
```

### 4.5 Atelier floor

```text
On my bench · Queue · Measurements · Fittings · Appointments · Notes · Attendance · Notifications
```

---

## 5. Public storefront upgrades (visual KEEP / structural ADD)

Every subsection: what stays from the current page, what is added from the business doc, how it should look.

### 5.1 Homepage

| Block | Action |
|-------|--------|
| Hero (3 campaigns) | **KEEP** slides/assets. ADD CMS fields: image, title, subtitle, highlight, CTA path, start/end. Optional 4th slide for Esiki/Suit. |
| Perks | KEEP four. Make copy CMS. Wire “Free shipping on first order” to settings (`free_shipping_threshold_kobo` = 10000000 kobo = ₦100,000 — or first-order flag). |
| Four collection tiles | KEEP layout, white pill, item counts from API not hardcoded 14/20/10/04. |
| Best sellers | KEEP grid + hover Order Now. ADD optional price under name when stored; do not force ₦ on cards until prices exist. Instruction sentence KEEP. |
| Promo strip | KEEP ink/gold. Back with `Coupon` `EUNIK-DEC-2024` or hide when expired. |
| New arrival rail | KEEP. Each tile already maps to a category — ADD optional lookbook slug. |
| Marquee | KEEP motion. Fix ticker “over $130” leftover if still present — use **₦100,000**. |
| Magazine | KEEP 2×2 editorial cards. When Journal CMS is live, bind to latest 4 posts; keep Outfit titles and Figtree byline. |
| NEW: Designer intro | After perks or before featured: portrait (founder), 2-line Outfit heading “The house of Olasedidun Olamide”, Figtree paragraph excerpt from About, CTA “The journey”. Image-led, no cards bouncing. |
| NEW: Bespoke / MTM dual CTA | Two large collection-card style panels: “Made to measure existing looks” → `/made-to-measure`; “Design something for me” → `/bespoke`. Gold highlight titles. |
| NEW: Book appointment | Quiet text + ink rectangular button matching Home “Shop Collection”. |
| NEW: Instagram grid | 6–8 images from media library or tagged posts; tap-through to Instagram URL already in footer. |
| NEW: Testimonials | Pull approved `Review` where `is_testimonial`. If empty, omit (no fake 8549). |
| NEW: Upcoming events | If status=published and date≥today, one rail; else omit. |

Administrators edit homepage via `/studio/content/homepage` as a **section list**, not by shipping a new React tree every campaign.

### 5.2 Header / Footer

- Add Bag count pill (ink, 11px) when cart length > 0.
- Account link: if session → `/account`, else `/account/login`.
- Newsletter: POST `/api/newsletter`; success gold text already in Footer.
- Footer trust line: **Paystack** · **Bank transfer**. Do not add Flutterwave logos.
- Footer email already decoded: keep `info@eunikclothings.com`.
- Policy links: migrate from raw JPG to `/policies/order` and `/policies/jobs` that still **display the existing JPGs** plus optional HTML restatement.

### 5.3 Shop (`/shop`)

Upgrade of Category grid, **same ProductCard language**.

**Browse buckets** (filters, not necessarily routes): Ready-to-wear, Native wear, Ara'nbada, Senator, Agbada, Esiki, Suits, New arrivals, Limited, All.

**Filters (drawer on mobile, left rail lg+)**

- Category (five slugs)
- Collection (campaigns)
- Kind: RTW / MTM available
- Size (when variants exist)
- Colour
- Fabric
- Price
- Availability
- Occasion (wedding, friday wear, formal, owambe)
- Style (vintage, classic, embroidery, half-sleeve)

**Sort:** Featured · Newest · Best selling · Price ↑ · Price ↓ · Highest rated.

Empty: “No looks in this cut. Try Senator or clear filters.” Figtree, not a blank ul.

Keep “Other Collections” mental model on category URLs; `/shop` uses filters instead of four duplicate marketing tiles.

### 5.4 Product detail (`/shop/:sku`) — NEW, marketing shell

FASHION_BUSINESS_REVAMP §6, visual recipe dashboard spec §21.8.

**Must show**

- Outfit title (`Black Vintage Outfit`)
- SKU pill (existing style, e.g. `ARA 5001`)
- Gallery: start with the one image we have; allow more later; zoom; fullscreen
- Short description + long description
- ₦ price / sale price when set; if only MTM, show “From ₦X” or “Quote on request”
- Fabric, colour, sizes, size guide dialog (`rounded-2xl`)
- Care, production time, delivery estimate, availability
- Customization expander (collar, sleeve, embroidery…) when `allows_customization`
- Sticky mobile actions: Add to bag · Order on WhatsApp · Heart
- Secondary: Share, Request custom version, Restock notify
- Related looks in same category (ProductGrid)

**Do not** put this page in `.eunik-os`. Use `PageHero` optional crumbs: Home / Senator / SEN3002.

`Buy now` skips bag and opens checkout with one line item (RTW only).

### 5.5 Category pages (keep URLs)

`/aranbada` etc. remain shareable. Internally they become **pre-filtered shop views** using the same grid component so filters stay consistent. Sidebar “Other Collections” KEEP.

### 5.6 Lookbook (`/lookbook`)

Editorial, image-led, full-bleed rows. Each look: large photo (can reuse catalog images), collection name, outfit, designer notes, fabric, shop this look, request similar. Not a pentagrid of ProductCards — more magazine than shop.

Shop-this-look can deep-link several SKUs (e.g. SEN3002 + trousers accessory later).

### 5.7 Collections CMS

Admin creates: Heritage, Wedding, Friday Senate, Limited, Campaign. Fields: name, slug, description, cover, banner, products[], looks[], SEO, start/end, status.

The five hardcoded house lines (Ara'nbada…) are **categories**, not always “collections”. Do not collapse them.

### 5.8 Bespoke landing (`/bespoke`)

Hero can reuse `agbada-bg.jpg` / `ara-bg.jpg`. Outfit title, gold highlight, Figtree house copy, then the **Design something for me** form (next section). CTA Book consultation.

### 5.9 Made-to-measure landing (`/made-to-measure`)

Explain: pick a look (grid of current 49), we cut to you. Link into shop with `?kind=mtm`.

### 5.10 About

KEEP journey copy, values, RC, founder, gallery. REPLACE template “10000+ / 4.9 / 8549” with CMS stats or a quieter strip (“Clients across Oyo, Lagos, Abuja, Ekiti”). ADD Book appointment + Visit Ibadan. Keep spinning gold seal.

### 5.11 Contact

KEEP Ibadan HQ block and map art. Form POSTs `/api/support-tickets` (and optional mailto fallback). Fields already exist: name, email, phone, subject, message.

### 5.12 Journal / Magazine

Migrate `#news` cards to `BlogPost`. Categories: Styling, Behind the rail, Heritage, Weddings, House notes. Fields from FASHION_BUSINESS_REVAMP §37 plus `relatedProductIds`. Author default **Olamide Olasedidun**.

### 5.13 Events

Fashion shows, launches, pop-ups, private clients, exhibitions (About already claims 15+ shows). Capacity, tickets via **Paystack** (₦) where priced — same two-method checkout as shop if they pay from the site.

### 5.14 Book appointment (`/book`)

Services: Consultation, Measurement, Fitting, Design discussion, Fabric selection, Pickup.

Fields: service, date, time, location default **Eunik HQ, Ibadan**, notes. Guest may book with name/phone/email; logged-in attaches to customer.

Statuses: Requested → Confirmed → Rescheduled → Completed → Cancelled → No-show.

Studio: calendar + list (`EUNIK_DASHBOARD_UI.md` §5.3 calendar).

---

## 6. Custom design request

Dedicated “Design something for me” (public + `/account/custom-designs/new`).

**Capture**

- Outfit type: Agbada, Senator, Ara'nbada/vintage, Esiki, Suit, Three-piece, Kaftan, Other
- Occasion: Wedding, Owambe, Friday, Corporate, Chieftaincy, Other
- Preferred style / colour / fabric
- Budget range (₦ bands: under 150k, 150–300k, 300–500k, 500k+, undisclosed)
- Required delivery date
- Reference images (media library + WhatsApp later)
- Description, notes
- Consultation method: Ibadan visit, WhatsApp, Video, Phone

Creates `CustomDesignRequest` visible in studio Need attention. Does **not** auto-create a paid order.

---

## 7. Quotations

Staff convert a request → quotation.

**Fields:** number `Q-2026-00041`, customer, design description, fabric, labour, accessories, customization, delivery, total ₦, deposit required, balance, estimated completion, terms, expiration.

```text
Custom request → Staff review → Quotation → Notify client
→ Client accept/reject in /account → Deposit → Order + ProductionOrder
```

Client quotation UI: dashboard spec §21.7 (gold deposit well, Accept pill).

Deposit example (keep in fixtures):

```text
Total          ₦450,000
Deposit        ₦250,000
Paid           ₦250,000
Balance        ₦200,000
```

When garment is Ready: notify *Your outfit is pressed and waiting in Ibadan. Outstanding balance: ₦200,000.* Pay balance in portal.

---

## 8. Measurements (core of this house)

WhatsApp’s trailing “measurement details are ....” becomes structured data.

### 8.1 Client profiles

Multiple named profiles, never overwrite history.

```text
Olamide — Current
Olamide — Wedding 2026
Olamide — Studio 2024
```

**Base fields (cm, inches toggle):** neck, shoulder, chest, waist, hip, sleeve, bicep, wrist, shirt length, trouser waist, thigh, knee, trouser length, inseam, outseam, jacket length, height, weight (optional), notes.

**Native extras (show when outfit type needs them):** agbada length, overflowing, cap/fila, embroidered chest, Senator top length, round sleeve, crotch.

Every custom/MTM **order** stores a **frozen JSON snapshot** `order.measurement_snapshot` + `measurement_profile_id` + `measured_at`.

### 8.2 Staff capture

From `/studio` or `/atelier`: customer, profile name, values, unit, date, staff, fit preference `slim | regular | relaxed`, photos, notes. Workflow: save → client confirmation notification.

UI: dashboard spec §21.6. Sticky **Save profile** pill.

---

## 9. Appointments, fittings, production, QC, tasks

Follow FASHION_BUSINESS_REVAMP §§13–18 with EUNIK nouns.

### 9.1 Fittings

Multiple per order:

```text
Measurements → First fitting → Alterations → Second fitting → Final approval
```

Record: order, garment, date, staff, measurements delta, alteration notes, photos, client feedback, status.

### 9.2 Production pipeline (custom / MTM)

```text
Quote accepted
→ Deposit paid
→ Design confirmed
→ Fabric confirmed
→ Measurements confirmed
→ Cutting
→ Sewing
→ Finishing
→ First fitting
→ Alterations
→ Final fitting
→ Quality check
→ Ready for pickup/delivery
→ Completed
```

Client sees **simplified**:

```text
✓ Design confirmed
✓ Measurements confirmed
✓ Fabric selected
✓ Cutting completed
● Sewing in progress
○ First fitting
○ Finishing
○ Ready for pickup
```

Gold = current stage (`EUNIK_DASHBOARD_UI.md` §21.3).

### 9.3 Tasks & roles on a garment

Designer · Cutter · Tailor · Finisher · QC. Fields: assignee, status, start/due/done, notes, attachments.

### 9.4 Production dashboard (studio + atelier)

Columns/tables: awaiting cutting, in sewing, awaiting fitting, alterations, QC, ready, overdue.

Example row:

| Order | Customer | Garment | Stage | Due | Assigned |
|-------|----------|---------|-------|-----|----------|
| #1001 | Client A | AGB2003 Wine Agbada | Sewing | 20 Aug | Tailor A |
| #1002 | Client B | SUIT6000 | Fitting | 18 Aug | Tailor B |

Kanban visual: dashboard spec §21.5 (overdue = destructive left border).

### 9.5 Quality checklist (must pass before Ready)

Correct client · fabric · design · measurements · stitching · buttons/accessories · embroidery · ironing · final fitting · client approval. Only roles with `quality.approve` can mark Ready.

---

## 10. Fabric & inventory

Fabric is inventory, not a CSS colour name.

**Fabric record:** name, type, colour, pattern, supplier, cost, qty, unit (yards), SKU, images, status (`available | low | reserved | out | discontinued`).

Types relevant to this house: Guinea brocade, Senator fabric, cashmere blend, linen, velvet, Italian wool, Ankara (for trim), embroidery thread lots.

**PDP fabric picker example**

```text
Cream Senator Outfit (SEN3002)
Choose fabric:  Navy · Wine · Black · Cream · Grey
```

Surcharge may change unit price. Backend recomputes.

**Stock transactions:** received, sale, return, adjust, damaged, lost, reserved, released — with staff and timestamp.

Track products, variants, fabrics, accessories, reserved vs available.

Low-stock fabrics appear on studio Need attention.

---

## 11. Product data model (evolve `catalog.ts`)

```text
Product
  id, sku, name, slug
  category_id          // aranbada | senator | agbada | esiki | suit
  kind flags           // sells_rtw, sells_mtm, is_bespoke_template
  status               // draft | live | hidden | archived
  short_description, description
  price_kobo, compare_at_kobo
  currency = NGN
  fabric_id default, colour_label
  production_days_min/max
  care_html
  size_guide_id
  allows_customization
  is_featured, featured_rank
  seo_title, seo_description, og_image
  created_at, updated_at

ProductImage[]         // first = current catalog image
ProductVariant[]       // size, colour, sku suffix, stock, price override
ProductCustomization[] // collar, sleeve, buttons, embroidery, trouser, jacket, pocket, monogram; each with +kobo
CollectionProduct[]
```

**Seed:** insert all 49 rows from §1.4 with `price_kobo = null` until merchandising sets prices. `sells_mtm = true` for all; `sells_rtw = true` only when a variant has stock.

Customization options may stack; server calculates `base + variant + fabric_delta + customizations - discount`.

---

## 12. Cart, checkout, delivery, deposits, payments

### 12.1 Cart lines

May mix: RTW variant, MTM design+fabric+measurement_profile_id, customization JSON, qty, unit price, discount, delivery, total.

Revalidate before checkout: existence, purchasable, qty, live price, fabric, customization, coupon, stock, delivery fee (FASHION_BUSINESS_REVAMP §21).

### 12.2 Checkout (public shell, denser than Home but still Outfit/Figtree)

- Contact (prefill account)
- Delivery address **or** Pickup Ibadan HQ
- Method: courier / pickup
- Promo codes
- Order summary in **₦** only (`en-NG`)
- Deposit vs full (MTM/bespoke: `deposit_percent` default e.g. 60% or fixed ₦ from quote)
- **Payment — exactly two options.** Currency is **Naira (NGN)** only. Do not offer Flutterwave, USSD, Apple Pay, or generic “payment link” as first-class methods.

#### A. Paystack

Initialize Paystack (inline, popup, or redirect) for the **kobo** amount. The customer never types card data into an EUNIK form. Use the EUNIK Paystack merchant (live later; demo references `PAY_demo_*`).

```text
Place order (pending_payment)
→ Paystack initialize (amount_kobo, email, order id)
→ Customer completes Paystack
→ Server verify + webhook (demo: db.payments.completePaystack)
→ payment.status = successful
→ RTW processing / MTM deposit paid
```

Never mark paid because the popup claimed success.

#### B. Bank transfer + receipt + transaction number

For clients who prefer to pay into the house account.

Checkout shows `settings.bank` (bank name, account name, **account number**, narration hint = order number).

The customer **must** submit both:

1. **Transaction number** (bank reference / session ID) — required
2. **Receipt image** — required upload (jpg, png, webp, or pdf)

```text
Place order (pending_payment)
→ Customer transfers ₦ to EUNIK
→ Uploads receipt + transaction number
→ payment.method = bank_transfer, status = awaiting_verification
→ Finance / front desk reviews in /studio/payments
→ Approve → successful
→ Reject → client resubmits
```

Guest checkout allowed for **RTW only**. MTM/bespoke require account. **Deposits and balance payments use the same two methods.**

### 12.3 Delivery vs pickup

**Delivery:** address, recipient, phone, courier, tracking, fee, dispatch date, status. Honour free shipping ≥ ₦100,000.

**Pickup:** location Eunik HQ Ibadan, date, authorized collector, staff sign-off, photo optional.

### 12.4 Payments OS (Naira)

**Currency is NGN everywhere.** Store **kobo** integers. Display `en-NG` (₦85,000). Never USD, `$`, or `#100,000`.

```text
Payment
  amount_kobo, currency = NGN
  type                 // deposit | balance | full | refund
  method               // paystack | bank_transfer
  provider             // paystack | house_bank
  status               // pending | awaiting_verification | successful | failed | rejected | refunded | partial
  paystack_reference
  transaction_number   // bank session/ref (required for transfer) or echoed Paystack ref
  receipt_media_id     // required when method = bank_transfer
  submitted_at
  verified_by_staff_id
  verified_at
  rejection_reason
```

Studio **Payments** queue: Paystack successes (read-only), plus **receipts waiting review** (thumbnail, transaction number, ₦, Approve / Reject). Need-attention includes unpaid deposits and `awaiting_verification`.

**When backend exists:** Paystack initialize + verify + webhook signature; receipt files in media storage. Partial refunds for RTW via Paystack or finance note; bespoke follows `order-policy.jpg`.

---

## 13. Orders (client tracking)

Types: RTW, MTM, bespoke, alteration.

Order holds: customer, lines/garments, variants, measurement snapshot, fabric, customizations, money, payment, production, fittings, delivery, internal notes, status history.

**RTW tracker**

```text
Placed
→ Pending payment
→ Payment confirmed (Paystack success OR finance approved the transfer receipt)
→ Processing
→ Dispatched
→ Out for delivery
→ Delivered
```

**Bespoke / MTM tracker**

```text
Confirmed → Design → Measurements → Production → Fitting → Alteration → QC → Ready → Delivered/Picked up
```

Re-order: from `/account/orders/:id` → revalidate live price/stock → bag.

---

## 14. Returns & alterations

Return reasons: wrong size, wrong item, damaged, defective, other.  
Tailoring: sleeve, waist, length, fit, other.

```text
Request → Staff review → Approval → Work → QC → Client confirmation → Done
```

Respect `order-policy.jpg`. Return window setting in System.

---

## 15. Customer portal behaviour

### 15.1 Overview widgets

Active orders, upcoming Ibadan appointments, pending quotations, outstanding ₦, upcoming fittings, recent purchases, recommended ARA/SEN looks, notifications.

Greeting-first composition: `EUNIK_DASHBOARD_UI.md` §14.1.

### 15.2 Profile

Name, email, phone, DOB, addresses, preferred styles/colours/fabrics, measurement profiles, spend, notes (client-visible vs internal).

### 15.3 Wishlist

Save look, remove, add to bag (if RTW/MTM), request custom version, share.

### 15.4 Reviews

After Completed: stars, text, images, verified purchase. Studio: approve/reject/hide/delete/respond. Approved testimonials may appear on Home.

---

## 16. CRM & follow-up (studio)

Staff open a client dossier: contacts, measurements history, orders, spend, balances, appointments, fittings, custom designs, quotes, reviews, tickets, internal notes, WhatsApp thread link.

Example internal note:

> Prefers relaxed Senator. Usually dark colours. Hates shiny buttons.

**Follow-up queues:** pending quote, unpaid deposit, outstanding balance, fitting soon, missed appointment, delayed order, pickup pending, inactive, birthday, new collection, campaign.

---

## 17. Staff, RBAC, attendance

### 17.1 Roles (EUNIK names)

| Role | Access |
|------|--------|
| Super Admin | Everything |
| Manager | Operations, clients, orders, production, reports |
| Sales / Front desk | Clients, quotes, appointments, orders, WhatsApp leads |
| Fashion Designer | Designs, consultations, custom orders |
| Tailor | Assigned sewing |
| Cutter | Cutting tasks |
| Finishing / QC | Finish + checklist |
| Finance | Payments, balances, reports |
| Content Manager | Homepage, journal, lookbook, events, media |

Permissions as in FASHION_BUSINESS_REVAMP §42 (`products.view`, `quotes.approve`, `production.update`, …). **Enforce on API.** Hiding a sidebar item is not security.

Staff CRUD: add, edit, deactivate, role, department, reset password, activity.

### 17.2 Attendance (optional phase)

Clock in/out, late, early leave, absence, schedule, leave. Reports: daily/monthly rate.

Atelier overview shows Clock if `attendance.enabled`.

---

## 18. Notifications

**Client:** quote created/accepted, deposit, transfer receipt received (awaiting house confirmation), payment confirmed, order confirmed, production started, fitting scheduled, alteration, ready, balance due, payment rejected (retry), dispatch, delivered, appointment reminder.

**Staff:** new order, new custom request, new quotation request, new appointment, new fitting, assigned production task, low stock, **Paystack received**, **bank receipt awaiting review**, delayed order, new support request.

Channels: in-app, email, SMS (Nigerian provider), push (PWA). WhatsApp business API is a later phase; until then, staff get “open WA” deep links.

---

## 19. Search, SEO, media, PWA

### 19.1 Search

`/search` + header overlay. Query: product name, SKU, collection, category, fabric, style, journal. Suggestions, recent, popular, prefix match; typo tolerance later (Meilisearch/Typesense).

### 19.2 SEO

Per public entity: title, description, canonical, OG image, JSON-LD (`Product`, `Organization`, `FashionStore`, `BlogPosting`, `Event`). Sitemap, robots. Clean URLs (`/shop/ara5001` not query unless filters).

Default OG: campaign still + logo. Company name Eunik Clothings.

### 19.3 Media library

Upload image/video, replace, search, tags, alt, optimization (WebP). Used by products, collections, lookbook, journal, events, measurements, fittings. Seed by importing `public/images/*` including policies and map.

### 19.4 PWA

Install prompt, icon `public/favicon.png` / eunik.png, splash paper/gold, offline fallback page, cache static, optional push. Storefront bottom nav as in §4.1.

---

## 20. System settings

**Business:** name, logos (use existing PNG), phones, email, Ibadan address, hours, currency NGN, RC 1869194.

**Commerce:** tax (often 0), shipping bands, pickup, returns, cancellation, deposit %, preorder, free-shipping ₦100,000.

**Payments:** Paystack public/secret keys, test/live. House bank for transfers: bank name, account name, account number, narration hint. Receipt max size.

**Notifications:** email/SMS/push providers.

**SEO defaults.**

**Policies:** embed existing JPGs.

**WhatsApp:** number 2348167073585, message templates.

---

## 21. Domain models (backend-eunik)

Implement as real tables. Names can be Prisma/Eloquent; relationships must hold.

```text
User, Role, Permission, StaffProfile, CustomerProfile

Category, Collection, Product, ProductVariant, ProductImage, ProductCustomization
Fabric, FabricInventory, InventoryTransaction

MeasurementProfile, Measurement (versioned rows)

Cart, CartItem, Wishlist, WishlistItem

Order, OrderItem, OrderStatusHistory
CustomDesignRequest, Quotation, QuotationItem
ProductionOrder, ProductionTask, ProductionStatusHistory
Appointment, Fitting, Alteration, QualityCheck

Payment, PaymentTransaction, Refund, Coupon, Promotion

Shipment, Delivery, Pickup, ReturnRequest

Review, Testimonial
BlogPost, BlogCategory, Event, LookbookItem, MediaAsset
HomepageSection
SupportTicket, Notification
AttendanceEvent
AuditLog, Setting
ChannelLead          // WhatsApp click-throughs
```

### Critical chain (do not flatten)

```text
Customer
  → Measurement profiles (append-only history)
  → Custom request / MTM PDP
  → Quotation
  → Order (frozen money + measurement snapshot + fabric)
  → Production order + tasks
  → Fittings + alterations
  → Quality check
  → Balance payment
  → Delivery or Ibadan pickup
```

---

## 22. API modules

Prefix suggestion `https://api.eunikclothings.com` or Vite proxy `/api`.

```text
/auth
/users /customers /staff /roles /permissions
/products /product-variants /categories /collections /customizations
/fabrics /inventory
/measurements /measurement-profiles
/cart /wishlist
/orders /order-items /order-status
/custom-designs /quotations
/production /production-tasks /fittings /alterations /quality-control
/appointments
/payments /refunds  (+ /webhooks/paystack)
/returns /reviews /testimonials
/shipping /delivery /pickup
/coupons /promotions
/blog /events /lookbook /media /homepage
/support /notifications /leads
/analytics /attendance
/settings /audit-logs
```

Every route: authz, permission, Zod/JSON schema, errors, pagination, filter, sort.

**Server rules before create order** (FASHION_BUSINESS_REVAMP §55): product exists, variant exists, purchasable, qty, live price, fabric, customization, discount, shipping, deposit, total. Never trust client totals.

Audit logs on price, inventory, status, refund, staff, content, production (example: Admin changed Classic Senator ₦250,000 → ₦280,000 on 15 Aug 2026).

Security: hashed passwords, session/JWT, RBAC, validation, rate limit, upload scan, webhook verify, XSS/SQL hygiene, no PAN storage.

---

## 23. Frontend architecture (this repo)

### 23.1 Keep marketing package

```text
src/components/Layout.tsx Header.tsx Footer.tsx
PageHero.tsx ProductCard.tsx ProductGrid.tsx CookieBanner.tsx ScrollTop.tsx
src/pages/Home.tsx Collection.tsx Category.tsx About.tsx Contact.tsx
src/index.css @theme
public/images/*
```

Extend Header/Footer links and bag count only.

### 23.2 Add storefront pages

```text
src/pages/shop/Shop.tsx
src/pages/shop/ProductDetail.tsx
src/pages/Lookbook.tsx
src/pages/Bespoke.tsx
src/pages/MadeToMeasure.tsx
src/pages/Journal.tsx JournalPost.tsx
src/pages/Events.tsx EventDetail.tsx
src/pages/Book.tsx
src/pages/Cart.tsx Checkout.tsx Search.tsx
src/pages/policies/*
```

### 23.3 Add OS (see dashboard spec §20)

```text
src/layouts/AccountLayout.tsx StudioLayout.tsx AtelierLayout.tsx
src/pages/auth/*
src/pages/account/*
src/pages/studio/*
src/pages/atelier/*
src/components/os/*
```

### 23.4 Data access

Replace direct `catalog.ts` consumers with `src/api/products.ts` that:

1. Tries API
2. Falls back to `catalog.ts` seed if API down (browse-only, no fake checkout)

WhatsApp helper stays; enrich with session when present.

### 23.5 States

Every major view: loading skeleton, empty (copy in dashboard spec §10.5), error, success, confirm. No blank pages.

---

## 24. End-to-end workflows the agent must implement and test

### Ready-to-wear

```text
/shop → PDP → variant → bag → checkout → Paystack **or** transfer + receipt
→ order in /account and /studio → processing → pickup/delivery → review
```

### Made-to-measure

```text
/men-senator → SEN3002 → Make to measure → fabric → measurement profile
→ quote or fixed MTM price → deposit → production stages → fitting
→ alteration → QC → balance → ready SMS → Ibadan pickup
```

### Bespoke

```text
/bespoke form → studio request → quote → client accept → deposit
→ …same rail… → balance → deliver
```

### WhatsApp hybrid

```text
ProductCard Order Now → WhatsApp → ChannelLead in studio
→ staff creates quote/order against customer
```

### Re-order / Appointment / Return

As FASHION_BUSINESS_REVAMP §61, using EUNIK URLs and ₦.

---

## 25. Analytics (studio)

**Sales:** day/week/month/year; split RTW / MTM / bespoke.

**Clients:** new, returning, VIP (spend bands), retention.

**Products:** best SKUs (ARA5001, SEN3002…), popular fabrics/colours/sizes, most requested custom style.

**Production:** active, average days, delayed, completed, by tailor, by stage.

**Finance:** revenue, cost, gross profit, deposits, outstanding, refunds.

Studio overview KPIs: today’s ₦, monthly ₦, new orders, active bespoke, pending quotes, pending payments, balances, today’s appointments, fittings, ready-for-pickup, delayed, low fabric, low product stock, new clients (`EUNIK_DASHBOARD_UI.md` §14.2). **No fake ad-spend charts.**

Charts: Recharts ink/gold, ₦ tooltips.

---

## 26. Phased delivery (recommended)

Do not attempt the entire OS in one PR.

### Phase 0 — Foundations (no visual break)

- `.eunik-os` tokens in `index.css` without touching marketing `@theme`
- API scaffold in `backend-eunik` + product seed from `catalog.ts`
- Header: Shop, Account, Bag placeholders
- PDP + `/shop` using existing `ProductCard`
- Real coupon strip / ₦100,000 copy fix
- Hide fake 8549 reviews on About

### Phase 1 — Commerce

- Variants, prices, cart, checkout (Paystack demo **or** transfer + receipt + transaction number)
- Pickup Ibadan + delivery fields
- Account register/login (dashboard spec auth)
- Orders RTW tracker
- WhatsApp + ChannelLead
- Wishlist, search overlay

### Phase 2 — Atelier

- Measurement profiles
- MTM flag on PDP
- Custom request + quotations + deposits/balances
- Production Kanban, fittings, QC
- Appointments `/book`
- Staff roles, studio/atelier shells

### Phase 3 — House media

- Homepage CMS
- Journal replacing static magazine
- Lookbook, events, testimonials
- Fabric inventory, low-stock
- CRM notes, follow-up queues
- PWA, SEO, audit log, attendance
- Analytics

Each phase must still look like EUNIK on `/` the morning after deploy.

---

## 27. Implementation checklist for the next agent

1. Read `EUNIK_DASHBOARD_UI.md` before drawing any `/account` or `/studio` screen.
2. Leave Home hero, gold bar, 34px logo, ProductCard hover, Footer structure intact.
3. Seed DB from §1.4; do not drop SKUs; watch `.JPG` cases.
4. Prices default null → UI “Order on WhatsApp / Quote” until set.
5. Dual CTA: bag **and** WhatsApp.
6. Freeze measurements on the order.
7. Pay only via verified webhooks.
8. RBAC on API.
9. CMS homepage rather than new hardcoded sections after Phase 3.
10. Empty states in EUNIK voice (“The rail is clear.”).
11. Money `en-NG`, kobo integers.
12. Never copy Remsana “Chief of Staff”, DM Sans, or indigo.
13. `sen3020.jpg` stays unpublished until merchandised.
14. Policies remain reachable.
15. Connect `backend-eunik` as the sibling API; do not invent a second catalog in the frontend after seed migration.

---

## 28. One-line north star

**Keep the campaign gold, the Outfit hero, the Ara'nbada grid and the WhatsApp handshake — then put naira, measurements, quotations, a cutting rail and a client book behind the same door so EUNIK Clothings runs as one Ibadan fashion house, not a brochure with a chat button.**
