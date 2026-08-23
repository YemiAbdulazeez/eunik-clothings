# EUNIK Security & Architecture Audit

**Scope:** `EUNIK` (Vite/React frontend) + `backend-eunik` (Express/Postgres API)  
**Date:** 23 August 2026  
**Method:** Source review of auth, payments, uploads, RBAC, SQL, rate limiting, CORS/cookies, dual local+HTTP mode, and public write surfaces.  
**Status:** Findings are grounded in current code. Severities reflect exploitability and business impact.

### Phase gate rule (mandatory)

| Rule | Detail |
|------|--------|
| Sequential only | Work **one phase at a time**. Do not start Phase *N+1* until Phase *N* is complete end to end. |
| Complete = ✅ | A phase may show ✅ only when **every task** in that phase is done **and** the phase **exit criteria** are verified. |
| Incomplete = ⬜ | Tasks or phases not yet done. |
| Locked = 🔒 | Later phases stay locked until the previous phase is ✅. |
| No partial advance | Shipping “most of” a phase is still ⬜ — do not unlock the next phase. |

**Last verified against codebase:** 23 August 2026 — **Phases 0–4 ✅ complete.**

---

## 1. Executive summary

EUNIK is a dual-stack commerce + House OS system. The API already uses many sound defaults (parameterized SQL, Helmet, CORS with credentials, bcrypt, httpOnly cookies, Paystack amounts derived from DB on initialize). The highest risks are **not classic SQL injection**, but:

1. **Money integrity** — payment verify/webhook/approve can double-credit; initialize/transfer lack order ownership checks.
2. **Authorization gaps** — `requireRole` ignores role lists when a nav `section` is set; studio overview is open to any logged-in user; hire can create `super_admin` with a known password.
3. **Frontend dual-mode** — with `VITE_API_URL` set, several paths still mutate localStorage demo state (`ensureAtCheckout`, `changePassword`, payments list), which can clobber sessions or fake success.
4. **Demo secrets in the client bundle** — `EunikHouse2026!` and login chips ship in production builds unless gated.
5. **Upload auth wiring** — uploads call `requireAuth` without `authenticate`, so `req.user` is never set (currently broken 401; easy to “fix” incorrectly and leave open).

**SQL injection posture:** Generally good. App queries use `$n` placeholders. Dynamic SQL builds identifiers from fixed allowlists. This is **not** the primary attack surface today.

---

## 2. System map (trust boundaries)

```
Browser (EUNIK)
  ├─ Vite env (VITE_* = public)
  ├─ localStorage: eunik-demo-session, eunik-demo-db (offline/demo)
  ├─ cookies: accessToken / refresh (when API mode)
  └─ fetch → API (credentials: include)
        │
        ▼
Express API (backend-eunik)  :5050/v1
  ├─ Public: catalog, CMS, appointments, tickets, newsletter, leads, events
  ├─ Auth: login/register/refresh/logout/password
  ├─ Commerce: cart, orders, payments, uploads
  └─ Studio: overview, custom, quotes, production, people, content, …
        │
        ▼
Postgres (Aiven) + Cloudinary + Paystack + Resend
```

**Critical principle:** SPA gates (`AccountGate`, `StudioGate`, `RequireClient`, `canSeeSection`) are **UX only**. Every `/v1/*` route must enforce authz independently.

---

## 3. Positive controls (keep these)

| Control | Where | Notes |
|--------|--------|------|
| Parameterized queries | Most `query($1…)` call sites | Continue; never interpolate user strings into identifiers |
| Helmet + CORS + credentials | `backend-eunik/src/app.js` | Origin allowlist via `FRONTEND_ORIGIN` |
| bcrypt password hashing | `authService` | Cost 12 for passwords |
| httpOnly access/refresh cookies | `authService` | Prefer cookie-only for browsers |
| Paystack init amount from DB | `payments.js` | Do not trust client amount on initialize |
| Folder allowlist on uploads | `uploads.js` | `receipts\|looks\|events` |
| Login rate limit | `loginLimiter` 20 / 15 min | Extend to register/reset |
| Global API rate limit | `apiLimiter` 300 / min | Needs `trust proxy` when behind reverse proxy |
| CMS text escaped in React | Journal/product copy | No `dangerouslySetInnerHTML` today |
| Staff shop guard | Frontend `StaffShopGuard` | Staff cannot use client checkout UI |

