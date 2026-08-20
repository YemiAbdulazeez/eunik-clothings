# EUNIK Auth, Client Portal & Fashion House OS — UI / UX / Design Language Spec

> **Purpose:** Reconstruction kit for every **non-marketing** surface in the EUNIK Clothings web app. An agent should be able to build auth, the customer portal, the Fashion House management system, and the staff operations portal **without copying Remsana’s royal-indigo SaaS look onto the public storefront**.
>
> **Source documents**
> - Original UI language: `docs/DASHBOARD_UI.md` (Remsana). We adopt **structure, density, IA, motion rules, and component patterns** from that spec.
> - Original business platform: `docs/FASHION_BUSINESS_REVAMP.md`. Domain screens live in `docs/EUNIK_FASHION_HOUSE_PLATFORM.md`.
> - Live storefront: `src/index.css`, `src/components/Header.tsx`, `src/pages/*`.
>
> **Surfaces covered**
> - Auth: `/account/login`, `/account/register`, `/account/forgot-password`, `/studio/login`
> - Customer fashion portal: `/account/*`
> - Fashion House OS (management): `/studio/*`
> - Staff operations: `/atelier/*`
>
> **Not restyled here:** public marketing/storefront pages (`/`, `/collection`, `/aranbada`, `/men-senator`, `/agbada`, `/esiki`, `/suit`, `/about`, `/contact`, lookbook, blog, events, bespoke landing). Those keep the **current EUNIK editorial language** defined in §2.
>
> **North star:** a charcoal command rail, a paper-white executive canvas, gold used like a house seal, Outfit + Figtree throughout, and dashboards that greet the user, show what needs attention, then the numbers — never the other way around.

---

## 0. Dual-surface rule (non-negotiable)

EUNIK is one brand with **two visual densities**, not two brands.

| Surface | Personality | Type | Primary color | Gold use | Motion |
|---------|-------------|------|---------------|----------|--------|
| **Public fashion house** | Editorial, image-led, designer boutique | Outfit display + Figtree 17/32 body | Ink `#232323` on white | Gold underline highlights, promo bars, badges | Fade-up, marquee, image zoom, hover CTAs |
| **Product OS** (auth + portals) | Calm atelier operations, private clientele | Same families, denser scale | Ink rail on paper canvas | Gold avatars, MFA, KPI sparkles, studio mark | Almost none; loaders spin; hover color only |

**Do**

- Keep marketing tokens, fonts, header-with-topbar, centered logo, gold highlight underline, and product-card hover language on every public page.
- Reuse Remsana **patterns**: split auth, dark sidebar + light canvas, pill primary CTAs, uppercase micro-labels, greeting-first dashboards, sticky glass top bar, mobile 4+More nav, Recharts, skeletons, Sonner toasts.
- Recolor every Remsana token that is royal indigo (`#1a237e`, `#3949ab`, `#5c6bc0`) into **EUNIK ink / gold / paper**.

**Don’t**

- Put DM Sans on the public site (or anywhere, unless a future design system explicitly replaces Figtree — it does not in this spec).
- Paint body copy royal blue. EUNIK text is charcoal ink, not bank-indigo.
- Saturate dashboards with gold `#eeb167`. Gold is a **seal**, not a fill.
- Animate KPI cards bouncing in on every `/studio` paint.
- Use a white sidebar. The signature rails are **ink / nero**, matching the existing dark footer.
- Restyle the marketing header into a SaaS app bar.

---

## 1. Current webapp — what already exists

Inventory of the converted Vite app **before** this upgrade. All of this must remain visually continuous on public routes.

### 1.1 Stack

- React 19 + TypeScript + Vite 7 + Tailwind v4 (`@tailwindcss/vite`)
- React Router 7 (`BrowserRouter`)
- lucide-react icons (keep this library; do not mix Heroicons / Font Awesome)
- Static catalog in `src/data/catalog.ts`
- WhatsApp deep-link ordering in `src/lib/whatsapp.ts` (`2348167073585`)

### 1.2 Public routes (`src/App.tsx`)

| Route | Page | Notes |
|-------|------|--------|
| `/` | `Home` | Hero slider, perks, 4 collection tiles, best sellers, promo code strip, new-arrival rail, marquee, magazine |
| `/collection` | `Collection` | Five collection cards + item counts |
| `/aranbada`, `/men-senator`, `/agbada`, `/esiki`, `/suit` | `Category` | Product grid + “Other Collections” sidebar |
| `/about`, `/about-us` → `/about` | `About` | Core values E-U-N-I-K, story, mission/vision |
| `/contact`, `/contact-us` → `/contact` | `Contact` | Ibadan HQ, mailto form, map |

There is **no auth, cart, product detail, search, account, or admin**. Product cards jump straight to WhatsApp.

### 1.3 Marketing tokens (locked)

From `src/index.css` `@theme` — copy these hex values exactly on storefront:

| Token | Hex | Role |
|-------|-----|------|
| `--color-gold` | `#eeb167` | Promo bar, highlight underline, badges, seals |
| `--color-ink` | `#232323` | Headings, buttons, logo-adjacent type |
| `--color-muted` | `#828282` | Body copy |
| `--color-paper` | `#f7f7f7` | Soft sections, page heroes |
| `--color-nero` | `#1b1b1b` | Footer copyright band |
| `--color-line` | `#e4e4e4` | Hairlines |

Fonts:

- **Display (`font-alt`):** Outfit 300–900
- **Body (`font-primary`):** Figtree 300–800
- Marketing body: `17px / 32px`, color muted, background `#fff`
- Logo in header/footer: `/images/eunik.png`, max-height **34px**

Existing utilities to preserve on marketing:

- `.highlight` gold 8px underline wash
- `.animate-marquee` 28s
- `.animate-fade-up` 0.6s / 18px
- `.animate-spin-slow` logo seal on About
- `.product-card` overlay + “Order Now” pill on hover
- `.collection-card` image scale `1.06`

