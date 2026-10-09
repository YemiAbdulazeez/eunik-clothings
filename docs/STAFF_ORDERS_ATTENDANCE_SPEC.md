# Spec: Draft offline orders, order back nav, geotagged attendance, daily reports & payout analytics

> **Status:** Pre-implementation — awaiting your confirmation before any code changes.  
> **Date:** 2026-10-08  
> **Repos:** `EUNIK` (frontend) + `backend-eunik` (API/SQL)

This document records how I understand each request, what exists today, and what I propose to build. Please correct anything that is wrong or incomplete before I implement.

---

## Contents

1. [Save as draft for offline / manual orders](#1-save-as-draft-for-offline--manual-orders)
2. [Back button on order details](#2-back-button-on-order-details)
3. [Fix attendance “Sign in required”](#3-fix-attendance-sign-in-required)
4. [Geotagged clock in / out, two sites, analytics & ranking](#4-geotagged-clock-in--clock-out--two-sites--super-admin-analytics--ranking)
5. [Daily reporting module → weekly payout](#5-daily-reporting-module--weekly-payout)
6. [Suggested build order](#6-suggested-build-order)
7. [Open questions for you](#7-open-questions-for-you)
8. [Out of scope (unless you say otherwise)](#8-out-of-scope-unless-you-say-otherwise)

---

## Current baseline (what the house already has)

| Area | Today |
|------|--------|
| Manual / offline order key-in | `StudioManualOrderForm` → `POST /v1/orders/manual`. Immediate live order. Statuses like `confirmed`, `awaiting_transfer`, etc. **No draft.** |
| Orders list filters | Status/kind pills + source pills (Website / WhatsApp / Phone / Walk-in). **No Draft filter.** |
| Order detail | `/studio/orders/:id` — has “All orders” pill, **no dedicated Back control.** |
| Attendance | Simple `in` / `out` punches (`attendance` table: `user_id`, `type`, `at`, `note`). **No GPS.** Studio + Atelier pages. |
| Work sites | **Not modelled.** House settings have a single `pickupLocation` / address text — no Workstation vs Studio coords, no staff site assignment. |
| Payroll / daily work logs | **Do not exist.** Analytics today = sales/traffic, not staff hours or task reports. |

---

## 1. Save as draft for offline / manual orders

### What I understand you want (confirmed)

On the **same** Key in offline order form (`StudioManualOrderForm`), beside **Create order**, add **Save as draft**.

- **Same questions / fields** as Create order — no separate shorter draft form.
- **Save as draft** stores the order on the Orders page as a **draft**.
- It must **not** run Create-order side effects (no “order placed” activation path).

### UI

```
[ Save as draft ]   [ Create order ]
```

Same form body (client, source, kind, status field, fulfillment, lines, paid amount, notes, notify toggle, etc.).

### Behaviour

| Button | What it does | What it does **not** do |
|--------|----------------|-------------------------|
| **Create order** | Current behaviour unchanged: live order, chosen status, optional payment row, optional client notify/email, production seed when status warrants it, navigate to order detail, refresh list | — |
| **Save as draft** | Persist order with status **`draft`**, same payload fields the form already collects, show on Orders list, **Draft** filter | Client order emails / notify; treating it as a confirmed/live pipeline order; production open/seed; balance-due / “new order” activation flows that Create order triggers |

Validation: use the **same required-field checks** as Create order (same questions). If Create would refuse empty client/lines, Draft refuses the same way — only the post-save activation differs.

### After save as draft

| Item | Behaviour |
|------|-----------|
| Orders list | Row appears with **Draft** badge |
| Filter | New pill: **Draft** |
| Open draft | Staff can open it and later **Create / publish** (promote out of draft via status change or a “Create order” action on the draft) — exact promote UX can mirror Create order once |
| Clients | Drafts are **staff-only** (not in Account → Orders) |
| Stats | Drafts excluded from production / balance-due headline stats |

### Data / API

- Add order status **`draft`**.
- Manual create endpoint accepts `status: "draft"` (or a `saveAsDraft: true` flag).
- When `draft`: skip mail, skip production seed, skip “activated order” notifications; still save lines/notes/source/paid fields as entered (paid on a draft can be stored but should not fire settlement emails — confirm on implement: safest is store paid_kobo only without payment emails until published).

### Assumptions (defaults unless you object)

1. Draft is an **order status** on the real `orders` table.
2. Same form validation as Create order.
3. Create order button behaviour stays exactly as today.

---

## 2. Back button on order details

### What I understand you want

On `/studio/orders/:id`, a clear **Back** control that returns to the orders list (or previous page).

### Proposed behaviour

- Add a **Back** control in the order detail header (e.g. chevron + “Back to orders”).
- Primary target: `/studio/orders` (stable and predictable).
- Optionally also keep the existing “All orders” pill, or replace it with Back to avoid duplication — **proposal: Back becomes the main control; keep “All orders” only if you prefer both.**

### Effort

Small, frontend-only (`StudioOrderDetail.tsx`).

---

## 3. Fix attendance “Sign in required”

### What I understand you want

Staff using Attendance (Studio or Atelier) should be able to clock in/out without seeing the error **“Sign in required.”**

### Likely cause (from code today)

`db.attendance.list()` and `db.attendance.clock()` call `requireUser()`, which throws **`Sign in required.`** when the local session user is missing — even in HTTP mode after a successful API call:

```ts
// client.ts attendance.clock (HTTP path)
await httpAttendance.clock(type, note);
return { userId: requireUser().id, ... }; // throws if session empty
```

Other likely contributors:

- Session / token expired while the shell still shows the page
- Attendance nav visible but session not fully hydrated
- Floor roles hitting attendance without a valid studio/atelier session

### Proposed fix

1. Harden attendance client paths: if HTTP mode, rely on API auth; map 401 to a clear “Session expired — sign in again” and redirect to the correct login (`/studio/login` or `/atelier` login path).
2. Do not call `requireUser()` after a successful HTTP punch solely to build a return object — use `useSession().user` / stored session safely.
3. Ensure Attendance pages gate on session like other studio pages (show login redirect instead of a toast with “Sign in required”).
4. Verify RBAC: roles with `attendance` in nav can clock; clients cannot.
5. Reproduce on Studio + Atelier attendance and Atelier bench clock toggle.

### Success criteria

Signed-in staff with attendance access can clock in/out; unsigned users are redirected to login, not stuck with a cryptic toast.

---

## 4. Geotagged clock in / clock out + two sites + super-admin analytics & ranking

### What I understand you want

1. The house has **two physical locations**:
   - **Workstation**
   - **Studio**
2. Each has its own **latitude / longitude**, editable by **super admin** in **Settings**.
3. During **staff onboarding (hire / add staff)**, each employee is **assigned to one location** (Workstation or Studio).
4. Clock **in** / clock **out** capture the staff member’s live GPS and are checked against **their assigned site** (and recorded as geotagged punches).
5. **Super admin** gets **comprehensive attendance analytics + ranking** (hours, presence, geo validity, by site and overall).

### Confirmed (from you)

- Two sites, not one HQ pin.
- Site coords live in **super-admin Settings** and can be edited anytime.
- Staff site is chosen at **onboarding** (and should remain editable later on the staff profile if someone moves sites — proposed default: yes).

### Proposed house settings (super admin)

In `StudioSettings` (principal-only), add a **Work sites / attendance geofence** card:

| Field | Site A — Workstation | Site B — Studio |
|-------|----------------------|-----------------|
| Display name | e.g. “Workstation” (editable label optional) | e.g. “Studio” |
| Latitude | decimal | decimal |
| Longitude | decimal | decimal |
| Allowed radius (m) | **100m** (confirmed; same for both sites unless changed later in Settings) | **100m** |

Stored on house `settings` (or a small `work_sites` table). Proposal for settings JSON / columns:

```text
sites: {
  workstation: { label, lat, lng, radiusM: 100 },
  studio:      { label, lat, lng, radiusM: 100 }
}
```

Only **super_admin** can edit site coordinates (and radius if exposed). Default radius = **100 metres** for both sites.

### Proposed staff onboarding assignment

On **Add staff / hire** (`StudioPeople`):

- Required field: **Work site** → `workstation` | `studio`
- Stored on the user (`users.work_site` or equivalent)
- Shown on staff list and attendance analytics
- Super admin (and optionally manager) can **change site later** on Manage staff

Existing staff without a site: on first attendance use after deploy, force assign in People, or default one site until set (prefer **required on hire + migration prompt for existing**).

### Proposed punch rules (geofence)

| Step | Behaviour |
|------|-----------|
| 1 | Staff taps Clock in / out |
| 2 | Browser requests GPS (`lat`, `lng`, `accuracy`) |
| 3 | Server loads staff’s **assigned site** coords from settings |
| 4 | Compute distance (Haversine) from punch → assigned site pin |
| 5 | If distance ≤ **100m** (site `radiusM`) → accept punch; store coords + `within_geofence: true` + `site` |
| 6 | If outside radius → **reject** with clear message (“You must be within 100m of Workstation / Studio to clock in”) |
| 7 | If GPS denied / unavailable → **reject** — **GPS is required** (confirmed) |

Staff do **not** pick the site at punch time — the site comes from their onboarding assignment. (Optional later: allow temporary “other site” with manager override.)

### Proposed staff experience

| Feature | Detail |
|---------|--------|
| Clock in / out | Existing buttons, enhanced with GPS + geofence |
| Assigned site shown | e.g. “Your site: Studio” on attendance page |
| Geotag | Live device lat/lng + accuracy **required** on every punch |
| Permission denied | **Block** punch and explain how to enable location |
| Per-staff view | Own punches + distance/within-fence flag |
| Module | `/studio/attendance` + `/atelier/attendance` |

### Proposed data model

**Settings / sites** — as above.

**`users`**

| Column | Purpose |
|--------|---------|
| `work_site` | `workstation` \| `studio` (nullable until backfilled) |

**`attendance`** (extend)

| Column | Purpose |
|--------|---------|
| `lat` / `lng` | Punch coordinates |
| `accuracy_m` | GPS accuracy |
| `geo_status` | `captured` / `denied` / `unavailable` |
| `work_site` | Site used for the check (staff’s assigned site at punch time) |
| `distance_m` | Distance from site pin |
| `within_geofence` | boolean |

API:

- `POST /v1/studio/attendance` → `{ type, lat, lng, accuracyM? }`
- Settings GET/PATCH include both site coords (super_admin write)
- Hire / people PATCH include `workSite`

### Proposed attendance analytics & ranking

Visible to **`super_admin` and `manager`** (confirmed):

| Metric / view | Description |
|---------------|-------------|
| Hours worked | In→out pairs per day / week, **filterable by site** |
| Present today | Who is clocked in, by Workstation vs Studio |
| Geofence health | % punches inside 100m fence; outside attempts (if logged) |
| Ranking | Leaderboard: hours, days present, geofence compliance |
| Filters | Date range, **site**, role, individual staff |

**v1 ranking:** completed hours + valid in/out days + geofence compliance.

---

## 5. Daily reporting module → weekly payout

### What I understand you want

Employees file a **daily production count**: number inputs for how many units of each garment type they completed that day. Those counts feed **weekly payout** (piece-rate style), alongside attendance.

This is **not** primarily a free-text diary — it is a **quantity form**.

### Confirmed garment catalogue (daily report lines)

Grouped for UX; each row is an integer quantity (default `0`):

**Tops / shirts / suits / waistcoat / street**

| Key (slug) | Label |
|------------|--------|
| `eshiki_top` | Eshiki Top |
| `casual_top` | Casual Top |
| `vintage_shirt` | Vintage Shirt |
| `office_shirt` | Office shirt |
| `safari_suits` | Safari suits |
| `one_button_suits` | 1 button suits |
| `double_breasted_suits` | Double Breasted suits |
| `waistcoat` | Waistcoat |
| `armless_street_wear_top` | Armless street wear (top) |

**Pants / shorts**

| Key (slug) | Label |
|------------|--------|
| `kaftan_pants` | Kaftan Pants |
| `office_pants` | Office pants |
| `two_inch_band_pant_joggers` | 2” band pant/ joggers |
| `cargo_pants` | Cargo pants |
| `short_joggers` | Short jogers |
| `short_cargo` | Short cargo |

**Agbada / caps**

| Key (slug) | Label |
|------------|--------|
| `agbada` | Agbada |
| `reg_crafted_cap` | Reg crafted Cap |
| `embroidered_knitted_cap` | Embroidered/ knitted cap |
| `doggys_cap` | Doggy’s Cap |
| `awolowo_cap` | Awolowo cap |

Catalogue is **house-configurable** later if styles are added; v1 ships with this fixed list (editable in Settings or a small admin table — proposal: seed table `production_item_types` so you can add styles without a code deploy).

### Proposed employee experience

| Item | Detail |
|------|--------|
| Entry point | Nav: **Daily report** (Studio + Atelier for floor roles that produce) |
| Form | Date (default today) + **number input per garment type** above |
| Rules | Non-negative integers only; at least one qty > 0 to submit (or allow all-zero “no production” day — see §7) |
| Optional | Short notes field (optional, not required) |
| Submit | One report per staff per calendar day; editable until week locked |
| History | Own past days with totals |

### Proposed manager / super-admin review experience

| Item | Detail |
|------|--------|
| Audience | **`super_admin` and `manager`** (aligned with attendance analytics) |
| Who files | **All staff** (confirmed) — anyone with a house login that uses attendance / daily report nav |
| Week selector | Mon–Sun house week (default proposal) |
| Worksheet | Per staff: attendance hours + **piece counts by type** (totals). **No automatic ₦ pay from garment rates** — staff are **not paid uniformly** (confirmed); payout stays a **human decision** using this worksheet as evidence |
| Site filter | Filter by Workstation / Studio |
| Ranking | Units produced, days reported, attendance hours, report completeness |
| Export | CSV / printable summary for the person who calculates pay offline |
| Approve week | Optional lock so counts cannot change after the week is closed |

### Proposed data model

**`production_item_types`** (seeded with the catalogue above)

| Field | Notes |
|-------|-------|
| `id` / `slug` | Stable key |
| `label` | Display name |
| `sort_order` | Form order |
| `active` | Soft-hide retired styles |

**`daily_reports`**

| Field | Notes |
|-------|-------|
| `id`, `user_id`, `work_date` | Unique `(user_id, work_date)` |
| `notes` | Optional text |
| `created_at`, `updated_at` | Audit |

**`daily_report_lines`**

| Field | Notes |
|-------|-------|
| `report_id`, `item_type_id` | FK |
| `qty` | Integer ≥ 0 |

**No `piece_rates` table in v1** — you confirmed staff are **not paid uniformly**, so the app will **not** invent a ₦ amount per garment.

**`payout_weeks`** (optional v1 — evidence pack, not auto-pay)

| Field | Notes |
|-------|-------|
| `week_start`, `status` | `open` / `locked` |
| Snapshot | per user: hours, piece totals by type, notes — **no computed salary** |

### How this supports weekly payout (revised)

The module is a **production + attendance evidence pack**, not an automatic payroll calculator:

1. **All staff** file daily piece counts.
2. Attendance (geofenced) proves they were on site.
3. Manager / super admin open the weekly worksheet: hours + units by garment type.
4. **You decide pay outside the uniform formula** (different deals per person).
5. Optional: mark week locked / “reviewed” after you’ve paid; optional free-text **admin note** per staff (e.g. “paid ₦X cash”) — only if you want that later.

---

## 6. Build phases

| Phase | Name | Scope | Status |
|-------|------|--------|--------|
| **A** | Order detail Back | Back control on `/studio/orders/:id` → `/studio/orders` | **Done** |
| **B** | Attendance sign-in fix | Fix “Sign in required” on clock in/out (HTTP session vs local `requireUser`) | **Done** |
| **C** | Draft offline orders | Same form + **Save as draft** beside Create; Draft filter on Orders; no Create side effects | **Done** |
| **D** | Two work sites | Settings lat/lng for Workstation + Studio (100m); `work_site` on staff hire | **Done** |
| **E** | Geotagged clock | GPS required; geofence vs assigned site; store coords on punch | **Done** |
| **F** | Attendance analytics | Manager + super-admin hours, ranking, by site | **Done** |
| **G** | Daily piece reports | All staff; number inputs for garment catalogue | **Done** |
| **H** | Weekly review worksheet | Hours + piece counts evidence pack (no auto ₦ rates) | **Done** |

### Phase detail

**Phase A — Back button**  
Add a clear Back control on studio order detail that returns to the orders list.

**Phase B — Attendance auth**  
Clock in/out must use the API session (`readSession()`), not only the local demo user store, so live staff no longer see “Sign in required.”

**Phase C — Draft orders**  
Same Key in offline order fields; **Save as draft** saves `status=draft` without emails, production seed, stock decrement, or payment activation side effects. Drafts appear on Orders with a **Draft** filter.

**Phases D–H** — Sites, geo attendance, analytics, daily reports, weekly worksheet (see §§4–5).

---

## 7. Open questions for you

Please answer these so implementation matches the house, not guesses:

### Draft offline orders

1. ~~Separate draft fields / min requirements?~~ **Answered:** **Same form questions** as Key in offline order. Add **Save as draft** beside **Create order**. Draft saves the order but does **not** run Create-order activation (emails / production / live pipeline side effects).

### Attendance geo & sites

4. ~~GPS required?~~ **Answered:** **Yes — GPS required.**
5. ~~Sites?~~ **Answered:** **Workstation** + **Studio**; Settings coords; assigned at onboarding.
6. ~~Radius?~~ **Answered:** **100m.**
7. ~~Analytics audience?~~ **Answered:** **Manager and super-admin.**
8. If staff are at the **other** site for a day, manager **override** vs must change `work_site` first?
9. Site labels fixed as “Workstation” / “Studio”, or editable display names?

### Daily reports & payout

10. ~~Report content?~~ **Answered:** Number inputs for the garment catalogue.
11. ~~Who files?~~ **Answered:** **All staff.**
12. ~~₦ per garment / uniform pay?~~ **Answered:** **Do not build per-garment pay amounts** — staff are **not paid uniformly**; worksheet is evidence only.
13. Week definition: Monday–Sunday? *(default: yes)*
14. Optional: mark week “reviewed / locked” in-app after you’ve paid offline? *(default: yes, lock only — no payment method)*
15. Missing daily report on a clocked-in day: flag as **warning** on the worksheet? *(default: yes)*
16. Allow submit with **all zeros** (no production that day)? *(default: yes, with a confirm)*

---

## 8. Out of scope (unless you say otherwise)

- Automatic bank transfer / Paystack payout to staff
- Biometric / face clock-in
- Mobile native app (browser geolocation on phone is enough for v1)
- Changing client checkout or online order drafts
- Retroactive rewrite of historical attendance without geo (legacy rows stay null coords)
- More than two sites (v1 is Workstation + Studio only; adding a third later would reuse the same pattern)

---

## Confirmation checklist

- [x] Spec confirmed enough to build  
- [x] Phases A–C — **implemented**  
- [x] Phases D–H — **implemented**

---

*File: `docs/STAFF_ORDERS_ATTENDANCE_SPEC.md`*