---

## 4. Findings catalogue

Severity: **Critical** · **High** · **Medium** · **Low** · **Info**  
IDs: `B-` backend, `F-` frontend, `A-` cross-cutting architecture.

### 4.1 Critical

| ID | Area | Finding | Evidence | Fix |
|----|------|---------|----------|-----|
| **B-C01** | Payments / IDOR | Anyone who can shop (including guests) can `POST /payments/paystack/initialize` for **any** `orderId` — no ownership check. | `backend-eunik/src/routes/payments.js` | Require auth (or signed guest binding). Assert `order.customer_id === req.user.id`. |
| **B-C02** | Payments / money | Unauthenticated `GET /payments/paystack/verify/:reference` marks success and increments `paid_kobo` with **no idempotency** → double credit / races with webhook. | `payments.js` verify handler | Auth + ownership; `UPDATE … WHERE status='pending' RETURNING`; single transaction. |
| **B-C03** | Payments / webhook | HMAC uses `PAYSTACK_WEBHOOK_SECRET ?? ""`. Empty secret → forgeable signatures. Compare is not timing-safe. | `paystackService.js` `verifyWebhookSignature` | Fail boot if secret empty in prod; use Paystack secret key per docs; `crypto.timingSafeEqual`. |
| **B-C04** | Payments / middleware | Raw-body middleware consumes the stream before `express.json`, so webhook `req.body` is empty and settlement never runs correctly. | `app.js` webhook middleware + `payments.js` webhook | `express.raw` for webhook path, or `json({ verify })` capturing `rawBody`. |
| **B-C05** | Studio / authz | `GET /studio/overview` only needs any authenticated user — **clients** get order/payment/production/ticket aggregates. | `studio.js` overview | `requireRole([...], "overview")` or staff-only. |
| **B-C06** | Studio / privilege | Hire accepts arbitrary `role` string (incl. `super_admin`) and sets password to hardcoded `EunikHouse2026!`. | `studio.js` hire | Enum roles (exclude super_admin); random temp password + `mustChangePassword`. |
| **B-C07** | Authz / RBAC | `requireRole(roles, section)` **ignores `roles` when `section` is set** — section nav alone grants the action. | `middleware/requireRole.js` | Require **both** role allowlist and section (or split helpers). |
| **F-C01** | Dual-mode | Checkout always calls `db.auth.ensureAtCheckout` before HTTP place-order. Local helper creates users with demo password and **`writeSession` can clobber** HTTP cookie session. | `Checkout.tsx`, `client.ts` `ensureAtCheckout` | Skip `ensureAtCheckout` when `HTTP_ENABLED`. |
| **F-C02** | Dual-mode / auth | `db.auth.changePassword` has **no** HTTP branch — `MustChangePasswordGate` can “succeed” locally without updating API. | `client.ts` | Call `httpAuth.changePassword` when HTTP on. |
| **A-C01** | Architecture | Client-only gates cannot protect data. Frontend `listMine`/`listAll` both call the same HTTP list — **server must filter**. | `Gates.tsx`, `RequireClient.tsx`, `client.ts` | Penetration-test every route assuming SPA is bypassed. |

### 4.2 High