### 1.4 Marketing chrome to keep

**Header (`Header.tsx`)**

1. Gold top bar `h-10`, 13px uppercase: *Enjoy FREE standard delivery on orders over #100,000.* + Shop now
2. White nav, centered 34px logo, Outfit links at 19px
3. Left: Find stores / Home / Featured / Collection
4. Right: Magazine / About / Contact / Instagram 100k Followers
5. Mobile hamburger (Menu/X), **not** the dashboard bottom nav

**Footer**

- Ink background, white logo plate, category + information + contact + newsletter
- Policies: `/images/order-policy.jpg`, `/images/job-taking-policy.jpg`
- Phone `08167073585`, email `info@eunikclothings.com`
- Copyright → Abdul-Azeez Adeleye

**Storefront components**

- `PageHero` — paper gradient, Outfit 5xl–7xl title, Home / crumb
- `ProductCard` — 3:4 image, SKU pill, WhatsApp CTA (later: cart + WhatsApp)
- Cookie banner, scroll-top “Scroll” rail on xxl

When adding Shop / Lookbook / Account / Cart to public nav, **extend this header** — do not replace it with the studio top bar.

---

## 2. Brand personality (product OS)

EUNIK’s in-app UI is **atelier / private client / fashion-house operations** — not playful SaaS, not crypto-neon, not Remsana’s bank-indigo, not a dense apparel ERP.

| Axis | Value for EUNIK |
|------|-----------------|
| Industry metaphor | Nigerian fashion house atelier + private client book + cutting-room command |
| Temperature | Warm gold on charcoal; paper canvas; no royal blue |
| Density | Comfortable executive; production boards denser than the storefront |
| Geometry | Soft rectangles + **pills** (CTAs, chips, search, avatars) |
| Voice | Calm, precise, uppercase micro-labels; Nigerian fashion-house English (outfit, fitting, agbada, senator, deposit) |
| Motion | Storefront may fade/lift; dashboards static; loaders spin |
| Trust signals | Gold house mark, RC 1869194, measurement confidentiality, **Paystack** + bank-transfer receipt on checkout only |

**Do**

- Use **ink `#232323`** as the authority color (sidebar, primary buttons, dashboard headings).
- Use **gold `#eeb167`** sparingly as prestige (client avatars, MFA, KPI sparkles, studio wordmark accent).
- Use generous whitespace, 2xl rounded cards, muted uppercase labels.

**Don’t**

- Fill pages with gold.
- Use sharp 4px corners on primary CTAs (those are **full pills**).
- Use Inter/Roboto/DM Sans as the UI face.
- Bounce cards on dashboard mount.

---

## 3. Typeface

### 3.1 Families (one brand, two optical sizes)

EUNIK does **not** switch to DM Sans. Continuity with the storefront is the point.

| Role | Family | Where |
|------|--------|--------|
| Display / greetings / page titles | Outfit | All surfaces |
| Body / tables / forms | Figtree | All surfaces |

```
--font-alt: "Outfit", ui-sans-serif, system-ui, sans-serif
--font-primary: "Figtree", ui-sans-serif, system-ui, sans-serif
font-feature-settings: "ss01", "cv11"   /* Figtree body in product OS */
-webkit-font-smoothing: antialiased
text-rendering: optimizeLegibility
```

Load both from Google Fonts in `index.html` (already present). Add `opsz` variable axes later if switching to variable cuts; weights already cover 300–900.

Display is distinguished by **weight + tracking**, not a second display face.

### 3.2 Marketing scale (do not change)

Keep public pages at Figtree 17/32 and Outfit campaign sizes (`text-6xl`–`text-[120px]` on the home hero).

### 3.3 Product OS scale (adopt Remsana rhythm, EUNIK faces)

| Role | Size | Weight | Tracking | Color |
|------|------|--------|----------|--------|
| Auth H1 (hero column) | `text-4xl` Outfit | 600 | `tracking-tight` | white on ink/gold wash |
| Dashboard greeting | `text-2xl sm:text-3xl` Outfit | 600 | tight | ink (`foreground`) |
| Page title (studio PageHeader) | `text-2xl font-semibold tracking-tight` Outfit | 600 | tight | foreground |
| Section title | `text-sm font-semibold` Figtree | 600 | normal | foreground |
| Card KPI value | `text-2xl` (hero scores `text-5xl`) Outfit | 600 | tight | foreground |
| Body / support | `text-sm` Figtree (≈14–15px) | 400 | normal | `muted-foreground` |
| Field label | `text-xs font-medium uppercase tracking-wider` Figtree | 500 | wider | muted-foreground |
| Eyebrow | `text-[10px]`–`text-xs` uppercase `tracking-widest` | 500–600 | widest | muted or gold |
| Chips | `text-[10px]`–`text-[11px]` uppercase | 500–600 | wider | see chips |
| Table header | `text-xs uppercase tracking-widest` | 500 | widest | muted-foreground |
| Keyboard hint | `text-[10px]` in `<kbd>` | 500 | — | muted-foreground |
| OTP digits | `text-lg` or `text-2xl font-semibold` + `tracking-[0.5em]` | 600 | spaced | foreground |

Headings `h1–h4` in product OS: `letter-spacing: -0.025em; font-weight: 600; font-family: Outfit`.

---

## 4. Color system

Two CSS scopes. Marketing continues to use Tailwind `@theme` colors `gold`, `ink`, `muted`, `paper`, `nero`, `line`. Product OS adds semantic tokens that **map onto those hexes**, plus a few operational colors (success, destructive) that the storefront currently lacks.

### 4.1 Token mapping from Remsana → EUNIK

