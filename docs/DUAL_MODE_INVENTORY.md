# Dual-mode inventory (`db` facade)

When `VITE_API_URL` is set, `persist.mutate` **throws** (fail-closed). Methods below must use HTTP or surface a clear error.

| Namespace | Method | HTTP | Notes |
|-----------|--------|------|-------|
| auth | login/register/logout/me/changePassword/forgot | ✅ | Cookie session |
| auth | switchDemoUser / updateMe | ❌ throw | Demo switch blocked in API mode |
| products | list/get/featured | ✅ | |
| products | create/update/remove | throw via mutate | Studio product CRUD not yet wired |
| categories | list/get/counts | ✅ | |
| categories | create/update/remove | throw via mutate | |
| cart | get/add/updateQty/remove | ✅ | PATCH qty + DELETE line |
| cart | applyCoupon | throw | Use checkout coupon |
| checkout | placeOrder | ✅ | |
| payments | list/init/submit/approve/reject | ✅ | completePaystack demo-only |
| orders | list/get/updateStatus/track | ✅ | |
| orders | reorder | throw | Explicit message |
| customDesigns | create/listMine/listAll | ✅ | `/custom-requests` |
| quotations | create/accept/revise/reject/list | ✅ | |
| production | listBoard/moveStage | ✅ | |
| appointments | create/list/setStatus | ✅ | Public + studio |
| people | staff/hire/setNav | ✅ | |
| content | homepage/lookbook/journal/events writes | ✅ | |
| newsletter | subscribe | ✅ | |
| leads | create/list/claim | ✅ | |
| settings/notifications/audit/overview/traffic | * | ✅ | |

**Exit (2.2–2.4):** Production builds and API mode do not persist `eunik-demo-db` to localStorage.