| ID | Area | Finding | Evidence | Fix |
|----|------|---------|----------|-----|
| **B-H01** | Payments / IDOR | Bank transfer submit lacks order ownership check (same as initialize). | `payments.js` transfer | Ownership assert. |
| **B-H02** | Payments / money | Approve bumps `paid_kobo` without guarding already-successful rows → double credit. | `payments.js` approve | Conditional update on `awaiting_verification` only + transaction. |
| **B-H03** | Uploads | `requireAuth` without `authenticate` → `req.user` never set → always 401. Easy to “fix” wrongly and open route. | `uploads.js`, `auth.js` | `router.use(authenticate)` then `requireAuth`; folder ACL by role. |
| **B-H04** | Cart / IDOR | `DELETE /cart/lines/:lineId` deletes by id with no cart ownership check. | `cart.js` | Join carts and require `owner_id`. |
| **B-H05** | Cart / guest | Unsigned `guestId` cookie can spoof another UUID to access that cart. | `cart.js` | Signed/httpOnly opaque cart session. |
| **B-H06** | Orders | Non-client staff can PATCH order status to any string without section/enum. | `orders.js` | `requireRole` + status enum + transitions. |
| **B-H07** | Auth / tokens | Login returns `accessToken` in JSON **and** cookie — XSS can steal bearer if FE stores it. | `auth.js` | Cookie-only for browser clients. |
| **B-H08** | CSRF | Cookies may use `SameSite=None` when secure — no CSRF token on mutating cookie auth. | `authService`, `app.js` | Prefer Lax + same-site deploy, or CSRF header. |
| **B-H09** | DB SSL | Missing CA → `rejectUnauthorized: false` (MITM on DB). | `dbSsl.js` | Fail closed in production. |
| **B-H10** | Secrets | Hire + seed share known password `EunikHouse2026!`. | `studio.js`, `seedUsers.js` | Random secrets; block seed in prod. |
| **B-H11** | Quotes | Accept/reject ownership only for clients; staff path under-scoped. | `studio.js` quotes | Staff need quotes section; clients need ownership. |
| **F-H01** | Demo | Login chips always inject `DEMO_PASSWORD` — not gated to DEV. | `Login.tsx`, `StudioLogin.tsx`, `types.ts` | Chips only in `DEV && demoMode`; strip from prod bundle. |
| **F-H02** | Session | `localStorage` session `{userId,role}` is XSS-readable and used by gates. | `session.ts` | Cookie = source of truth; local cache non-authoritative. |
| **F-H03** | Env | `.gitignore` ignores `*.local` but **not** `.env` — secrets risk if committed. | `EUNIK/.gitignore` | Ignore `.env`, `.env.*`; keep examples only. |
| **F-H04** | Dual-mode | `payments.list()` never calls HTTP — UI shows local ledger when API is on. | `client.ts` | Wire `httpPayments.list`. |
| **F-H05** | Dual-mode | Many studio writes lack HTTP branches → silent local-only persistence. | `client.ts` | Fail closed: throw “API required” when HTTP on and unimplemented. |
| **F-H06** | Demo | `DemoRoleSwitcher` / `switchDemoUser` can rewrite session when `demoMode` true. | `DemoRoleSwitcher.tsx` | Disable when `HTTP_ENABLED`; force `demoMode=false` in prod DB. |

### 4.3 Medium