| Remsana token | Remsana hex | EUNIK product OS | Why |
|---------------|-------------|------------------|-----|
| `--foreground` / `--primary` | `#1a237e` royal | `#232323` ink | Brand authority is charcoal, not indigo |
| `--gold` | `#c9a84c` | `#eeb167` | Existing house gold |
| `--gold-foreground` | `#1a237e` | `#232323` | Text on gold promo/badge |
| `--background` | `#f8fafc` | `#f7f7f7` paper (or `#f8fafc` if a cooler canvas is needed — prefer **paper** for brand match) | |
| `--muted-foreground` | `#4a5578` | `#828282` | Same as marketing body |
| `--border` | `#e4e7ef` | `#e4e4e4` line | |
| `--sidebar` | `#1a237e` | `#232323` ink | Matches footer authority |
| `--sidebar-accent` | `#283593` | `#1b1b1b` nero | Hover wash |
| Chart-1 | royal | `#232323` | |
| Chart-5 / highlight | Remsana gold | `#eeb167` | |

### 4.2 Light mode (`.eunik-os` or `:root` when inside `/account`, `/studio`, `/atelier`)

Apply a wrapper class on product shells so marketing pages are not polluted.

```css
.eunik-os {
  --radius: 0.75rem;
  --background: #f7f7f7;
  --foreground: #232323;
  --card: #ffffff;
  --card-foreground: #232323;
  --primary: #232323;
  --primary-foreground: #ffffff;
  --primary-glow: #4a4a4a;
  --secondary: #f7f7f7;
  --muted: #f7f7f7;
  --muted-foreground: #828282;
  --accent: #f4e4c8;          /* warm gold wash, not indigo accent */
  --accent-foreground: #232323;
  --gold: #eeb167;
  --gold-foreground: #232323;
  --destructive: #d32f2f;
  --success: #2e7d32;
  --warning: #eeb167;         /* house gold doubles as caution on light */
  --border: #e4e4e4;
  --input: #e4e4e4;
  --ring: #232323;
  --sky: #4a4a4a;
  --emerald: #2e7d32;
}
```

**Chart series (light)**

- `--chart-1` `#232323`
- `--chart-2` `#4a4a4a`
- `--chart-3` `#828282`
- `--chart-4` `#c4a574`
- `--chart-5` `#eeb167` (gold highlight series)

**Sidebar (light) — inverted: dark ink rail on paper page**

- `--sidebar` `#232323`
- `--sidebar-foreground` `#ffffff`
- `--sidebar-primary` `#eeb167`
- `--sidebar-primary-foreground` `#232323`
- `--sidebar-accent` `#1b1b1b`
- `--sidebar-accent-foreground` `#ffffff`
- `--sidebar-border` `#1b1b1b`
- `--sidebar-ring` `#eeb167`

### 4.3 Dark mode (`.eunik-os.dark` on `<html>` or shell)

Dark mode is a **nero inversion**, not generic gray and not Remsana navy.

| Token | Hex |
|-------|-----|
| background | `#1b1b1b` (nero) |
| foreground | `#ffffff` |
| card / popover | `#232323` |
| primary | `#eeb167` (gold buttons pop on charcoal) |
| primary-foreground | `#232323` |
| primary-glow | `#f4c98a` |
| secondary / muted | `#2a2a2a` |
| muted-foreground | `#b0b0b0` |
| accent | `#3a3a3a` |
| border | `rgba(255,255,255,0.1)` |
| input | `rgba(255,255,255,0.12)` |
| sidebar | `#111111` |
| sidebar-accent | `#232323` |
| gold-foreground | `#1b1b1b` |

Cards in dark mode are **ink panels on a deeper nero canvas**.

Default theme: **light** (matches the storefront). Persist `eunik-theme` = `light | dark | system`. Inline FOUC script in `index.html` only toggles `.dark` when the path is a product shell, or toggles globally if the user prefers — but **public marketing pages stay light** even if studio is dark. Recommendation: theme is scoped to `.eunik-os` so `/` never inverts.

### 4.4 Gradients (product OS)

Remsana’s `--gradient-royal` becomes **ink wash**, not indigo.

```
--gradient-house: linear-gradient(135deg, #232323, #1b1b1b)
--gradient-brand: linear-gradient(135deg, #232323 0%, #3a3a3a 45%, #1b1b1b 100%)
--gradient-gold:  linear-gradient(135deg, #eeb167, #f4c98a)
--gradient-aurora:
  radial-gradient(60% 60% at 10% 0%, rgba(238,177,103,0.16), transparent 60%),
  radial-gradient(50% 50% at 90% 10%, rgba(35,35,35,0.08), transparent 60%),
  radial-gradient(60% 60% at 50% 100%, rgba(27,27,27,0.10), transparent 60%)
```

Utilities: `bg-house-gradient`, `bg-brand-gradient`, `bg-gold-gradient`, `bg-aurora`, `text-gradient` (ink→gold clip, use rarely).

Auth staff login (`/studio/login`) uses **ink gradient only** (restricted atelier). Client login uses a **full-bleed campaign photo** from existing assets (`/images/ara-bg.jpg`, `/images/agbada-bg.jpg`, `/images/senator-bg.jpg`) + ink veil.

### 4.5 Shadows (gold-ink tint, never generic black at 25%)

```
--shadow-elegant: 0 30px 60px -30px rgba(35,35,35,0.25), 0 12px 30px -18px rgba(35,35,35,0.18)
--shadow-soft:    0 8px 30px -12px rgba(35,35,35,0.10)
--shadow-glow:    0 0 60px -12px rgba(238,177,103,0.35)
```

- Default cards: `shadow-soft` or border only.
- Hover lift: **marketing only**.
- Checkout CTAs on marketing-adjacent shop: `shadow-elegant` allowed.
- Studio KPIs: border + soft shadow, no lift.

### 4.6 Selection

`color-mix(in oklab, var(--gold) 35%, transparent)` on product OS; marketing may keep browser default.

---

## 5. Radius, spacing, grid

