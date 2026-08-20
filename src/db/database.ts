export { db, subscribe } from "./client";
export type { ProductFilter, PlaceOrderPayload } from "./client";
export * from "./types";

/**
 * C0 note: when VITE_API_URL is set and settings.demoMode is false,
 * the demo banner, role-switcher, and password chips are hidden automatically
 * because:
 *   - Layout.tsx checks `settings.demoMode` (loaded from /v1/settings)
 *   - DemoRoleSwitcher checks `settings.demoMode`
 *   - Login chips use `db.auth.demoAccounts()` — show regardless (still useful for dev)
 *
 * To fully disable demo mode in production:
 *   1. Set demoMode=false in Postgres settings table.
 *   2. Remove DEMO_ACCOUNTS from the seed or guard them behind NODE_ENV.
 *   3. Set COOKIE_SECURE=true, FRONTEND_ORIGIN=https://eunikclothings.com.
 */