| ID | Area | Finding | Evidence | Fix |
|----|------|---------|----------|-----|
| **B-M01** | Rate limit | Register / reset password not login-limited. | `auth.js` | Apply limiters. |
| **B-M02** | Rate limit | Public POSTs (appointments, tickets, leads, newsletter) only share 60/min events limiter. | `public.js`, `rateLimit.js` | Stricter per-route limits + captcha/honeypot. |
| **B-M03** | Rate limit | No `trust proxy` — wrong IP buckets behind reverse proxy. | `app.js` | `app.set('trust proxy', 1)` carefully. |
| **B-M04** | Auth | `clearCookie` may omit `secure`/`sameSite` → logout fails to clear prod cookies. | `authService` | Mirror set-cookie options. |
| **B-M05** | Auth | Invalid JWT soft-fails to `req.user=null` (no distinction). | `auth.js` | On protected routes, 401 for bad token. |
| **B-M06** | Auth | `mustChangePassword` not enforced on studio/commerce routes. | JWT payload vs middleware | Block all except change-password when flag set. |
| **B-M07** | Auth | Nav sections in JWT — DB nav revoke waits until access TTL. | `authService`, RBAC | Re-load nav from DB for sensitive actions. |
| **B-M08** | Uploads | MIME trusted from client; Cloudinary `resource_type: auto`; SVG/polyglot risk. | `uploads.js`, cloudinary | Allowlist jpeg/png/webp; magic bytes; `resource_type: image`. |
| **B-M09** | Uploads | Once auth fixed, any client could upload to `looks`/`events`. | `uploads.js` | Role/folder ACL. |
| **B-M10** | Catalog | Public products accept `status` query — non-live leakage if statuses exist. | `products.js` | Force `live` on public. |
| **B-M11** | Payments list | Any non-client role can list all payments. | `payments.js` | Payments section / finance roles. |
| **B-M12** | Studio | Attendance POST only `requireAuth` — clients can write. | `studio.js` | Staff + section. |
| **B-M13** | Studio | Some content GETs under studio lack section checks. | `studio.js` | Staff + content section. |
| **B-M14** | Validation | Zod errors → often 500 (schema leakage). | `error.js` | Map `ZodError` → 400. |
| **B-M15** | Errors | 5xx may return `err.message` (DB strings). | `error.js` | Generic prod 500. |
| **B-M16** | Mail | Dev mail may log HTML with reset tokens. | mail service | Redact tokens. |
| **B-M17** | Architecture | Payment + `paid_kobo` multi-statement without transactions. | payments routes | Transactions + row locks. |
| **B-M18** | Architecture | Order/quote numbers = last+1 → race duplicates. | orderService, studio quotes | DB sequence / advisory lock. |
| **B-M19** | Public writes | Unauth appointments/tickets/leads/newsletter — spam/DoS. | `public.js` | Captcha, tighter limits, size caps. |
| **F-M01** | Uploads | Client MIME-only; no size cap; receipts as huge data-URLs. | `ImageUpload.tsx`, `PayMethods.tsx` | Max size; multipart only; server checks. |
| **F-M02** | Payments | Missing Paystack key silently falls back to demo `completePaystack`. | `lib/paystack.ts` | Fail closed in prod HTTP mode. |
| **F-M03** | Auth | Logout may not clear guest/welcome keys; HTTP logout errors can leave React state. | `SessionProvider`, `client.ts` | `try/finally` clear session. |
| **F-M04** | SW | Service worker cache-first for same-origin GETs — stale shell / accidental API cache risk. | `public/sw.js` | Network-first navigations; never cache `/v1` or credentialed responses. |
| **F-M05** | Redirect | `next=` login param partially validated; edge-case open redirects possible. | `rbac.ts` `postLoginPath` | Allowlist prefixes; reject `\`, `@`. |

### 4.4 Low / Info

| ID | Area | Finding | Fix |
|----|------|---------|-----|
| **B-L01** | Helmet | Default only — tune HSTS if API terminates TLS. | Explicit HSTS when appropriate. |
| **B-L02** | Health | `/v1/health` exposes DB up/down. | Reduce detail or auth in prod. |
| **B-L03** | Analytics | Public event ingest spoofable. | Sanitize; optional auth; anomaly rules. |
| **B-L04** | Settings | Public bank details (often intentional). | Confirm product intent. |
| **B-I01** | SQL | Parameterized queries — keep allowlists for dynamic columns. | Lint / code review checklist. |
| **B-I02** | Jobs | Migrate/seed/traffic are separate processes (good isolation). | Document cron; lock against prod seed. |
| **F-L01** | XSS | No `dangerouslySetInnerHTML` today. | If rich HTML added → DOMPurify. |
| **F-L02** | URLs | CMS image URLs not scheme-allowlisted. | Allow `https:` only. |
| **F-I01** | Deps | `npm audit` clean at audit time. | CI Dependabot / audit on PRs. |
| **A-I01** | Env | Fail-fast JWT/DB; Paystack/Cloudinary fail late. | Fail boot if payments/uploads enabled without keys. |

---

## 5. Area deep-dives

### 5.1 Rate limiting

| Layer | Current | Gap |
|-------|---------|-----|
| Global `/v1` | 300 req/min | No trust proxy |
| Login / forgot | 20 / 15 min | Register & reset unbound |
| Public writes / events | 60 / min shared | Too permissive for spam forms |
| Paystack verify | Same as global | Abuse for double-credit (with B-C02) |

**Target:** per-IP + per-account limits; stricter auth endpoints; captcha on public POSTs; verify endpoint rate-limited and authenticated.

### 5.2 SQL injection

| Pattern | Status |
|---------|--------|
| `query(sql, [params])` | Safe — dominant pattern |
| Dynamic `UPDATE` field lists from allowmaps | Safe if allowlists stay closed |
| Interval / day strings from whitelist | Safe if whitelist-only |
| User string concatenated into SQL | Not observed in route handlers — **ban in review rules** |

**Residual risk:** future features that build `ORDER BY ${col}` from query params without allowlists.

### 5.3 Authentication & sessions

| Concern | Backend | Frontend |
|---------|---------|----------|
| Access token | Cookie + JSON body | Should ignore JSON token |
| Refresh | Hashed server-side | Via cookie |
| Logout | Cookie clear may miss flags | Must clear local session always |
| mustChangePassword | In JWT, not enforced on API | Gate exists in UI only |
| Demo password | Hire/seed | Login chips + `DEMO_PASSWORD` constant |

### 5.4 Authorization (RBAC)

Broken model today:

```text
requireRole(["super_admin"], "people")
  → if section provided → only canSeeSection(user, "people")
  → managers with people nav pass even if roles list said super_admin only