Adopt Remsana’s radius **math** so pills and cards feel operational, while marketing collection cards may stay slightly more rectangular.

### 5.1 Radius

`--radius: 0.75rem` (12px) inside `.eunik-os`.

| Token | Typical use |
|-------|-------------|
| `rounded-md` | Status chips, small admin tools |
| `rounded-lg` | Icon wells, table inners, StatCard (12px) |
| `rounded-xl` | Inputs, nested KPIs (16px) |
| `rounded-2xl` | Hero cards, need-action, user menu, dashboard cards (20px) |
| `rounded-3xl` | Mobile “More” sheet, appointment form shells (24px) |
| `rounded-full` | **All primary CTAs, chips, search, avatars, theme toggle, badges** |

Rule of thumb:

- **Interactive primary action = pill.**
- **Content card = 16–20px.**
- **Input = 12–16px (`rounded-xl`).**
- Storefront `ProductCard` images stay **square-cornered / slight clip** as today; the “Order Now” button is already a pill — keep it.

### 5.2 Spacing rhythm (product OS)

| Context | Values |
|---------|--------|
| Page main padding | `px-4 py-6` → `sm:px-6 sm:py-8` → `lg:px-10 lg:py-10` |
| Content max width | `max-w-7xl mx-auto` |
| Vertical stack | `space-y-8 sm:space-y-10` |
| Card padding | `/account` and `/studio` overview: `p-6 sm:p-8`; StatCard: `p-5` |
| Form field gap | `space-y-4`; label → input `mt-1.5` |
| Grid gaps | `gap-4` studio tools; `gap-6` client portal |
| Header height | sticky `h-14` |

Public storefront keeps its own padding (`px-6 lg:px-10`, home hero full-bleed).

### 5.3 Layout grids

- KPI row: `grid gap-4 md:grid-cols-2 xl:grid-cols-4`
- Two-up recents: `grid gap-6 lg:grid-cols-2`
- Chart + aside: `grid gap-6 lg:grid-cols-3` with chart `lg:col-span-2`
- Auth: `grid min-h-screen lg:grid-cols-2`
- Register: `lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]` (form slightly wider)
- Client measurement form: `grid gap-4 sm:grid-cols-2 lg:grid-cols-3`
- Production board: Kanban `grid-flow-col auto-cols-[minmax(260px,1fr)]` overflow-x

---

## 6. Iconography

- Library: **lucide-react only** (already in the app).
- Default nav / buttons: `h-4 w-4`.
- Header utilities: `h-3.5 w-3.5` or `h-4 w-4`.
- StatCard wells: `h-5 w-5` in `h-10 w-10 rounded-lg` gold/ink tint.
- Prestige: `text-gold` on Shield, Sparkles, Check.
- Do not reintroduce Feather / Bootstrap Icons from the old HTML theme.

**EUNIK recurring icons** (map Remsana meanings onto fashion-house roles)

| Meaning | Icon |
|---------|------|
| Submit / continue | `ArrowRight` after label |
| Email | `Mail` |
| Password | `Lock` |
| MFA | `KeyRound` + gold |
| Trust / QC | `ShieldCheck` |
| Notify | `Bell` |
| Theme | `Sun` / `Monitor` / `Moon` |
| Search | `Search` |
| Client home | `Home` |
| Studio dashboard | `LayoutDashboard` |
| Shop / garments | `Shirt` |
| Fabric | `Layers` |
| Measurements | `Ruler` |
| Appointments | `Calendar` |
| Fittings | `Scissors` |
| Production | `Workflow` |
| Payments | `Wallet` / `Receipt` |
| People / CRM | `Users2` |
| Lookbook | `Camera` |
| Events | `Sparkles` |
| WhatsApp sales | `MessageCircle` (do not drop WhatsApp; it remains a channel) |
| Cart | `ShoppingBag` (already used on ProductCard) |
| Wishlist | `Heart` |

---

## 7. Motion & animation

**Public storefront** keeps current motion: `animate-fade-up`, `animate-marquee`, collection zoom, product CTA slide-up.

**Product OS is static.** Borrow Remsana’s dashboard stillness.

| Utility | Spec | Use |
|---------|------|-----|
| `hover-lift` | 300ms, `translateY(-4px)` + elegant shadow | Public collection/lookbook cards only |
| `animate-fade-up` | existing 0.6s | Home, About, Category marketing |
| `animate-marquee` | existing 28s | Home ticker |
| `animate-spin` | Loader2 | Auth + studio submit |
| Theme toggle | `transition-colors` | Header product OS |
| Buttons | `hover:bg-primary/90` | All product CTAs |
| Mobile more sheet | `slide-in-from-bottom duration-200` | Client / staff bottom nav |
| HTML | `scroll-behavior: smooth` | Already global |

Auth: **no** entrance animation on the form column. Loading: “Signing in…” / “Saving measurements…” + `disabled:opacity-70`.

Toasts: Sonner, `richColors`, `position="top-center"`, gold/ink colors not indigo.

---

## 8. Glass, texture, decorative utilities

```
.glass       = 68% background mix + 60% border mix + saturate(180%) blur(20px)
.glass-dark  = 55% #232323 + blur(18px) + 12% white border
.grid-fade   = 48px ink grid at 6% opacity, radial mask from top
```

- Public header: optional `.glass` when `scrollY > 8` **only if** we later pin the white nav; current header is solid white — do not force glass.
- Studio top bar: `bg-background/85 backdrop-blur` (Remsana pattern, EUNIK paper).
- Auth heroes: **photo + ink/gold overlay**, not glass-on-form.

Keep the existing gold **highlight underline** on marketing H2s. Do not use that underline on dashboard section titles (those use uppercase eyebrows).

---

## 9. Controls

### 9.1 Primary product button

```
inline-flex items-center justify-center gap-2
rounded-full
bg-primary (ink) text-primary-foreground (white)
auth: w-full py-3 text-sm font-medium
inline: px-5 py-2.5
hover:bg-primary/90
disabled:opacity-70
trailing ArrowRight h-4 w-4
```

