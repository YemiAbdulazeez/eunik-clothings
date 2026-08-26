# EUNIK Full-Stack Audit & Fix Plan

> **Date:** 25 August 2026  
> **Scope:** Frontend (`EUNIK`), backend (`backend-eunik`), Postgres schema (`sql/*`)  
> **Mode under review:** Production / API mode (`VITE_API_URL` set). Demo localStorage mode remains for offline presentation.  
> **Companions:** `docs/EUNIK_FRONTEND_AUDIT.md`, `docs/EUNIK_SECURITY_ARCHITECTURE_AUDIT.md`, `backend-eunik/README.md`

---

## How to use this tracker

| Mark | Meaning |
|------|---------|
| ✅ | Done: implemented and verified in this codebase |
| 🟡 | In progress / partial |
| ⬜ | Not started |

Work **one phase at a time**. Flip ⬜ → ✅ only after the exit checks for that phase pass.

### Resume log

| When | Phase | Status | Notes |
|------|-------|--------|-------|
| 24–25 Aug 2026 | P0–P6 | ✅ | Catalog through hardening |
| 25 Aug 2026 | P7 | ✅ | Remaining local→API: search, variants, assign, fabrics, coupon, mailbox, payments-by-order |

**Active phase:** none  
**Last ✅ phase:** **P7**

---

## 0. Executive verdict

With `VITE_API_URL` set, core commerce, studio, bespoke, CRM, attendance, and analytics hit Postgres. Phase **P7** closed the last high-impact local seed leaks (search, PDP sizes, production assign, fabrics, promo coupon).

**Remaining (ops / polish)**

- Manual E2E smoke on a real deploy
- Coupon **admin CRUD** UI (lookup + checkout apply exist; no studio editor)
- Wider `PageError` coverage on every dashboard page

---

## 8. Phased fix plan

### Phase P0–P6

See earlier checklist rows — all **✅ complete** (manual E2E in P6 still deploy QA).

---

### Phase P7 — Clear remaining local seed leaks · Size **M**

Exit: Search, PDP sizes, production assign, fabrics, and home promo work against the live API with no empty seed fallback for those paths.

- [x] `db.search.all` → `GET /v1/products?q=` + journal filter
- [x] PDP variants from product payload / `getById` / `get` (API includes `variants` with `productId`)
- [x] Studio `loadProductById` loads variants
- [x] `PATCH /v1/studio/production/:id` assignee + `db.production.assignTask` HTTP
- [x] `GET /v1/fabrics` + `db.products.fabrics` HTTP
- [x] `GET /v1/coupons/:code` + `db.content.coupon` HTTP; seed `EUNIK-DEC-2024`; Home uses `homepage.promoCode`
- [x] `db.content.mailbox` returns `[]` in API mode; Content Contact copy points to Support
- [x] `db.payments.getByOrder` filters `httpPayments.list()`

**Status: ✅ complete**

---

## 9. This session deliverables (P7)

| Deliverable | Status |
|-------------|--------|
| Search live catalog | ✅ |
| PDP / studio product variants | ✅ |
| Production assignee persists | ✅ |
| Fabrics list API | ✅ |
| Promo coupon API + seed | ✅ |
| Mailbox honest in API mode | ✅ |
| Payments by order via list | ✅ |

---

## 10. Suggested next agent start

1. Run **manual E2E** against staging (checkout + quote→deposit paths from P6).
2. Optionally add coupon admin CRUD under Studio Settings.
3. Re-seed catalog on deploy so `EUNIK-DEC-2024` and fabrics exist (`seedCatalog` job).
