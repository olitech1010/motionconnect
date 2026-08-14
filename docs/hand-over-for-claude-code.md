# MotionConnect — AI Handover & Context Document

**Target AI:** Claude Code (or any new AI agent taking over the project)
**Project Name:** MotionConnect
**Stack:** Next.js (App Router), TypeScript, Tailwind CSS, Supabase, Vercel
**Hardware Integration:** MikroTik RouterOS v7 (Captive Portal / Hotspot)
**Payment Gateway:** Hubtel (Ghana Mobile Money - MTN, Telecel, AT)

---

## 1. Project Overview & Goal
MotionConnect is a modern Captive Portal and ISP Management Gateway for MikroTik Wi-Fi networks in Ghana. 
**The user journey:**
1. A student connects to the Wi-Fi.
2. The MikroTik router intercepts them and opens the Captive Portal (CNA - Captive Network Assistant).
3. The portal redirects to our Vercel-hosted Next.js app.
4. The student selects a data package and enters their Mobile Money (MoMo) number.
5. They pay via Hubtel.
6. Once payment is confirmed, the MikroTik router is automatically triggered to unlock internet access for that specific user's MAC address.

---

## 2. Current Architecture

### A. MikroTik Setup
1. **Trigger:** `docs/login.html` is uploaded to the MikroTik hotspot folder. When a device connects, MikroTik serves this file, which immediately redirects the user to the Vercel app, appending their MAC and IP address in the URL (e.g., `https://motionconnect.vercel.app/?mac=$(mac)&ip=$(ip)`).
2. **Provisioning (The Polling Script):** Because Vercel (public internet) cannot securely reach the MikroTik router (local LAN `192.168.20.1`) without complex port forwarding, we implemented a **Polling Script** (`docs/hotspot/router-poll.rsc`). The router runs this script every 10-20 seconds to fetch paid/pending transactions from the Vercel API (`/api/router/sync`) and creates the hotspot user locally. 

### B. Vercel Backend & Supabase
1. The Vercel app (`app/api/payments/initiate/route.ts`) handles the Hubtel payment request.
2. Transactions are logged in Supabase (`transactions` table).
3. When Hubtel sends a success webhook (`app/api/payments/webhook/route.ts`), the transaction status is updated to `success`, making it available for the MikroTik polling script to pick up.

---

## 3. The Core Challenge: The Hubtel Payment Dilemma

We are stuck between two Hubtel API integration methods, both of which currently have major friction points. **Your primary goal as the new AI is to analyze these constraints and implement a definitive solution.**

### Method A: Hubtel Online Checkout (Hosted Web Page)
* **How it works:** The Vercel backend hits `payproxyapi.hubtel.com/items/initiate` and gets a `checkoutUrl`. The user is redirected to Hubtel's web page to pay.
* **The Problem:** 
  1. **User Experience:** After paying, users often forget to click "Continue" or "Return to Merchant". If they just close the window, the captive portal doesn't always realize they paid (until the webhook fires, but the UX is broken).
  2. **Captive Portal limitations (CNA):** Apple/Android Captive Network Assistants (the mini-browser that pops up on Wi-Fi connect) often block external redirects or strip cookies, breaking the Hubtel checkout page.
* **Status:** The codebase previously used this, but the user strongly dislikes the UX and the drop-off rate.

### Method B: Hubtel Direct Receive API (USSD Push) — *Currently Implemented*
* **How it works:** The Vercel backend hits `rmp.hubtel.com/merchantaccount/merchants/.../receive/mobilemoney`. Hubtel pushes a USSD prompt *directly* to the user's phone (e.g., "Enter MoMo PIN to pay"). The user stays on our Vercel page while it polls for success.
* **The Problem:** **IP Whitelisting.** The `rmp.hubtel.com` API strictly requires a whitelisted static IP. Because Vercel uses dynamic AWS IPs, Hubtel's WAF rejects our API calls with a **403 Forbidden HTML error**.
* **Status:** This is the current code in `services/payment.service.ts`, but it is failing with `403 Forbidden`.

---

## 4. Your Task & Next Steps

**As the new AI, please analyze the situation and propose/execute a solution. Here are the potential paths:**

1. **Fix Method B (Direct Receive) with a Static IP Proxy:**
   * Since Vercel has dynamic IPs, can you implement a static IP proxy service (like Fixie, QuotaGuard, or a cheap VPS proxy) inside the Next.js API route? 
   * We route the Hubtel `rmp.hubtel.com` fetch request through the proxy, get the proxy's static IP, and the user asks Hubtel to whitelist that single IP.
   
2. **Fix Method A (Online Checkout) to work in the Captive Portal:**
   * Can you refactor the Captive Portal flow so it breaks out of the CNA (Captive Network Assistant)? For example, showing a page that forces the user to open Safari/Chrome to continue, thus avoiding the CNA limitations?
   * Can we implement a better polling mechanism on the frontend so even if they close the checkout window, the internet unlocks automatically behind the scenes?

3. **Alternative Architecture:**
   * Is there a different Hubtel endpoint that allows Direct USSD pushes but *doesn't* require IP whitelisting? 
   * (Reference the documentation in `docs/HUBTEL_PAYMENT_INTEGRATION.md` for payload structures).

### Instructions for the AI:
1. Read `services/payment.service.ts` to see the current Hubtel implementation.
2. Read `components/portal/CaptivePortal.tsx` to understand the frontend polling and MAC capture.
3. Read `docs/HUBTEL_PAYMENT_INTEGRATION.md` for the technical spec of both APIs.
4. **Formulate a plan:** Decide whether we should use a Proxy for Direct Receive, or revert to Hosted Checkout with a robust CNA-breakout strategy. 
5. Present the plan to the user, and execute it once approved. Make sure all MikroTik networking logic remains intact (MAC addresses must be captured and passed to Supabase!).