Gold variant (deposit paid, prestige CTA): `bg-gold text-gold-foreground`.

Public “Shop Collection” remains **rectangular ink button** (`px-8 py-4 text-lg`) as on Home — marketing CTAs are not forced into studio pills except where we add new shop chrome (Add to cart on PDP can be pill to match cart OS).

`LoadingButton` variants: `primary | gold | outline | ghost | danger | subtle`. Sizes sm/md/lg as in source spec.

### 9.2 Text inputs

```
w-full rounded-xl
border border-input bg-card
px-3 py-2.5 text-sm
outline-none ring-primary/20 focus:ring-2
```

Icon fields: icon `absolute left-3`, input `pl-9`.  
Labels **always above**, uppercase tracking. Never floating labels on product OS.

Public contact form may keep the current underline-only Figtree fields for visual continuity on `/contact`. New account/address forms use `rounded-xl` inputs.

### 9.3 OTP

Six boxes or one `tracking-[0.5em]` field. Register: tall boxes `h-14 text-2xl`. Studio MFA (if any): single field, placeholder `123 456`.

### 9.4 Errors / info

```
rounded-xl border border-destructive/40 bg-destructive/10
px-3 py-2 text-xs text-destructive
```

Measurement incomplete:

```
rounded-2xl border border-gold/40 bg-gold/10 text-sm text-ink
```

### 9.5 Chips & badges

| Kind | Classes |
|------|---------|
| Role chip | `rounded-full border border-gold/40 bg-gold/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-ink` |
| SKU pill (storefront, already exists) | white rounded-full 11px uppercase on image |
| Order type | `rounded-md px-2 py-0.5 text-[11px] uppercase` — RTW ink, MTM gold wash, Bespoke gold solid, Alteration muted |
| Production stage | emerald / amber / gold / destructive / muted StatusChip |
| Unread | `bg-destructive` on client bell; `bg-gold text-ink` on studio bell |
| Promo code `EUNIK-DEC-2024` | keep existing gold pill on ink strip |

### 9.6 Theme toggle

Pill cluster, three 28px radios, active `bg-primary text-primary-foreground`. Studio + client portal only.

### 9.7 Links

Product OS: `text-primary hover:underline`.  
Marketing: existing ink hover, gold promo links.

---

## 10. Cards, tables, empty / loading

### 10.1 Client portal & studio overview cards

```
rounded-2xl border border-border bg-card p-6 sm:p-8
```

Inner KPI: `rounded-xl border bg-background px-4 py-3`.

Need-action rows:

```
flex items-start gap-3 rounded-xl border p-3.5
high:   border-destructive/35 bg-destructive/5    /* unpaid balance, delayed sewing */
medium: border-gold/40 bg-gold/10                 /* fitting tomorrow */
low:    border-border bg-background                 /* new collection suggestion */
hover:border-primary/40
```

### 10.2 Studio StatCard

`rounded-xl border bg-card p-5 shadow-soft hover:shadow-elegant` (no translate). Label uppercase. Value Outfit `text-2xl`. Icon well 40×40: `bg-gold/20` for revenue, `bg-primary/10` for orders, success/destructive tints for overdue.

PageHeader: title + subtitle, `border-b pb-6`, actions right as small pills.

### 10.3 Tables

Wrapper `overflow-x-auto`. Header uppercase tracking-widest. Rows `py-3`, amount formatted `en-NG` ₦. Min widths 640–760px for production/payment tables.

Public product grids **stay CSS grid of images**, not tables.

### 10.4 Loading

`PageSkeleton`: fake greeting bar + 4 rounded-2xl KPI bones + one large card of `h-10` bars. `aria-busy`.

### 10.5 Empty copy (EUNIK voice)

```
No Orders          "You haven't commissioned or purchased an outfit yet."
No Wishlist        "Save Ara'nbada, Senator, Agbada and Esiki looks here."
No Appointments    "Book a consultation at the Ibadan atelier."
No Production Tasks "No garments are on your bench."
No Measurements    "Add a profile so we can cut without another studio visit."
```

---

## 11. Charts

Library: **Recharts** + `ResponsiveContainer`.

- Stroke width **2**, `type="monotone"`.
- Fill: vertical gradient 0.45 → 0.05 opacity.
- Grid: dashed `stroke="var(--border)"`, often `vertical={false}`.
- Ticks 10–11px `fill: var(--muted-foreground)`.
- Tooltip: card background, 8–12px radius, **NGN** via `en-NG`.
- Heights 220–320px.

Cash flow pair (oklch remapped to ink/gold):

- Inflow: `#232323`
- Outflow: `#eeb167`

Donut: `innerRadius` 45–55, `outerRadius` 80–90, `paddingAngle={2}`, stroke paper. Legend = custom HTML dots.

Donut series for EUNIK revenue mix: Ara'nbada / Senator / Agbada / Esiki / Suits / Bespoke — gold only on Bespoke slice.

Progress / pipeline: track `h-1.5 rounded-full bg-muted`, fill `bg-primary` or `bg-gold` for deposit %.

---

## 12. Shells

### 12.1 Public storefront shell (keep)

Existing `Layout.tsx`: marketing Header + `<Outlet />` + Footer + Cookie + ScrollTop. New public pages (Shop, PDP, Lookbook, Blog, Events, Bespoke, Made-to-Measure, Book) **must use this shell**.

Add to marketing header (right cluster, Outfit 19px):

```
Home | Shop | Collections | Lookbook | Bespoke | About | Contact | Account | Bag
```

Mobile marketing: hamburger list, then a **storefront** bottom bar (not studio):

```
Home · Shop · Search · Wishlist · Bag
```

Account + Studio never use this bottom bar.

### 12.2 Product OS shell (new)