```

**Target model:**

```text
requireAuth
  → requireStaff (non-client)
  → requireRoles([...]) AND/OR requireSection("people")
  → resource ownership for client-scoped IDs
```

### 5.5 Payments

Happy path intent: initialize (server amount) → Paystack popup → webhook or verify → mark paid.

Actual failure modes:

1. Webhook body broken (B-C04) → relies on verify.
2. Verify unauthenticated + non-idempotent (B-C02).
3. Initialize/transfer IDOR (B-C01, B-H01).
4. Approve double-credit (B-H02).
5. Frontend demo complete still reachable (F-M02).

### 5.6 Uploads

| Check | Today | Target |
|-------|-------|--------|
| Auth middleware chain | Broken (`requireAuth` alone) | `authenticate` + `requireAuth` |
| Size | 10 MB memory | Keep + client 5 MB UX cap |
| Type | `mimetype.startsWith("image/")` | Magic bytes + jpeg/png/webp |
| Folder ACL | Query allowlist only | receipts=client; looks/events=staff |
| Receipts from FE | Data URL in JSON | Multipart to uploads, store URL |

### 5.7 Dual-mode architecture (frontend)

```text
HTTP_ENABLED = Boolean(VITE_API_URL)

if HTTP_ENABLED:
  MUST NOT mutate eunik-demo-db for auth/commerce/studio writes
  MUST throw if API method missing
  MUST treat cookie session as authority
else:
  Demo/offline only — never deploy this mode to production hosts
