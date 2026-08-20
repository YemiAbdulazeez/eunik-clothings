# Remsana Auth & Dashboard — Full UI / UX / Design Language Spec

> **Purpose:** This document is a reconstruction kit. An AI agent should be able to rebuild (or restyle) **auth screens** and **in-app dashboards** to match Remsana without reading the React source. It describes the *language*, not business logic.
>
> **Surfaces covered**
> - Auth: `/login`, `/admin-login`, `/register`, `/forgot-password`
> - Business OS shell + overview: `/app/*`
> - Admin Control Suite shell + overview: `/admin/*`
>
> **Not in scope here:** marketing landing pages (`/`, `/pricing`, etc.) except where they share tokens.

---

## 1. Brand personality (the “feel”)

Remsana’s product UI is **sovereign / executive / institutional** — not playful SaaS, not crypto-neon, not dense enterprise gray.

| Axis | Value |
|------|--------|
| Industry metaphor | African enterprise OS + private bank + command center |
| Temperature | Cool royal indigo + warm gold accent |
| Density | Comfortable executive, not data-warehouse cramped |
| Geometry | Soft rectangles + **pills** (CTAs, chips, search, avatars) |
| Voice on screens | Calm, precise, uppercase micro-labels, tight tracking |
| Motion | Almost none on dashboards; fade/lift reserved for marketing; loaders spin |
| Trust signals | Gold shield icons, “NDPC / SOC 2” chips, glass trust bars on auth heroes |

**Do**
- Use dark royal blue as the *authority* color (sidebar, primary buttons, headings in light mode).
- Use gold sparingly as *prestige* (avatars in Business OS, MFA hints, KPI sparkles, brand mark on admin sidebar).
- Use lots of whitespace, 2xl rounded cards, muted uppercase labels.

**Don’t**
- Saturate the page with gold.
- Use sharp 4px corners on primary product CTAs (those are **full pills**).
- Use Inter/Roboto as the primary UI face (DM Sans is the brand face).
- Animate cards bouncing into view on every dashboard paint.

---

## 2. Typeface

### 2.1 Family