Remsana SidebarProvider pattern, EUNIK tokens.

```
SidebarProvider
  flex min-h-screen w-full bg-background   /* paper */
    skip-link
    Sidebar                                /* ink, 16rem / 3rem collapsed */
    flex flex-col flex-1 min-w-0
      sticky header h-14 glass
      main max-w-7xl space-y-8|10
      MobileBottomNav                      /* lg:hidden */
```

Cookie persist `eunik_sidebar_state`, 7 days. Keyboard `b` toggles. Skip link pill ink.

**Expanded width** 16rem, **icon** 3rem, **mobile sheet** 18rem.

### 12.3 Three in-app rails

#### A. Client portal (`/account`) — “Private client book”

- Logo: `eunik.png` inverted white on ink (`brightness-0 invert`)
- Wordmark: “EUNIK” + `text-[10px] uppercase tracking-widest` “Client atelier”
- Avatar: **gold circle** `bg-gold text-ink` initials
- Group: “Your wardrobe”
- Items: Overview, Orders, Custom designs, Measurements, Appointments, Fittings, Payments, Wishlist, Support
- Locked items: 60% + Lock (e.g. fittings until first MTM order)

Search placeholder: “Search orders, quotations, fittings…”

Primary header CTA: gold/ink pill “Request a design” + `Sparkles`

#### B. Fashion House OS (`/studio`) — owners, managers, content, finance

- Mark: `h-9 w-9 rounded-md bg-gold-gradient` + `Sparkles` **or** inverted PNG — pick **gold mark + Sparkles** to distinguish from client rail
- Subtitle: “Fashion House OS”
- Groups:
  - Overview
  - Commerce (orders, products, inventory, fabrics, customers)
  - Custom tailoring (requests, quotes, measurements, production, QC)
  - Payments
  - Content (homepage, magazine, lookbook, events)
  - People
  - Analytics
  - System
- Filter by `staffRole` + `studioSections[]`
- Footer: initials on `sidebar-accent`, logout

Search placeholder: “Search SKUs, clients, orders…”

#### C. Staff operations (`/atelier`) — tailor, cutter, QC, front desk

- Same ink rail
- Wordmark: “Atelier floor”
- Items stripped to: My bench, Queue, Measurements, Fittings, Appointments, Notes, Attendance
- Gold used even more sparingly

Search placeholder: “Find a garment or client…”

### 12.4 Top app bar (client / studio / atelier)

```
sticky top-0 z-30 h-14
border-b border-border
bg-background/85 backdrop-blur
px-4 flex items-center gap-3
```

Left: SidebarTrigger.  
Center md+: pill search `rounded-full border bg-muted/40 px-4 py-1.5` + `<kbd>⌘K</kbd>`.  
Right: theme toggle → role chip → WhatsApp pulse (front desk) → bell → UserMenu.

Bell `rounded-full p-2`. Client unread = destructive; studio unread = gold.

### 12.5 User menu

```
w-64 rounded-2xl border bg-popover p-1 shadow-lg
```

Client avatar gold; studio `bg-primary/10`. Sign out `text-destructive`.

### 12.6 Mobile bottom nav

- `lg:hidden` fixed inset-x-0 bottom-0, `h-20` spacer
- 4 primary + More
- Client: Home, Orders, Measurements, Bag-or-Appointments, More
- Studio: Home, Orders, Production, Clients, More
- Atelier: Bench, Queue, Fittings, Appointments, More
- Active `text-gold` or `text-primary` — use **ink primary** for active icon, gold only for “needs payment”
- More sheet `rounded-t-3xl`, grabber, 3-col icon grid

---

## 13. Auth screens

All auth = **split pane**: campaign hero (lg+) | form on paper. No card on gray.

### 13.1 Heroes (lg+)

**Client login / register / forgot**

1. Full-bleed photo rotating among `ara-bg.jpg`, `senator-bg.jpg`, `agbada-bg.jpg`
2. Veil `bg-gradient-to-tr from-ink/90 via-ink/70 to-gold/30`
3. Column `p-12 text-white`
4. Compact logo (white plate or invert)
5. H1 Outfit `text-4xl`: e.g. “Made for the man who is remembered.”
6. Trust chip: gold Shield + “Measurements stored privately · Ibadan atelier”
7. Footer © Eunik Clothings

**Studio / atelier login**

- **No photo.** `bg-house-gradient` only (restricted cutting room)
- Eyebrow pill: Lock + “Staff access”
- Copy: “Fashion House OS”
- Extra muted panel: “Need WhatsApp floor access? Ask the manager.” — no demo passwords

### 13.2 Form column

```
flex items-center justify-center p-6 sm:p-8
inner max-w-lg (client) max-w-md (staff)
```

Mobile: compact logo + “← Back to house” (`/`).  
H2 `text-2xl Outfit`. Subtitle `text-sm text-muted-foreground`.  
Form `mt-8 space-y-4`. Remember + forgot on one `text-xs` row.

Cross-links:

- Client login → Create account, Staff sign in (small, not prominent)
- Staff → Client sign in
- Register stepper 7px circles: done ink, **active gold**, idle muted

### 13.3 Validation

- Email regex; client password ≥ 8; staff ≥ 8
- Disable submit while busy; keep values
- First-login `mustChangePassword`: in-dashboard banner, not a dead-end page

WhatsApp remains available as “Prefer to order on WhatsApp” text link under client login — it must not replace accounts once e-commerce is live.

---

## 14. Dashboard composition

Tone (from Remsana, EUNIK nouns): **greeting-first, exceptions-second, numbers-third, narratives-last.**

### 14.1 Client overview (`/account`)

