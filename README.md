# MotionConnect

Captive portal and ISP management gateway for MikroTik Wi-Fi hotspots in Ghana.
Students connect to the Wi-Fi, buy a data package with Mobile Money (Hubtel hosted
checkout), and get internet access automatically — the router logs their device in
by MAC address within seconds of payment, no voucher typing required.

**Live in production since 2026-08-15.**

## Stack

- **Next.js (App Router) + TypeScript + Tailwind** — the portal and API, on Vercel
- **Supabase (Postgres)** — transactions, packages, activity logs
- **Hubtel** — Mobile Money payments (MTN / Telecel / AT) via Hosted Checkout
- **MikroTik RouterOS v7** (RB5009) — hotspot enforcement; polls the API every 15s

## How it works (one paragraph)

The router serves a redirect page that sends connecting devices to the Vercel
portal with their MAC attached. The student pays on Hubtel's checkout page; Hubtel
calls our token-authenticated webhook; the transaction flips to `success` in
Supabase; the router's polling script picks it up within 15 seconds, creates the
hotspot user, and auto-logs the device in by MAC. The portal shows a voucher as
backup for other devices. The unlock never depends on the student's browser.

## Start here

- **Operating, debugging, or changing anything → [`docs/MAINTENANCE.md`](docs/MAINTENANCE.md)**
  (architecture as-built, env vars, router ops, troubleshooting, key rotation).
  Several older docs in `docs/` are deprecated — the map at the bottom of
  MAINTENANCE.md says which ones.
- Router-side script (the only valid one): [`docs/hotspot/motionconnect-router.rsc`](docs/hotspot/motionconnect-router.rsc)

## Local development

```bash
npm install
cp .env.example .env.local   # fill in values; see docs/MAINTENANCE.md §4
npm run dev                  # http://localhost:3000
```

Set `HUBTEL_MOCK=true` and `MIKROTIK_MOCK=true` to develop without real payments
or a router. Deploy with `vercel deploy --prod` (env var changes need a redeploy).