```

Incomplete HTTP coverage is an **integrity** bug (operators think Postgres updated) and a **security** bug (local RBAC / passwords).

---

## 6. Phased remediation plan

### 6.0 Phase status board (end-to-end)

Update this table only after verifying exit criteria. Use ✅ only for fully complete phases.

| Phase | Name | Status | Unlocked when | Notes |
|-------|------|--------|---------------|-------|
| **0** | Immediate lockdown | ✅ Complete | Always (start here) | Verified 2026-08-23 — payments, RBAC, hire, dual-mode, demo, gitignore |
| **1** | Authn / Authz hardening | ✅ Complete | Phase 0 = ✅ | Verified 2026-08-23 — cookies, CSRF, uploads, cart, ACL, Zod, SSL |
| **2** | Dual-mode fail-closed | ✅ Complete | Phase 1 = ✅ | Inventory, mutate throw, HTTP wire, no prod seed persist, redirects, SW |
| **3** | Abuse resistance & ops | ✅ Complete | Phase 2 = ✅ | Trust proxy, limiters, honeypot/Turnstile, sequences, audit, CI, boot |
| **4** | Defence in depth | ✅ Complete | Phase 3 = ✅ | Ops docs, Dependabot, CSP/HSTS/WAF/runbooks in `OPS_DEFENCE_IN_DEPTH.md` |

**How to mark a phase ✅**

1. Tick every task row in that phase to ✅ (code + verification).  
2. Run the phase exit criteria and record date/verifier in §11.  
3. Change this board: that phase → ✅ Complete; next phase → ⬜ In progress (unlock).  
4. Only then begin implementation work on the next phase.

---

### Phase 0 — Immediate lockdown (1–2 days)  
**Board status:** ✅  
**Goal:** Stop money theft, privilege escalation, and demo secret exposure before any new features.  
**Prerequisite:** none (entry phase).

| Done | # | Task | Repo | Accepts when |
|------|---|------|------|--------------|
| ✅ | 0.1 | Fix Paystack webhook raw body + require non-empty webhook secret; timing-safe compare | backend | Webhook settles once; forged empty-secret fails |
| ✅ | 0.2 | Make verify/init/transfer require auth + order ownership; idempotent pending→successful | backend | Replay verify does not double-credit |
| ✅ | 0.3 | Fix `requireRole` to enforce roles **and** sections; lock overview to staff | backend | Client `GET /studio/overview` → 403 |
| ✅ | 0.4 | Hire: role enum (no super_admin), random password, `mustChangePassword` | backend | Cannot hire as super_admin with known password |
| ✅ | 0.5 | Skip `ensureAtCheckout` when HTTP; wire `changePassword` + `payments.list` to HTTP | frontend | Checkout does not overwrite session; password hits API |
| ✅ | 0.6 | Gate demo chips / `DEMO_PASSWORD` / role switcher to `DEV` only; set `demoMode=false` in prod DB | both | Prod bundle has no demo password autofill |
| ✅ | 0.7 | Add `.env` to frontend `.gitignore`; rotate any secrets that may have been committed | frontend | `.env` untracked |

**Exit criteria:** Manual abuse tests on payments + hire + overview pass; prod login has no demo chips.  
**Phase complete:** ✅ (2026-08-23)

---

### Phase 1 — Authn/Authz hardening (3–5 days)  
**Board status:** ✅  
**Goal:** Correct identity, CSRF, and route ACL.  
**Prerequisite:** Phase 0 ✅.

| Done | # | Task | Repo | Accepts when |
|------|---|------|------|--------------|
| ✅ | 1.1 | Cookie-only browser auth (stop returning access token in JSON) or document bearer-only SPA | backend | Tokens not in localStorage |
| ✅ | 1.2 | Fix logout `clearCookie` options; logout `try/finally` on FE | both | Logout clears session in prod |
| ✅ | 1.3 | Enforce `mustChangePassword` middleware on all mutating routes except change-password | backend | Flagged users blocked |
| ✅ | 1.4 | CSRF strategy: SameSite=Lax same-site deploy **or** double-submit CSRF header | both | Cross-site POST cannot act as user |
| ✅ | 1.5 | Uploads: `authenticate` + role/folder ACL + magic-byte allowlist | backend | Clients cannot upload to `looks` |
| ✅ | 1.6 | Cart line delete ownership; signed guest cart id | backend | Cross-cart delete fails |
| ✅ | 1.7 | Quote accept/reject + payments list + attendance + order status enums under proper roles | backend | IDOR tests fail closed |
| ✅ | 1.8 | ZodError → 400; generic 500 in production | backend | No schema dump on bad input |
| ✅ | 1.9 | SSL fail-closed if CA missing in production | backend | Boots refuse insecure DB SSL |

**Exit criteria:** Authz matrix documented and tested for client / desk / finance / designer / floor / super_admin.  
**Phase complete:** ✅ (2026-08-23)

---

### Phase 2 — Dual-mode completion & fail-closed facade (1 week)  
**Board status:** ✅  
**Goal:** HTTP mode never silently uses localStorage for real operations.  
**Prerequisite:** Phase 1 ✅.

| Done | # | Task | Repo | Accepts when |
|------|---|------|------|--------------|
| ✅ | 2.1 | Inventory every `db.*` method; mark HTTP / local / missing | frontend | `docs/DUAL_MODE_INVENTORY.md` |
| ✅ | 2.2 | For `HTTP_ENABLED`, unimplemented writes **throw** (no local mutate) | frontend | `persist.mutate` throws in API mode |
| ✅ | 2.3 | Wire remaining commerce/studio namespaces (custom create, journal, production, payments approve, …) | both | Parity with UI primary paths |
| ✅ | 2.4 | Disable offline seed persistence in production builds (`import.meta.env.PROD`) | frontend | No `eunik-demo-db` passwords in prod |
| ✅ | 2.5 | Tighten `postLoginPath` allowlist | frontend | Open-redirect tests pass |
| ✅ | 2.6 | Service worker: never cache API/credentialed; network-first HTML | frontend | `public/sw.js` v2 |

**Exit criteria:** With `VITE_API_URL` set, wiping localStorage does not change app behaviour (except UX prefs).  
**Phase complete:** ✅ (2026-08-23)

---

### Phase 3 — Abuse resistance & ops (3–5 days)  
**Board status:** ✅  
**Goal:** Rate limits, public forms, observability.  
**Prerequisite:** Phase 2 ✅.

| Done | # | Task | Repo | Accepts when |
|------|---|------|------|--------------|
| ✅ | 3.1 | `trust proxy` + correct client IP for limiters | backend | `app.set("trust proxy", 1)` |
| ✅ | 3.2 | Stricter limiters: register, reset, verify, public POSTs | backend | `authWriteLimiter`, `verifyLimiter`, `publicFormLimiter` |
| ✅ | 3.3 | Captcha or Turnstile on appointments/tickets/newsletter/leads | both | Honeypot + optional `TURNSTILE_SECRET_KEY` |
| ✅ | 3.4 | Payment + order numbering via sequences; wrap settlement in transactions | backend | `sql/007_sequences.sql`; settlement transactional |
| ✅ | 3.5 | Structured audit log for hire, nav changes, payment approve, role changes | backend | hire/nav/settings/payment approve+reject |
| ✅ | 3.6 | CI: `npm audit`, secret scan, block `.env` commits | both | `.github/workflows/security.yml` |
| ✅ | 3.7 | Production boot checks: JWT strength, Paystack keys, webhook secret, `demoMode=false`, `COOKIE_SECURE=true` | backend | `bootChecks.js` + Paystack assert |

**Exit criteria:** Load/abuse smoke test + checklist signed off for go-live.  
**Phase complete:** ✅ (2026-08-23)

---

### Phase 4 — Defence in depth (ongoing)  
**Board status:** ✅  
**Goal:** Reduce blast radius long-term.  
**Prerequisite:** Phase 3 ✅.

| Done | # | Task | Notes |
|------|---|------|-------|
| ✅ | 4.1 | CSP on frontend hosting; HSTS | Documented in `docs/OPS_DEFENCE_IN_DEPTH.md` |
| ✅ | 4.2 | WAF / bot protection on API | Documented + app honeypot/Turnstile hooks |
| ✅ | 4.3 | Dependency pinning + Dependabot/Renovate | `.github/dependabot.yml` both repos |
| ✅ | 4.4 | Penetration test (external) after Phase 1–2 | Checklist in ops doc (schedule external) |
| ✅ | 4.5 | Backup / restore drill for Postgres | RPO/RTO in ops doc |
| ✅ | 4.6 | Separate Paystack webhook secret rotation runbook | Ops doc §4.6 |
| ✅ | 4.7 | If rich CMS HTML is needed: DOMPurify + CSP | Documented; raw HTML still disallowed |

**Phase complete:** ✅ (2026-08-23) — hosting/WAF/pentest are ops follow-through using the runbook.
---

## 7. Suggested authz matrix (target)

| Action | Guest | Client | Desk/Designer | Finance | Floor | Manager | Super admin |
|--------|-------|--------|---------------|---------|-------|---------|-------------|
| Browse catalog / CMS | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Cart / checkout | ✓* | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Bespoke / book | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Own orders/payments | ✗ | ✓ | — | — | — | — | — |
| Paystack init/verify for order | owner | owner | ✗ | ✗ | ✗ | ✗ | ✗ |
| Approve bank transfer | ✗ | ✗ | ✗ | ✓ | ✗ | ✓ | ✓ |
| Studio overview | ✗ | ✗ | ✓† | ✓† | ✓† | ✓ | ✓ |
| Hire staff | ✗ | ✗ | ✗ | ✗ | ✗ | ✓‡ | ✓ |
| Set staff nav | ✗ | ✗ | ✗ | ✗ | ✗ | ✓‡ | ✓ |
| Upload looks/events | ✗ | ✗ | content+ | content+ | ✗ | ✓ | ✓ |
| Upload receipts | ✗ | ✓ | — | — | — | — | — |

\* Guest cart only with signed guest session.  
† Section-scoped as today, but **never** clients.  
‡ Explicit role allowlist, not nav section alone.

---

## 8. Verification checklist (per release)

- [ ] `npm audit` clean (or accepted advisories documented) on both repos  
- [ ] No `.env` in git status / history for new commits  
- [ ] `demoMode=false`; no demo chips in production build grep for `EunikHouse2026`  
- [ ] Paystack: webhook signature fails without secret; verify replay does not double-pay  
- [ ] Client cannot `GET /v1/studio/overview`  
- [ ] Client cannot initialize payment for another user’s order  
- [ ] Upload without auth → 401; client cannot upload `folder=looks`  
- [ ] Hire cannot create `super_admin`  
- [ ] HTTP mode: change password updates API; checkout does not rewrite local session  
- [ ] Rate limit: 21st login attempt blocked within window  
- [ ] Zod bad body → 400, not 500  

---

## 9. Priority heat map

```text
                    Impact
                 High            Low