1. Eyebrow “Your atelier” + role chip `Client`
2. Greeting `Good morning, {firstName}.`
3. Tagline: “We’ll cut when the cloth and the measurements agree.”
4. Primary pill “Request a custom design”
5. Need action: unpaid balance, fitting tomorrow, quotation waiting, measurement incomplete
6. Active garments (simplified production tracker)
7. Upcoming appointments (Ibadan)
8. KPI quadruple: open orders, wishlist, wallet/balance, next fitting
9. Recommended looks from current catalog (Ara'nbada / Senator)
10. Magazine / lookbook strip (reuse public magazine data)

### 14.2 Studio overview (`/studio`)

1. Suite chip “Fashion House OS” + staff role + optional “Demo” amber
2. Greeting. CTA “Review custom requests”
3. Need attention: unpaid deposits, **bank receipts awaiting review**, delayed sewing, low fabric, today’s fittings, WhatsApp orders unclaimed
4. Four stats: today’s ₦ revenue, monthly ₦, active bespoke, outstanding balances
5. Quick tiles 4×2: Orders, Production, Quotes, Appointments, Fabrics, Clients, Content, Payments
6. Revenue mix donut (collections) + production pipeline bars
7. Recent RTW vs bespoke table + notifications
8. QC queue + audit preview
9. Charts: daily sales, tailor throughput — **live API only**, no fake Ad Spend

### 14.3 Atelier overview (`/atelier`)

1. “On your bench” greeting
2. Need action: overdue cutting, fitting in 2 hours
3. Queue tables (see platform spec)
4. Clock in/out if attendance enabled
5. No revenue numbers unless role includes `analytics.view`

### 14.4 Inner pages

Always: PageHeader → optional StatCards → SectionCards. Segmented controls = `rounded-full border p-1` with active `bg-primary text-white`.

---

## 15. Modals, sheets, overlays

| Pattern | Treatment |
|---------|-----------|
| User menu | anchored, 16px radius |
| Notifications | `w-80 rounded-xl p-2 shadow-lg` |
| Size guide / measurement capture | Dialog `rounded-2xl`, Outfit title |
| Fabric swatch picker | Sheet from right, large photos |
| Confirmations | inline banner + toast preferred |
| PWA install | bottom banner, not modal |
| WhatsApp handoff | small popover: “We’ll copy this order to your bag, or open WhatsApp” |

Focus: `ring-2 ring-ink/20` plus gold ring on prestige fields (deposit).

---

## 16. Theme behavior

- Storage key: `eunik-theme`
- Wrapper class `.eunik-os` on product layouts
- `theme-color` meta ≈ `#232323`
- Default light (storefront match)
- Dark = nero, cards remain ink — **not** gray Material dark

---

## 17. Accessibility & microcopy

- Skip to content on all three OS shells
- Icon-only controls `aria-label`
- Theme toggle `radiogroup`
- Skeletons `aria-busy`
- Errors as text, not color-only
- Voice: short, Nigerian fashion-house, no slang, no “sovereign OS” Remsana copy
- Money: `en-NG`, ₦, `shortNaira` (₦12.4M)
- Dates: `toLocaleString("en-NG", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })`
- Measurements: cm default, inches toggle; never lose historical rows

Microcopy examples:

- Login subtitle: “Enter the house.”
- Empty production: “The rail is clear.”
- Deposit CTA: “Pay ₦{deposit} to cut.”
- Ready for pickup: “Your outfit is pressed and waiting in Ibadan.”

---

## 18. Copy-paste token CSS (product OS starter)

```css
.eunik-os {
  --radius: 0.75rem;
  --background: #f7f7f7;
  --foreground: #232323;
  --card: #ffffff;
  --primary: #232323;
  --primary-foreground: #ffffff;
  --primary-glow: #4a4a4a;
  --muted: #f7f7f7;
  --muted-foreground: #828282;
  --accent: #f4e4c8;
  --gold: #eeb167;
  --gold-foreground: #232323;
  --destructive: #d32f2f;
  --success: #2e7d32;
  --border: #e4e4e4;
  --input: #e4e4e4;
  --ring: #232323;
  --sidebar: #232323;
  --sidebar-foreground: #ffffff;
  --sidebar-accent: #1b1b1b;
  --sidebar-primary: #eeb167;
  --font-alt: "Outfit", ui-sans-serif, system-ui, sans-serif;
  --font-primary: "Figtree", ui-sans-serif, system-ui, sans-serif;
}
```

Stack: lucide-react + Recharts + Sonner + (recommended) shadcn Sidebar primitives restyled to these tokens.

---

## 19. Implementation checklist (revamp agent)

1. **Do not restyle** `Header.tsx`, `Footer.tsx`, `Home.tsx`, `PageHero`, or `index.css` marketing tokens except to add nav links and cart count.
2. Introduce `.eunik-os` + product tokens in `src/index.css` **without** renaming `--color-gold` / `--color-ink`.
3. Keep Outfit + Figtree; **never install DM Sans** for this brand.
4. Build **ink sidebar + paper canvas**.
5. Auth = 50/50 split; client gets campaign photography already in `/public/images`; staff gets ink gradient.
6. All **product** primary buttons = pills, `py-3`, ArrowRight. Marketing campaign buttons may stay rectangular.
7. Labels in forms = uppercase tracking-wider text-xs.
8. Dashboard greeting + need-attention **before** charts.
9. Cards `rounded-2xl` (client/studio overview) / `rounded-xl` (tools).
10. Charts: monotone area, dashed grid, 2px stroke, ink→gold series, ₦.
11. Gold only for prestige (avatar, QC shield, studio mark, deposit).
12. Sticky `h-14` glass header; pill search; optional 3-way theme; bell + avatar.
13. Mobile OS: bottom nav 4+More; public site keeps hamburger (+ optional shop tab bar).
14. Toasts top-center; no credential lists.
15. Dark mode = deeper nero, never indigo navy.
16. Motion: storefront may choreograph; dashboards must not.
17. WhatsApp `orderWhatsAppUrl` remains a **channel** beside cart checkout.
18. Seed UI copy with real collections: Ara'nbada, Men’s Senator, Agbada, Esiki, Fashion Suits.
19. Logo always `public/images/eunik.png` at 34px in marketing chrome; inverted on ink rails.

---

## 20. Reference component map (target this repo)

| Concern | New / existing file |
|---------|---------------------|
| Marketing tokens | `src/index.css` `@theme` (existing — lock) |
| OS tokens / utilities | `src/index.css` `.eunik-os` (new) |
| Font load | `index.html` (existing Outfit/Figtree) |
| Toasts | `src/main.tsx` Sonner |
| Public layout | `src/components/Layout.tsx` |
| Public header/footer | `Header.tsx`, `Footer.tsx` |
| Client login | `src/pages/auth/Login.tsx` |
| Staff login | `src/pages/auth/StudioLogin.tsx` |
| Register stepper | `src/pages/auth/Register.tsx` |
| Reset | `src/pages/auth/ForgotPassword.tsx` |
| Client shell | `src/layouts/AccountLayout.tsx` |
| Studio shell | `src/layouts/StudioLayout.tsx` |
| Atelier shell | `src/layouts/AtelierLayout.tsx` |
| Sidebars | `src/components/os/AccountSidebar.tsx`, `StudioSidebar.tsx`, `AtelierSidebar.tsx` |
| Stat / PageHeader | `src/components/os/StatCard.tsx` |
| Need action | `src/components/os/NeedActionPanel.tsx` |
| Status chips | `src/components/os/StatusChip.tsx` |
| Loading CTA | `src/components/os/LoadingButton.tsx` |
| User menu | `src/components/os/UserMenu.tsx` |
| Bottom nav | `src/components/os/MobileBottomNav.tsx` |
| Theme | `src/components/os/ThemeToggle.tsx` |
| Catalog (seed) | `src/data/catalog.ts` |

Remsana file names (`BusinessSidebar`, `admin.index`) must **not** be copied as-is. Rename to Fashion House vocabulary.

---

## 21. Screen-by-screen visual recipes (product OS)

Use these when implementing. Each recipe lists layout, type, and color only — business fields live in `EUNIK_FASHION_HOUSE_PLATFORM.md`.

### 21.1 Client login

- Left: campaign photo + ink/gold veil + Outfit quote + gold Shield chip
- Right: paper, logo 34px, H2 “Welcome back”, Figtree fields, full-width ink pill “Enter the house”, footer links Create account / WhatsApp

### 21.2 Client register

- Wider form column; 4–5 step circles (Account → Preferences → Measurements optional → Confirm)
- Active step **gold** fill
- Optional skip measurements with muted outline pill

### 21.3 Client dashboard

- Greeting Outfit 3xl
- Need-action card first
- Then 4 KPIs
- Then production tracker (check / spinner / hollow circles) using gold for current stage
- Then appointment list + recommended ProductCards (reuse marketing card hover)

### 21.4 Studio dashboard

- Same IA as Remsana admin overview
- Stat wells: gold for ₦, ink for counts, destructive for overdue, success for ready-for-pickup
- Donut labeled with EUNIK collection names
- Pipeline bars: Quote → Deposit → Cutting → Sewing → Fitting → QC → Ready

### 21.5 Production Kanban

- Columns as `rounded-2xl bg-card` with uppercase headers
- Cards: SKU, client name, due date, assignee avatar (gold initials)
- Overdue: destructive 2px left border

### 21.6 Measurement sheet

- Large numeric inputs, labels uppercase
- Profile switcher pills
- Staff capture: photo attach + fit preference (slim / regular / relaxed) as pill segmented control
- Sticky footer pill “Save profile”

### 21.7 Quotation review (client)

- Editorial product imagery on left if tied to a design
- Line items table
- Gold well: Deposit required
- Dual pills: “Accept & pay deposit” (gold) / “Request change” (outline)
- Accept opens the same payment step as checkout: **Paystack** or **transfer + receipt + transaction number**

### 21.9 Checkout payment step (marketing shell)

Segmented control or two stacked radios, Figtree 17/32:

1. **Pay with Paystack** — ink pill “Pay ₦{amount} with Paystack”. Demo toast + gold/ink note *Demo — no card is charged.*
2. **Bank transfer** — house account in a paper well; inputs:
   - Transaction number (required, uppercase tracking label like product OS)
   - Receipt (`<input type="file" accept="image/*,.pdf">`) with thumbnail preview
   - Ink pill “I’ve transferred ₦{amount}”

Do not put this inside the studio sidebar. Gold only on the amount.

### 21.8 PDP still marketing

Product detail on the **public** shell: Outfit title, gold highlight on “Made to measure”, Figtree 17/32 description, existing SKU pill, gallery, then product-OS pill pair “Add to bag” + “Order on WhatsApp”. Do not wrap PDP in the ink sidebar.

---

## 22. Forbidden translations (avoid accidental Remsana leftovers)

| If you see this | Replace with |
|-----------------|--------------|
| `#1a237e`, `#3949ab`, `#5c6bc0`, `#283593`, `#0f1445` | ink / nero / gold washes |
| `#c9a84c` | `#eeb167` |
| DM Sans | Outfit + Figtree |
| “Chief of Staff” / “Ask the CoS” | “Request a design” / “Ask the atelier” |
| “Business OS” / “Admin Control Suite” | “Fashion House OS” / “Atelier floor” |
| “Learners” search | “SKUs, clients, orders” |
| NDPC/SOC2 chips on auth | Measurement privacy + Ibadan atelier |
| Royal grid-fade indigo | Idle ink grid at 6% |
| Navy cards in dark mode | Ink `#232323` cards on nero |

---

## 23. One-line north star

**Keep the gold-and-ink fashion house on the street; behind the door, give clients and cutters a charcoal command rail, a paper canvas, pill actions, gold used like a seal, Outfit + Figtree, and dashboards that greet them, show the fitting that is due, then the naira — never the other way around.**
