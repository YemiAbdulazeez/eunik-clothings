# EUNIK defence in depth (Phase 4)

Operational controls that sit outside application code. Complete with hosting + ops owners.

## 4.1 CSP + HSTS (hosting)

**Frontend (Vercel / Netlify / nginx):**

```
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
Content-Security-Policy:
  default-src 'self';
  script-src 'self' https://js.paystack.co https://challenges.cloudflare.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https://res.cloudinary.com;
  connect-src 'self' https://api.paystack.co https://YOUR_API_HOST;
  frame-src https://js.paystack.co https://challenges.cloudflare.com;
  base-uri 'self';
  form-action 'self';
```

API already uses Helmet. Prefer `SameSite=Lax` cookies with same-site deploy (FE + API sibling domains or reverse proxy).

## 4.2 WAF / bot protection

- Put Cloudflare (or equivalent) in front of the API origin.
- Rate-limit `/v1/auth/*` and public POSTs at the edge in addition to Express limiters.
- Challenge anonymous traffic to `/v1/appointments`, `/v1/tickets`, `/v1/newsletter`, `/v1/leads`.
- App supports honeypot fields (`website`) and optional Turnstile via `TURNSTILE_SECRET_KEY` + `captchaToken`.

## 4.3 Dependencies

- Dependabot configured in both repos (weekly npm).
- CI runs `npm audit --audit-level=high`.
- Pin major versions in package.json; review Dependabot PRs weekly.

## 4.4 Penetration test checklist

After Phase 0–2:

- [ ] Client cannot GET `/v1/studio/overview`
- [ ] Client cannot pay another user’s `orderId`
- [ ] Webhook without valid HMAC rejected; replay does not double-credit
- [ ] Upload without auth → 401; client cannot `folder=looks`
- [ ] Hire cannot create `super_admin`
- [ ] Open redirect: `?next=//evil.com` lands on `/account`
- [ ] Register / forgot throttled after limiter max

## 4.5 Postgres backup / restore drill

| Item | Target |
|------|--------|
| RPO | ≤ 24h (Aiven automated backups) |
| RTO | ≤ 4h |
| Drill | Quarterly: restore snapshot to staging, run `npm run migrate` / SQL apply, smoke `/v1/health` + login |

Document restore steps in your Aiven console runbook (project → Backups → Restore).

## 4.6 Paystack webhook secret rotation

1. Generate new secret in Paystack dashboard (Settings → API Keys & Webhooks).
2. Set `PAYSTACK_WEBHOOK_SECRET` on API host; deploy / restart (boot fails in prod if empty).
3. Update webhook URL if host changed; send test event.
4. Confirm `payments` settle once (idempotent settlement).
5. Retire old secret only after successful test.

## 4.7 Rich CMS HTML

Do **not** use `dangerouslySetInnerHTML` until:

1. Server-side sanitize with DOMPurify (or equivalent) on write, and
2. CSP `script-src` does not allow inline from CMS content.

Plain text / Markdown → React text nodes is the current safe default.
