# MotionConnect — Maintenance & Operations Runbook

**Status: LIVE in production since 2026-08-15** (first client-confirmed end-to-end sale).
This is the single source of truth for how the system works *as deployed*. If another
document in this repo contradicts it, this one wins — see [§9 Documentation map](#9-documentation-map).

---

## 1. Architecture (as built)

```
Student device ──▶ MikroTik hotspot (RB5009, vlan30-guest, 192.168.30.1)
                     │  serves hotspot/login.html → redirects with ?mac=&ip=&link-login-only=
                     ▼
              Captive portal (Next.js on Vercel: motionconnect.vercel.app)
                     │  POST /api/payments/initiate  (MAC attached to transaction)
                     ▼
              Hubtel Hosted Checkout (payproxyapi.hubtel.com → pay.hubtel.com)
                     │  student pays; Hubtel POSTs our webhook
                     ▼
              /api/payments/webhook  (token-authenticated, see §3)
                     │  transaction → status=success, mikrotik_synced=false
                     ▼
              Router polls /api/router/sync every 15s (script: mcsync-poll)
                     │  creates hotspot user + auto-login by MAC
                     ▼
              POST /api/router/confirm → mikrotik_synced=true
                     ▼
              Portal polling sees success → shows voucher → student is online
```

Key property: **internet unlock does not depend on the student's browser staying
open.** Once the webhook flips the transaction to `success`, the router provisions
within ~15s regardless of what the student's device does.

## 2. Why Hosted Checkout (and not Direct USSD)

Verified by live probes on 2026-08-14:

| Hubtel host | Purpose | Reachable? |
|---|---|---|
| `payproxyapi.hubtel.com` | Hosted Checkout initiate | ✅ any IP — **what we use** |
| `rmp.hubtel.com` | Direct Receive (USSD push) | ❌ 403 WAF unless IP whitelisted |
| `api-txnstatus.hubtel.com` | Transaction status check | ❌ 403 WAF unless IP whitelisted |

- Direct Receive code still exists in `services/payment.service.ts` behind
  `HUBTEL_METHOD=direct`. Flip it only after Hubtel whitelists a static egress IP.
- `HUBTEL_STATUS_CHECK=true` re-enables the server-side status fallback in
  `/api/payments/status` — same condition: requires whitelisting. Until then the
  **webhook is the only success signal**.
- ⚠️ Gotcha: `payproxyapi` returns **401 on an empty/invalid body even when auth
  is correct**. Never conclude "bad credentials" from a 401 without sending a
  complete, valid payload.

## 3. Webhook authentication

Hubtel's HMAC signature format is unconfirmed, so `x-hubtel-signature` is logged
but not enforced. Instead (`lib/webhook-token.ts`):

- At initiate time we embed `?token=HMAC(secret, "webhook:" + reference)` in the
  `callbackUrl`. That URL travels server→Hubtel only — a forger cannot derive it.
- The webhook 401s any callback whose token doesn't match (timing-safe compare).
- Secret = `WEBHOOK_TOKEN_SECRET` env var, falling back to `HUBTEL_CLIENT_SECRET`.
- Kill switch: `WEBHOOK_TOKEN_ENFORCE=false` (only if Hubtel ever strips query
  strings from callback URLs — payments would then be **unauthenticated**).
- The webhook also rejects underpayment (paid amount < package price).
- Every live payment logs a `[WEBHOOK SIG]` line comparing Hubtel's header to a
  body-HMAC — collect a few and confirm their format, then adopt it as a second factor.

## 4. Environment variables (Vercel)

| Variable | Purpose |
|---|---|
| `HUBTEL_CLIENT_ID` / `HUBTEL_CLIENT_SECRET` | Hubtel API credential pair |
| `HUBTEL_AUTH_TOKEN` | Pre-encoded `base64(id:secret)` — used as-is if set |
| `HUBTEL_MERCHANT_ACCOUNT` | Hubtel merchant account number |
| `HUBTEL_METHOD` | unset/`checkout` (default) or `direct` (needs IP whitelist) |
| `HUBTEL_STATUS_CHECK` | `true` enables status-API fallback (needs IP whitelist) |
| `HUBTEL_MOCK` | `true` = fake payments (demo). **Must be `false` in production** |
| `WEBHOOK_TOKEN_SECRET` | Webhook token signing secret (optional, see §3) |
| `WEBHOOK_TOKEN_ENFORCE` | `false` disables webhook auth. Leave unset |
| `ROUTER_SYNC_API_KEY` | Shared secret the router presents to sync/confirm. Rotated 2026-08-14 |
| `MIKROTIK_MOCK` | `true` skips router expectations (demo only) |
| `NEXT_PUBLIC_SUPABASE_URL` / `..._ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` / `DATABASE_URL` | Supabase |
| `NEXT_PUBLIC_PORTAL_DOMAIN` | Canonical portal domain for callback URLs |

Env changes only take effect on the **next production deploy** (`vercel deploy --prod`).

## 5. Router operations (RB5009, client's site)

- **Reach it:** Starlink static IP `179.64.70.78`. SSH as `mc-claude` (key-based;
  key lives on the maintainer's machine at `~/.ssh/mc-claude-mikrotik`). SSH is
  firewalled to the maintainer's ISP range `154.160.0.0/15` — if SSH times out,
  your egress IP moved outside it; update via Winbox:
  `/ip service set ssh address=<new-range>` and the `mc-claude ssh` filter rule.
- **The only valid router script** is `docs/hotspot/motionconnect-router.rsc`
  (script `mcsync-poll`, scheduler `mcsync-sched`, 15s). Replace `<SHARED_SECRET>`
  with the live `ROUTER_SYNC_API_KEY` when deploying.
- **Never paste long scripts into the Winbox terminal** — it silently truncates
  lines (this caused real outages). Deploy via scp + import instead:
  ```bash
  scp -O -i ~/.ssh/mc-claude-mikrotik script.rsc mc-claude@179.64.70.78:script.rsc
  ssh -i ~/.ssh/mc-claude-mikrotik mc-claude@179.64.70.78 "/import file-name=script.rsc"
  ```
- **Watch it work:** `/log print follow where message~"mcsync"`
- **RouterOS 7.23 scripting gotchas** (both hit in production):
  - `:toupper` does not exist — the sync API uppercases MACs instead.
  - A bare `:return` at script level is an error — no early exits; nest `:if`s.
- **Walled garden** must allow: `motionconnect.vercel.app`, `*.vercel.app`,
  `*.hubtel.com`, `challenges.cloudflare.com` (+ subdomain wildcard — the Hubtel
  page runs Cloudflare Turnstile and hangs forever without it), `code.jquery.com`,
  `fonts.googleapis.com`, `fonts.gstatic.com`, `use.fontawesome.com`,
  `*.cloudfront.net`, `static.cloudflareinsights.com`, `wa.me`.
  All installed; full list with comments `mcsync:` in `/ip hotspot walled-garden`.
- **Captive portal page:** `hotspot/login.html` on the router redirects to the
  Vercel app with `mac`, `ip`, `link-login-only`, `link-orig` — these params are
  what make MAC auto-login possible. Don't remove any of them.

## 6. Troubleshooting

| Symptom | Check, in order |
|---|---|
| Student paid, no internet | 1. Supabase `transactions`: status? If `pending` → webhook never arrived (check Vercel function logs for `/api/payments/webhook`, look for 401 = token mismatch). 2. If `success` + `mikrotik_synced=false` → router isn't polling: SSH in, check `/system scheduler print` and mcsync log. 3. If synced → device MAC mismatch; student can log in with the voucher shown. |
| Payment page won't load on the Wi-Fi | Walled garden. Test from a connected unpaid device; usually a new domain on Hubtel's checkout page. Add it: `/ip hotspot walled-garden add dst-host=<domain> action=allow` |
| Router log: `mcsync: fetch failed` | `ROUTER_SYNC_API_KEY` mismatch between router script and Vercel env (401), or DNS/NTP broken on the router. `curl` the sync URL with the key from a laptop to isolate. |
| All initiations fail with provider error | Vercel function logs for `/api/payments/initiate`. If Hubtel 401 → credentials changed. If 403 HTML → someone set `HUBTEL_METHOD=direct` without whitelisting. |
| Webhook 401s in Vercel logs | Token mismatch — did `WEBHOOK_TOKEN_SECRET`/`HUBTEL_CLIENT_SECRET` change after the checkout was initiated? In-flight transactions carry old-secret tokens; they'll fail auth. Emergency: `WEBHOOK_TOKEN_ENFORCE=false`, redeploy, fix, re-enable. |
| Everything looks fine but portal never advances | Portal polls `/api/payments/status`. `syncing` = waiting on router confirm. Check `/api/router/confirm` reached (Vercel logs) and `mikrotik_synced` flipped. |

Useful queries (via `psql "$DATABASE_URL"`):
```sql
-- stuck transactions
SELECT reference, status, mac_address, mikrotik_synced, created_at
FROM transactions WHERE status='success' AND mikrotik_synced=false;
-- how a transaction confirmed
SELECT action, actor, created_at FROM activity_logs
WHERE details->>'reference' = 'MC-...';
```

## 7. Key rotation procedure

`ROUTER_SYNC_API_KEY` (do both sides, order matters little since the poll retries):
1. Generate: `openssl rand -hex 24`
2. Vercel: `vercel env rm ROUTER_SYNC_API_KEY production --yes` then
   `printf '%s' "<key>" | vercel env add ROUTER_SYNC_API_KEY production`
3. Redeploy: `vercel deploy --prod`
4. Router: regenerate the install file from `docs/hotspot/motionconnect-router.rsc`
   with the new key and deploy per §5 (scp + import).
5. Verify: `curl -s https://motionconnect.vercel.app/api/router/sync -H "x-router-key: <key>"`
   returns `[]` or JSON (not `Unauthorized`), and the router log shows clean fetches.

Hubtel credentials: update the three `HUBTEL_*` vars, redeploy. Note §6 webhook-401
caveat about in-flight transactions.

## 8. Known constraints & open items

- **Hubtel IP whitelisting** blocks Direct USSD and the status API (§2). Standing
  request to Hubtel: whitelist a static proxy IP; that unlocks the better payment
  UX and webhook-loss reconciliation.
- **Winbox (8291) is open to the internet** on the router. Deliberate (maintainer
  IPs change) but brute-forceable — restrict to known ranges when practical.
- An old `ROUTER_SYNC_API_KEY` was committed to this repo historically
  (`docs/cloud-sync-script.txt`, git history). It was rotated 2026-08-14 and is
  inert — but never reuse it, and don't commit the current one.
- The webhook is the **only** payment-success signal until whitelisting lands.
  If Hubtel webhooks are down, payments will sit `pending`; the status-check
  fallback exists in code but cannot run (§2).

## 9. Documentation map

| Document | Status |
|---|---|
| **`docs/MAINTENANCE.md`** (this file) | ✅ authoritative |
| `docs/hotspot/motionconnect-router.rsc` | ✅ the only valid router script |
| `docs/PROJECT_REQUIREMENTS.md` | Background: original product spec |
| `docs/hubtel_online_checkout.md` | Background: Hubtel checkout API notes |
| `docs/CLIENT_HANDOVER.md` | ⛔ deprecated — obsolete router script, leaked key |
| `docs/hand-over-for-claude-code.md` | ⛔ historical — describes the pre-fix problem, since solved |
| `docs/HUBTEL_PAYMENT_INTEGRATION.md` | ⛔ outdated — says Direct Receive is live; it isn't |
| `docs/MIKROTIK_POLLING_SETUP.md` | ⛔ deprecated — CSV script never matched the API |
| `docs/cloud-sync-script.txt` | ⛔ deprecated — broken parser, leaked key |
| `docs/hotspot/router-poll.rsc` | ⛔ deprecated — calls endpoints that don't exist |