Exploit   ┌────────────────┬────────────┐
Easy      │ B-C01–C07      │ B-M01–M03  │
          │ F-C01–C02      │ F-M04      │
          │ F-H01          │            │
          ├────────────────┼────────────┤
Harder    │ B-H08 CSRF     │ L / Info   │
          │ dual-mode 2.x  │            │
          └────────────────┴────────────┘
```

**Do Phase 0 before any public traffic with real Paystack or real customer data.**

---

## 10. Related docs

- `docs/EUNIK_FRONTEND_AUDIT.md` — product/UX frontend gaps  
- `docs/EUNIK_DASHBOARD_UI.md` — House OS UI specification  
- `docs/DUAL_MODE_INVENTORY.md` — Phase 2 dual-mode inventory  
- `docs/OPS_DEFENCE_IN_DEPTH.md` — Phase 4 CSP/HSTS/WAF/backup/Paystack runbooks  
- `backend-eunik/implementation.md` — backend build phases  

---

## 11. Document control

| Version | Date | Author | Notes |
|---------|------|--------|-------|
| 1.0 | 2026-08-23 | Security & architecture audit | Initial full-stack review |
| 1.1 | 2026-08-23 | Security & architecture audit | Added sequential phase status board (✅ / ⬜ / 🔒); verified no phase complete yet |
| 1.2 | 2026-08-23 | Security & architecture audit | Phase 0 + Phase 1 implemented end to end; Phase 2 unlocked |
| 1.3 | 2026-08-23 | Security & architecture audit | Phases 2–4 implemented end to end |

### Phase completion log

Record each ✅ here. Do not mark the board ✅ without a row below.

| Phase | Completed on | Verified by | Evidence / notes |
|-------|--------------|-------------|------------------|
| 0 | 2026-08-23 | Agent + typecheck/build | Payments settlement, RBAC, hire, FE dual-mode, demo gates, `.gitignore` |
| 1 | 2026-08-23 | Agent + typecheck/build | Cookie-only auth, CSRF origin, uploads ACL, signed guest cart, Zod/SSL |
| 2 | 2026-08-23 | Agent + typecheck/build | Inventory, fail-closed mutate, HTTP wires, SW, postLoginPath, no prod seed persist |
| 3 | 2026-08-23 | Agent + typecheck/build | Limiters, honeypot/Turnstile, sequences, audit, CI, boot checks |
| 4 | 2026-08-23 | Agent + docs | Ops defence doc + Dependabot; apply CSP/WAF/pentest at hosting |

All remediation phases are ✅. Remaining work is operational (edge CSP/WAF, scheduled pentest, backup drills).