- **Primary + display:** [DM Sans](https://fonts.google.com/specimen/DM+Sans) variable (`opsz` 9–40, weight 100–1000, italic).
- Loaded from Google Fonts in `index.html` with `preconnect` to `fonts.googleapis.com` / `fonts.gstatic.com`.
- Fallback: `ui-sans-serif, system-ui, sans-serif`.
- `--font-sans` and `--font-display` are **the same family**. Display is distinguished by **weight + tracking**, not a second face.

### 2.2 Body / global

```
font-family: DM Sans
font-feature-settings: "ss01", "cv11"
-webkit-font-smoothing: antialiased
text-rendering: optimizeLegibility
```

### 2.3 Scale (product)

| Role | Size | Weight | Tracking | Color |
|------|------|--------|----------|--------|
| Auth / dashboard H1 | `text-4xl` (auth hero) or `text-2xl sm:text-3xl` (dashboard greeting) | 600 | `tracking-tight` (−0.025em on h1–h4) | `primary-foreground` on hero; `foreground` on dashboards |
| Page title (admin PageHeader) | `text-2xl font-semibold tracking-tight` | 600 | tight | foreground |
| Section title | `text-sm font-semibold` | 600 | normal | foreground |
| Card KPI value | `text-2xl` (sometimes `text-5xl` for hero scores) | 600 | tight | foreground / primary |
| Body | `text-sm` | 400 | normal | `muted-foreground` for support copy |
| Field label | `text-xs font-medium uppercase tracking-wider` | 500 | wider | muted-foreground |
| Eyebrow / overline | `text-[10px]` or `text-xs` **uppercase tracking-widest** | 500–600 | widest | muted-foreground or primary |
| Chips / badges | `text-[10px]`–`text-[11px]` uppercase tracking-wider | 500–600 | wider | see chips |
| Table header | `text-xs uppercase tracking-widest` | 500 | widest | muted-foreground |
| Keyboard hint | `text-[10px] font-medium` inside `<kbd>` | 500 | — | muted-foreground |
| OTP digits | `text-lg` or `text-2xl font-semibold` + `tracking-[0.5em]` | 600 | letter-spaced | foreground |

Headings `h1–h4` globally: `letter-spacing: -0.025em; font-weight: 600`.

---

## 3. Color system

Named tokens live in `src/styles.css`. Recreate these exact hex values.

### 3.1 Light mode (`:root`)

| Token | Hex / value | Usage |
|-------|-------------|--------|
| `--background` | `#f8fafc` | App canvas (cool off-white, not pure white) |
| `--foreground` | `#1a237e` | Body text is **royal**, not charcoal |
| `--card` | `#ffffff` | Cards, tables, popovers |
| `--card-foreground` | `#1a237e` | |
| `--primary` | `#1a237e` | Buttons, links, active nav, charts |
| `--primary-foreground` | `#ffffff` | |
| `--primary-glow` | `#3949ab` | Rings, selection, glow shadows |
| `--secondary` / `--muted` | `#f5f7fa` | Soft wells, inset chips |
| `--muted-foreground` | `#4a5578` | Secondary copy (blue-gray, not #6b7280) |
| `--accent` | `#5c6bc0` | Hover tints; shadcn accent (note: white text on accent) |
| `--gold` | `#c9a84c` | Prestige accent |
| `--gold-foreground` | `#1a237e` | Text on gold (e.g. gold avatar) |
| `--destructive` | `#d32f2f` | Errors, sign-out, unread badge |
| `--success` | `#2e7d32` | Positive deltas, paid |
| `--warning` | `#f4b400` | Caution (Google-yellow, not orange) |
| `--border` / `--input` | `#e4e7ef` | Hairlines |
| `--ring` | `#3949ab` | Focus rings |
| `--sky` | `#3949ab` | |
| `--cyan` | `#5c6bc0` | |
| `--emerald` | `#2e7d32` | |
| `--violet` | `#283593` | |

**Chart series (light)**
- `--chart-1` `#1a237e`
- `--chart-2` `#283593`
- `--chart-3` `#3949ab`
- `--chart-4` `#5c6bc0`
- `--chart-5` `#c9a84c` (gold = highlight series)

**Sidebar (light) — inverted: dark navy rail on light page**
- `--sidebar` `#1a237e`
- `--sidebar-foreground` `#ffffff`
- `--sidebar-primary` `#c9a84c` (gold mark)
- `--sidebar-primary-foreground` `#1a237e`
- `--sidebar-accent` `#283593` (hover / active wash)
- `--sidebar-accent-foreground` `#ffffff`
- `--sidebar-border` `#283593`
- `--sidebar-ring` `#c9a84c`

### 3.2 Dark mode (`.dark` on `<html>`)

| Token | Hex |
|-------|-----|
| background | `#0f1445` (deep navy, not #0a0a0a) |
| foreground | `#ffffff` |
| card / popover | `#1a237e` |
| primary | `#5c6bc0` (lighter so buttons pop on navy) |
| primary-glow | `#7986cb` |
| secondary / muted | `#283593` |
| muted-foreground | `#b4bce0` |
| accent | `#3949ab` |
| border | `rgba(255,255,255,0.1)` |
| input | `rgba(255,255,255,0.12)` |
| sidebar | `#0f1445` |
| sidebar-accent | `#1a237e` |
| gold-foreground | `#0f1445` |

Cards in dark mode are **navy panels on a deeper navy canvas**, not gray elevation.

### 3.3 Gradients (use as background utilities)

```
--gradient-royal: linear-gradient(135deg, #1a237e, #3949ab)
--gradient-brand: linear-gradient(135deg, #1a237e 0%, #283593 45%, #3949ab 100%)
--gradient-gold:  linear-gradient(135deg, #c9a84c, #e0c56e)
--gradient-aurora:
  radial-gradient(60% 60% at 10% 0%, rgba(57,73,171,0.18), transparent 60%),
  radial-gradient(50% 50% at 90% 10%, rgba(92,107,192,0.18), transparent 60%),
  radial-gradient(60% 60% at 50% 100%, rgba(40,53,147,0.14), transparent 60%)
```

Dark-mode brand gradient shifts toward `#283593 → #3949ab → #5c6bc0`.

Utility class names: `bg-royal-gradient`, `bg-brand-gradient`, `bg-gold-gradient`, `bg-aurora`, `text-gradient` (brand clip).

### 3.4 Shadows

```
--shadow-elegant: 0 30px 60px -30px rgba(26,35,126,0.25), 0 12px 30px -18px rgba(26,35,126,0.18)
--shadow-soft:    0 8px 30px -12px rgba(26,35,126,0.1)
--shadow-glow:    0 0 60px -12px rgba(57,73,171,0.4)
```

- Default cards: `shadow-soft` (or none + `border-border`).
- Hover lift / marketing: `shadow-elegant`.
- CTAs on marketing only: `shadow-glow`.
- User menu / notification popover: Tailwind `shadow-lg`.

Shadows are **tinted royal**, never generic black at 25%.

### 3.5 Selection

Text selection: `color-mix(in oklab, var(--primary-glow) 40%, transparent)` background.

---

## 4. Radius, spacing, grid

### 4.1 Radius scale

`--radius: 0.75rem` (12px).

| Token | Formula | Typical use |
|-------|---------|-------------|
| `rounded-sm` | radius − 4px | tiny |
| `rounded-md` | radius − 2px | shadcn buttons, status chips |
| `rounded-lg` | 12px | icon wells, table inners, admin StatCard |
| `rounded-xl` | 16px | **default product surfaces** (inputs, nested KPI, admin cards) |
| `rounded-2xl` | 20px | **hero cards, need-action, user menu, dashboard cards on /app** |
| `rounded-3xl` | 24px | apply form shells, mobile “more” sheet |
| `rounded-full` | pill | **all primary CTAs, chips, search, avatars, theme toggle, badges** |

Rule of thumb:
- **Interactive primary action = pill.**
- **Content card = 16–20px radius.**
- **Input = 12–16px (`rounded-xl`).**

### 4.2 Spacing rhythm

| Context | Values |
|---------|--------|
| Page main padding | `px-4 py-6` → `sm:px-6 sm:py-8` → `lg:px-10 lg:py-10` |
| Content max width | `max-w-7xl mx-auto` |
| Vertical stack (dashboard) | `space-y-8 sm:space-y-10` (/app); admin uses `space-y-8 sm:space-y-10` in shell + `space-y-10` on overview |
| Card padding | `/app` KPI/overview: `p-6` or `p-6 sm:p-8`; admin StatCard/SectionCard: `p-5` |
| Form field gap | `space-y-4`; label → input `mt-1.5` |
| Grid gaps | `gap-4` admin; `gap-4 sm:gap-5` / `gap-6` Business OS |
| Header height | sticky `h-14` |

### 4.3 Layout grids

- KPI row: `grid gap-4 md:grid-cols-2 xl:grid-cols-4`
- Two-up recents: `grid gap-6 lg:grid-cols-2`
- Chart + aside: `grid gap-6 lg:grid-cols-3` with chart `lg:col-span-2`
- Auth: `grid min-h-screen lg:grid-cols-2` (register uses `lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]` so the form column is slightly wider)

---

## 5. Iconography

- Library: **lucide-react** only (stroke icons, 1.5–2px implied).
- Default size in nav / buttons: `h-4 w-4`.
- Header utilities: `h-3.5 w-3.5` or `h-4 w-4`.
- StatCard wells: `h-5 w-5` inside a `h-10 w-10` rounded-lg tinted well.
- Gold prestige: `text-gold` on Shield / Sparkles / Check.
- Never mix Font Awesome / Heroicons.

**Recurring icons**

| Meaning | Icon |
|---------|------|
| Submit / continue | `ArrowRight` after label |
| Email field | `Mail` left-inset |
| Password | `Lock` |
| MFA | `KeyRound` + gold |
| Trust | `Shield` / `ShieldCheck` |
| Notify | `Bell` |
| Theme | `Sun` / `Monitor` / `Moon` |
| Search | `Search` |
| Dashboard | `Home` / `LayoutDashboard` |
| AI CoS | `Bot` |
| Finance | `Receipt` / `Wallet` |
| Sales | `TrendingUp` |
| People | `Users2` |
| Academy | `GraduationCap` |
| Spaces | `Building2` |
| Audit | `ScrollText` |
| Prestige | `Sparkles` |

---

## 6. Motion & animation

Dashboards are **static**. Motion exists as utilities in CSS, used mainly on marketing.

| Utility / keyframe | Spec | Use |
|--------------------|------|-----|
| `hover-lift` | 300ms `cubic-bezier(0.2, 0.8, 0.2, 1)`; hover `translateY(-4px)` + elegant shadow | Marketing cards, not dashboard KPIs (admin StatCard uses softer `hover:shadow-elegant` without lift) |
| `animate-fade-up` | 0.7s same easing, 16px up | Marketing |
| `animate-float` | 6s ease-in-out ±10px Y | Decorative |
| `animate-blob` | 14s morph | Auth/marketing blobs if used |
| `animate-marquee` | 40s linear | Logo rows |
| `story-link` | underline scaleX 300ms | Marketing text links |
| `shine` | background-position sweep | Rare |
| Theme toggle | `transition-colors` only | Header |
| Buttons | `transition` / `hover:bg-primary/90` | All CTAs |
| Loader | `Loader2` `animate-spin` | LoadingButton |
| Mobile more sheet | `animate-in slide-in-from-bottom duration-200` | Bottom sheet |
| HTML | `scroll-behavior: smooth` | Page |

**Auth:** no entrance animation on the form column. Loading states: button text → “Signing in…” / “Checking…” + disabled `opacity-70`.

**Toasts:** Sonner, `richColors`, `position="top-center"`.

---

## 7. Glass, texture, decorative utilities

```
.glass       = 68% background mix + 60% border mix + saturate(180%) blur(20px)
.glass-dark  = 55% #1a237e + blur(18px) + 12% white border
.grid-fade   = 48px royal grid lines at 6% opacity, radial mask from top
```

Used on marketing headers (`glass` when scrolled). Auth heroes use **photo + gradient overlay**, not glass-on-form.

---

## 8. Controls (forms, buttons, chips)

### 8.1 Primary product button (auth + most in-app)

```
inline-flex w-full (auth) items-center justify-center gap-2
rounded-full
bg-primary py-3 (auth) or px-5 py-2.5 (inline)
text-sm font-medium text-primary-foreground
transition hover:bg-primary/90
disabled:opacity-70
+ trailing ArrowRight h-4 w-4
```

Admin page headers use smaller pills: `rounded-md` or `rounded-full bg-primary px-3 py-1.5 text-xs`.

`LoadingButton` is always **pill**, variants: `primary | gold | outline | ghost | danger | subtle`. Sizes: sm `px-3 py-1.5 text-xs`, md `px-4 py-2 text-sm`, lg `px-6 py-3`.

Shadcn `Button` exists for primitives (sidebar trigger) — **do not use its default `rounded-md` for product CTAs**.

### 8.2 Text inputs (auth / product)

```
w-full rounded-xl
border border-input bg-background
px-3 py-2.5 text-sm
outline-none ring-primary/30 focus:ring-2
```

Icon fields: left icon `absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground`, input `pl-9 pr-3`.

Checkbox: native, `rounded border-border`, aligned with `text-xs text-muted-foreground`.

Labels: **always above**, never floating; uppercase tracking.

### 8.3 OTP

- Six boxes **or** one tracking-wide field (`tracking-[0.5em] text-center text-lg`).
- Register uses individual tall boxes (~`h-14`, `text-2xl font-semibold`).
- Admin MFA: single field, placeholder `123 456`.

### 8.4 Errors / info

```
rounded-xl border border-destructive/40 bg-destructive/10
px-3 py-2 text-xs text-destructive
```

Info / amber locks:

```
rounded-2xl border border-amber-500/30 bg-amber-500/10
text-sm text-amber-950 dark:text-amber-100
```

Success wells: `border-[color:var(--success)]` tints or `text-[color:var(--success)]`.

### 8.5 Chips & badges

| Kind | Classes |
|------|---------|
| Role chip (header) | `rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary` |
| Soft metric chip | `rounded-full border border-border bg-card px-3 py-1 text-[11px]` |
| StatusChip | `rounded-md px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide` + emerald/amber/sky/destructive/muted |
| Unread count | `absolute` on Bell: `h-4 min-w-4 rounded-full bg-destructive` (Business OS) or `bg-gold text-gold-foreground` (Admin) |
| Staff access pill | `rounded-full bg-muted px-2 py-0.5 text-[10px]` |
| `<kbd>` | `rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground` |

### 8.6 Theme toggle

Pill cluster: `inline-flex rounded-full border border-border bg-background p-0.5`. Three `h-7 w-7 rounded-full` radios. Active: `bg-primary text-primary-foreground`. Icons 14px.

### 8.7 Links

In-copy: `text-primary hover:underline` (or `font-medium`). Section “open →” is `text-xs font-medium text-primary hover:underline` + small `ArrowRight`.

---

## 9. Cards, tables, empty / loading

### 9.1 Business OS dashboard card (`/app`)

```
rounded-2xl border border-border bg-card p-6 sm:p-8
```

Inner KPI mini-cards: `rounded-xl border border-border bg-background px-4 py-3`.

Need-action list rows:

```
flex items-start gap-3 rounded-xl border p-3.5
urgency high:   border-destructive/35 bg-destructive/5
urgency medium: border-amber-500/30 bg-amber-500/5
urgency low:    border-border bg-background
hover:border-primary/40
```

Left icon well: `h-8 w-8 rounded-lg` — destructive tint if high, else `bg-primary/10 text-primary`.

### 9.2 Admin cards

- **StatCard:** `rounded-xl border border-border bg-card p-5 shadow-soft hover:shadow-elegant`. Label uppercase tracking-wider. Value `text-2xl`. Icon in 40×40 `rounded-lg` well (`bg-primary/10`, `bg-gold/20`, success/warning/destructive tints).
- **SectionCard:** same radius/padding; title `text-sm font-semibold`; description `text-xs text-muted-foreground`; `mb-4` header row.
- **PageHeader:** title + subtitle, `border-b border-border pb-6`, actions right-aligned.

### 9.3 Tables

- Wrapper: `overflow-x-auto` inside card.
- Header: `border-b border-border text-xs uppercase tracking-widest text-muted-foreground`.
- Rows: `border-b border-border/60 last:border-0`, `py-3`, name `font-medium`, meta `text-xs text-muted-foreground`.
- Wide tables: `min-w-[640px]`–`min-w-[760px]`.

### 9.4 Loading

`PageSkeleton`: fake H1 block + 4 rounded-2xl KPI skeletons + one large card of `h-10` bars. Use shadcn `Skeleton`. `aria-busy` + `aria-label="Loading"`.

`AsyncPage`: wraps admin overview with skeleton vs error vs children.

### 9.5 Empty

Centered `text-sm text-muted-foreground` in table cell `py-6` or a single sentence in the card.

---

## 10. Charts

Library: **Recharts** inside `ResponsiveContainer`.

### 10.1 Area / line (cash, funnel)

- Stroke width **2**.
- `type="monotone"`.
- Fill = vertical linearGradient, stop 0% opacity 0.4–0.55 → 100% 0–0.05.
- Grid: `CartesianGrid strokeDasharray="3 3" stroke="var(--border)"` often `vertical={false}`.
- Axes: `tick={{ fontSize: 10–11, fill: "var(--muted-foreground)" }}`; hide tick/axis lines on Business OS cash chart (`tickLine={false} axisLine={false}`).
- Tooltip: `background: var(--card) or var(--popover)`, `border: 1px solid var(--border)`, `borderRadius: 8–12`, `fontSize: 12`. Format money as NGN.
- Legend: `fontSize: 10–11`.
- Heights: 220–320px (`h-52` donut companion, `h-64`/`h-72` areas).

Business OS cash flow uses **oklch** pair:
- Inflow: `oklch(0.42 0.16 274)` (royal)
- Outflow: `oklch(0.78 0.13 85)` (gold)

Admin uses CSS vars `--chart-1` … `--chart-5`.

### 10.2 Donut / pie

- `innerRadius` 45–55, `outerRadius` 80–90, `paddingAngle={2}`.
- Stroke `var(--color-background)` width 2 so slices separate.
- Legend as **custom HTML list** (not only Recharts legend) with 10px colored dots.

Donut palette (Business OS):

```
oklch(0.42 0.16 274)
oklch(0.78 0.13 85)
oklch(0.55 0.15 148)
oklch(0.62 0.13 240)
oklch(0.68 0.14 25)
oklch(0.55 0.10 300)
```

### 10.3 Progress bars (pipelines)

Track: `h-1.5 overflow-hidden rounded-full bg-muted`.  
Fill: `h-full bg-primary` (or `bg-royal-gradient` in older admin demo). Width % via inline style.

---

## 11. Sidebars

Implementation: shadcn **Sidebar** (`SidebarProvider`, collapsible `"icon"`).

| Token | Value |
|-------|--------|
| Expanded width | `16rem` |
| Icon-collapsed | `3rem` |
| Mobile sheet | `18rem` |
| Persist | cookie `sidebar_state`, 7 days |
| Keyboard | `b` toggles |
| Mobile | Sheet overlay (not in-flow) |

### 11.1 Shared chrome

- Header: border-b `border-sidebar-border`, logo + 2-line wordmark.
- Wordmark: `text-sm font-semibold` + `text-[9px]–[11px] uppercase tracking-widest` at 60% opacity.
- Group label: muted sidebar foreground (`text-sidebar-foreground/50`).
- Menu item: lucide 16px + label. **Active state: `data-[active=true]:rounded-full`** (pill highlight on the dark rail).
- Footer: avatar + name + role (uppercase tracking) + optional gold Sparkles / logout.

### 11.2 Business OS sidebar

- Logo: brand PNG, `brightness-0 invert` so it reads white on navy.
- Avatar: **gold circle** `bg-gold text-gold-foreground` initials.
- Single group: “Operating system” (or “Onboarding” if applicant-locked).
- Locked plan items: 60% opacity + tiny `Lock`.

### 11.3 Admin sidebar

- Mark: `h-9 w-9 rounded-md bg-gold-gradient` + `Sparkles` (not the PNG).
- Subtitle: “Admin Control Suite”.
- Groups: Overview / Growth / Delivery / Governance.
- Footer logout icon button, no gold avatar (uses `sidebar-accent` initials).
- Filter items by `adminRole` **and** optional `adminSections[]`.

### 11.4 Top app bar (both suites)

```
sticky top-0 z-20/30
h-14
border-b border-border
bg-background/85 backdrop-blur
px-4
flex items-center gap-3
```

Left: `SidebarTrigger` (muted).  
Center (md+): **pill search**

```
hidden md:flex items-center gap-2
rounded-full border border-input bg-muted/40
px-4 py-1.5
input w-72 bg-transparent text-sm
```

- Business OS placeholder: “Ask the Chief of Staff…”
- Admin placeholder: “Search learners…”
- Trailing `<kbd>⌘K</kbd>`

Right cluster: theme toggle → (role/vacation chips on /app) → bell → UserMenu.

Bell: `rounded-full p-2 text-muted-foreground hover:bg-accent`.

### 11.5 User menu (popover)

```
absolute z-50 mt-2 w-64
rounded-2xl border border-border bg-popover p-1 shadow-lg
```

Trigger: avatar + 2-line name/subtitle + ChevronDown; `rounded-full` hover `bg-accent`.  
Business OS avatar accent **gold**; Admin **primary/10**.  
Items: `rounded-lg px-3 py-2 text-sm hover:bg-accent`. Sign out: `text-destructive hover:bg-destructive/10`.  
Click-outside + Escape to close.

### 11.6 Mobile bottom nav (`lg:hidden`)

- Fixed `inset-x-0 bottom-0 z-40`, `border-t`, `bg-background/95 backdrop-blur`.
- 5 columns: 4 primary + “More”.
- Item: `flex-col`, icon `h-5 w-5`, label `text-[10px]`. Active `text-primary`.
- Spacer `h-20` so content isn’t covered.
- More: portal overlay `bg-foreground/40 backdrop-blur-sm` + sheet `rounded-t-3xl`, grabber `h-1.5 w-10 rounded-full bg-border`, 3-column icon grid.

---

## 12. Auth screens — structure & UX

All auth pages are **split-pane**: hero (desktop only) | form. No card wrapping the form on a gray page — the form sits on `background` itself.

### 12.1 Shared hero rules (lg+)

```
relative hidden overflow-hidden lg:block (or lg:flex)
min-h-screen
```

**Layering**
1. Full-bleed photo (`object-cover`) **or** solid `bg-primary` + `bg-royal-gradient opacity-90`.
2. Gradient veil: `bg-gradient-to-tr from-primary/90 via-primary/70 to-primary/40` (login) or `to-br` (register).
3. Flex column `justify-between p-12 text-primary-foreground`.
4. Top: Logo (compact) or Admin gold-mark wordmark.
5. Middle: `max-w-md` — H1 `text-4xl font-semibold leading-tight tracking-tight`, supporting `text-primary-foreground/80`.
6. Trust chip:

```
flex items-center gap-2
rounded-2xl border border-white/15 (or /10)
bg-white/5 (or /10)
px-4 py-3 text-sm
icon text-gold
```

7. Footer copyright `text-xs text-primary-foreground/60`.

Photos used:
- Login: executive hero (`hero-executive.jpg`)
- Register: same executive language
- Forgot: `abstract-royal.jpg`
- Admin login: **no photo** — royal gradient only (more “restricted facility”)

### 12.2 Form column

```
flex items-center justify-center overflow-y-auto
p-6 sm:p-8 (register: p-6 md:p-10, align start + scroll)
inner: w-full max-w-lg (login/register) or max-w-md (admin)
```

Mobile: compact Logo or “← Back” above the H2.

**Hierarchy**
1. Optional eyebrow pill (admin: “Staff access” + Lock).
2. H2 `text-2xl font-semibold tracking-tight`.
3. Subtitle `mt-1 text-sm text-muted-foreground`.
4. Error banner if any.
5. Form `mt-6|mt-8 space-y-4`.
6. Footer links centered `text-sm` / `text-xs`.

**Remember + forgot** on one `text-xs` row, space-between.

**Cross-links**
- Login → Apply, Admin sign in
- Admin → Client sign in
- Admin extra: muted `rounded-2xl border bg-muted/40 p-4` “Enterprise SSO available”

### 12.3 Register extra UX

- Split weights 1 : 1.2.
- Stepper: row of 7px circles (`h-7 w-7 rounded-full`):
  - done: `bg-primary text-primary-foreground` + Check
  - active: `bg-gold text-gold-foreground`
  - idle: `bg-muted text-muted-foreground`
  - connectors: `h-px flex-1` primary vs border
- Step caption: `text-[11px] uppercase tracking-widest`.
- Primary continue: same full-width pill as login.
- Secondary: outline pills `rounded-full border … text-xs`.

### 12.4 Forgot password

4-step wizard (email → OTP → new password → success). Same split-hero language. Success uses Check in a gold/primary well.

### 12.5 Auth UX rules

- Validate before network: email regex, password ≥ 6 (login) / ≥ 8 (reset/register).
- Disable submit while busy; keep the field values.
- Never show demo credentials on the canvas.
- Admin live API: **no fake MFA**; MFA UI is offline-demo only.
- First-login `mustChangePassword`: after redirect, **in-dashboard banner**, not a blocking dedicated page (banner card + two inputs + pill).

---

## 13. Dashboard information architecture & page composition

### 13.1 Shell (both)

```
SidebarProvider
  flex min-h-screen w-full bg-background
    skip-link (sr-only, focus: pill primary)
    Sidebar
    flex flex-col flex-1 min-w-0
      sticky header h-14
      main#… px/py as §4.2
        mx-auto max-w-7xl space-y-8|10
          [banners]
          <Outlet />
      MobileBottomNav
```

Skip link: `focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2`.

### 13.2 Business OS overview (`/app`) — section order

1. **Hero row** — eyebrow “Your workspace” + role chip; greeting `Good morning/afternoon/evening, {firstName}.`; tagline; primary pill “Ask the Chief of Staff” (`bg-primary rounded-full` + Bot).
2. **Need action** — card with AlertCircle, count, list of urgency rows + CTA chips.
3. **Subscription hint** — 1–2 gradient mini-cards (`from-primary/5`, `border-primary/20`).
4. **KPI quadruple** — 4 permission-filtered metric cards (icon top-right `text-primary`).
5. Optional people KPI rollup (CEO/HR).
6. **Cash flow area (2/3) + Vacation Test (1/3)** — big number `/ 30 days` + 5 thin progress rows.
7. **Donuts** — revenue mix / invoice pipeline.
8. **Compliance + priority checklist** (checkbox + tag chip).
9. **Team snapshot + notifications** (dot + title + body; first item no top border).
10. **Audit preview** — divided list, severity pills.

Tone: **greeting-first, exceptions-second, numbers-third, narratives-last.**

### 13.3 Admin overview (`/admin`) — section order

Same rhythm, different domain:

1. Hero (suite chip + role + optional “Demo overview” amber chip). Greeting. CTA “Review onboarding”.
2. Need attention (billing / admissions / LMS).
3. Four Stat-like KPIs (MRR, past due, learners, open admissions) — `/app` card styling (`rounded-2xl p-6`) **or** StatCard on older admin pages.
4. Quick navigation 4×2 tiles (`rounded-xl border bg-background p-4`, icon well `h-9 w-9 rounded-lg bg-primary/10`).
5. Finance snapshot (3 inner metrics + donut) + onboarding pipeline bars.
6. Recent admissions table-list + notifications.
7. LMS 2×2 stats + audit trail.
8. Demo-only charts (funnel, ad spend, cohorts, datacenter) **offline only**.

Do **not** put a “your sections” map on Overview; staff assignment lives in Operations.

### 13.4 Inner admin pages

Always: `PageHeader` then `grid` of StatCards then SectionCards. Actions in header are small primary pills.

### 13.5 Inner Business OS pages

Reuse dashboard cards; tabs are often **underline or pill segmented controls** (`rounded-full border p-1` with active `bg-primary text-primary-foreground`).

---

## 14. Modals, sheets, overlays

| Pattern | Treatment |
|---------|-----------|
| User menu | anchored popover, 16px radius, 4px padding |
| Admin notifications | `w-80 rounded-xl border bg-card p-2 shadow-lg` under bell |
| Mobile more | bottom sheet (see §11.6) |
| shadcn Dialog / Sheet | used by sidebar mobile; sheet from left for nav |
| Confirmations | prefer inline banner + toast over modal |
| PWA install | top/bottom banner, not modal |

Focus: `ring-2 ring-primary/30` or `focus-visible:ring-1 focus-visible:ring-ring`.

---

## 15. Theme behavior

- Storage key: `remsana-theme` = `light | dark | system`.
- Inline script in `index.html` toggles `.dark` **before paint** (no flash).
- Theme-color meta ≈ `#1a2a4a`.
- Default follows system.

When restyling another product: keep **light canvas + dark sidebar** as the signature; dark mode is a full navy inversion, not “gray app”.

---

## 16. Accessibility & microcopy

- Skip to content on both shells.
- Icon-only controls have `aria-label`.
- Theme toggle is a `radiogroup`.
- Loading skeletons announce `aria-busy`.
- Errors are text in a banner, not color-only.
- Microcopy voice: short, institutional, Nigerian/African enterprise context, no slang.
- Money: `en-NG` locale, ₦ / `NGN.format` / `shortNaira` (e.g. ₦12.4M).
- Dates: `toLocaleString("en-NG", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })`.

---

## 17. Copy-paste token CSS (starter)

```css
:root {
  --radius: 0.75rem;
  --background: #f8fafc;
  --foreground: #1a237e;
  --card: #ffffff;
  --primary: #1a237e;
  --primary-foreground: #ffffff;
  --primary-glow: #3949ab;
  --muted: #f5f7fa;
  --muted-foreground: #4a5578;
  --accent: #5c6bc0;
  --gold: #c9a84c;
  --gold-foreground: #1a237e;
  --destructive: #d32f2f;
  --success: #2e7d32;
  --warning: #f4b400;
  --border: #e4e7ef;
  --input: #e4e7ef;
  --ring: #3949ab;
  --sidebar: #1a237e;
  --sidebar-foreground: #ffffff;
  --sidebar-accent: #283593;
  --sidebar-primary: #c9a84c;
  --font-sans: "DM Sans", ui-sans-serif, system-ui, sans-serif;
}
```

Load DM Sans variable. Put lucide + Recharts + a toast (Sonner-like) in the stack.

---

## 18. Implementation checklist for a revamp agent

1. Install DM Sans; set body foreground to **royal**, not gray-900.
2. Build a **navy sidebar + light canvas** (do not use a white sidebar).
3. Auth = **50/50 split**, photo or royal gradient, form unconstrained on the right.
4. All primary buttons = **pills**, `py-3`, optional ArrowRight.
5. Labels = **uppercase tracking-wider text-xs**.
6. Dashboard greeting + need-attention **before** charts.
7. Cards `rounded-2xl` (BOS) / `rounded-xl` (admin tools) + `border-border`.
8. Charts: monotone area, dashed grid, 2px stroke, royal→gold series.
9. Gold only for prestige (avatar, shields, admin mark, sparkles).
10. Sticky `h-14` glass header; pill search; theme 3-way toggle; bell + avatar menu.
11. Mobile: bottom nav 4+More, not a hamburger-only app.
12. Toasts top-center; no credential lists on login.
13. Dark mode = deeper navy, cards remain royal blue.
14. Motion: hover color + disabled opacity; skip entrance choreography on dashboards.

---

## 19. Reference component map (this repo)

| Concern | File |
|---------|------|
| Tokens / utilities | `src/styles.css` |
| Font load + theme FOUC | `index.html` |
| Toasts | `src/main.tsx` (`Toaster` from sonner) |
| Client login | `src/routes/login.tsx` |
| Admin login | `src/routes/admin-login.tsx` |
| Register stepper | `src/routes/register.tsx` |
| Reset | `src/routes/forgot-password.tsx` |
| BOS shell | `src/routes/app.tsx` |
| BOS overview | `src/routes/app.index.tsx` |
| Admin shell | `src/routes/admin.tsx` |
| Admin overview | `src/routes/admin.index.tsx` |
| BOS sidebar | `src/components/business/BusinessSidebar.tsx` |
| Admin sidebar | `src/components/admin/AdminSidebar.tsx` |
| Sidebar primitive | `src/components/ui/sidebar.tsx` |
| Stat / PageHeader / SectionCard | `src/components/admin/StatCard.tsx` |
| User menu | `src/components/UserMenu.tsx` |
| Bottom nav | `src/components/business/MobileBottomNav.tsx` |
| Need action | `src/components/business/NeedActionPanel.tsx` |
| Status chips | `src/components/StatusChip.tsx` |
| Loading CTA | `src/components/LoadingButton.tsx` |
| Theme | `src/components/theme-toggle.tsx`, `theme-provider.tsx` |
| Logo | `src/components/marketing/Logo.tsx` |

---

## 20. One-line north star

**A dark-royal command rail, a cool-white executive canvas, pill actions, gold used like a seal, DM Sans, and dashboards that greet you, show what needs attention, then the numbers — never the other way around.**
