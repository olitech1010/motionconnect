/**
 * mikrotik-login.js
 * ============================================================================
 * THE FIX for Motion Connect.
 *
 * Root cause (proven by manual testing on the RB5009):
 *   The hotspot works perfectly. The bug is a CREDENTIAL MISMATCH — the backend
 *   creates a hotspot user with one password, but the browser/portal submits a
 *   different (or blank) password at login, so the router rejects it with
 *   "invalid username or password". Every paid user therefore sits at uptime=0s.
 *
 * The fix:
 *   Do NOT rely on the student's browser to submit a login form. After payment
 *   confirms, the BACKEND logs the device in directly, by MAC, using the router
 *   API. This is the exact operation that worked in manual testing:
 *
 *       /ip hotspot active login \
 *           user=<username> password=<password> \
 *           ip=<phone_ip> mac-address=<phone_mac>
 *
 *   No browser form, no "not secure" warning, no password typing, no mismatch.
 *
 * Transport:
 *   RouterOS v7 REST API over HTTPS. The router is on the same LAN as the
 *   backend (backend seen at 192.168.20.54, router at 192.168.20.1). If the
 *   backend is instead on Vercel, this module must run from somewhere with LAN
 *   access to the router (see NOTE at the bottom) — a browser/serverless
 *   function on the public internet cannot reach 192.168.20.1.
 * ============================================================================
 */

import https from 'node:https';

const {
  ROUTER_HOST = '192.168.20.1',   // router LAN IP
  ROUTER_USER = 'billing-api',     // the API user created on the router
  ROUTER_PASS,                     // its password (env var, never hardcode)
} = process.env;

const BASE = `https://${ROUTER_HOST}/rest`;

// Router uses a self-signed cert. Acceptable ONLY on a trusted LAN.
const agent = new https.Agent({ rejectUnauthorized: false });

function authHeader() {
  return 'Basic ' + Buffer.from(`${ROUTER_USER}:${ROUTER_PASS}`).toString('base64');
}

async function rest(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: authHeader() },
    body: body ? JSON.stringify(body) : undefined,
    // @ts-expect-error Node supports agent
    agent,
  });
  const text = await res.text();
  let data; try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) throw new Error(`RouterOS ${method} ${path} -> ${res.status}: ${text}`);
  return data;
}

/**
 * Look up a currently-connected device (by MAC) in the hotspot host table,
 * so we can get its current IP. The device must be associated to the SSID
 * (it will be, because the student is sitting on the captive portal).
 *
 * Returns { ip, mac } or null if the device isn't on the network yet.
 */
export async function findHost(mac) {
  const macUp = mac.toUpperCase();
  const rows = await rest('GET', '/ip/hotspot/host');
  if (!Array.isArray(rows)) return null;
  const host = rows.find((h) => (h['mac-address'] || '').toUpperCase() === macUp);
  if (!host) return null;
  return { ip: host.address, mac: macUp };
}

/**
 * Ensure the hotspot user exists with EXACTLY this password.
 * Using `set` when it exists guarantees the stored password matches what we
 * will submit at login — this is the specific thing that was mismatched before.
 */
export async function upsertUser({ username, password, profile, mac, bytes }) {
  const existing = await rest('GET', `/ip/hotspot/user?name=${encodeURIComponent(username)}`);
  const payload = {
    name: username,
    password,                         // <-- must match what login() submits
    profile,
    'mac-address': mac || undefined,
    'limit-bytes-total': bytes ? String(bytes) : undefined,
  };
  if (Array.isArray(existing) && existing.length) {
    await rest('PATCH', `/ip/hotspot/user/${existing[0]['.id']}`, payload);
  } else {
    await rest('PUT', '/ip/hotspot/user', payload);
  }
}

/**
 * THE KEY CALL. Log the device in by MAC, server-side.
 * Mirrors the manual command that succeeded:
 *   /ip hotspot active login user=.. password=.. ip=.. mac-address=..
 *
 * `/ip/hotspot/active/login` is invoked via POST on the REST API.
 */
export async function loginDevice({ username, password, ip, mac }) {
  return rest('POST', '/ip/hotspot/active/login', {
    user: username,
    password,                         // <-- SAME password as upsertUser()
    ip,
    'mac-address': mac.toUpperCase(),
  });
}

/** Is this device already online? Used to make the flow idempotent. */
export async function isActive(mac) {
  const macUp = mac.toUpperCase();
  const rows = await rest('GET', '/ip/hotspot/active');
  return Array.isArray(rows) && rows.some((a) => (a['mac-address'] || '').toUpperCase() === macUp);
}

/**
 * Full "grant access" routine — call this after Hubtel confirms payment.
 * Order matters:
 *   1. find the device on the network (get its current IP from its MAC)
 *   2. create/refresh the user with a KNOWN password + data cap
 *   3. log the device in by MAC using that SAME password
 */
export async function grantAccess({ username, password, profile, mac, bytes }) {
  if (await isActive(mac)) {
    return { ok: true, alreadyOnline: true };
  }

  const host = await findHost(mac);
  if (!host) {
    // Device not seen yet — it must be connected to the SSID first.
    return { ok: false, reason: 'device-not-on-network' };
  }

  await upsertUser({ username, password, profile, mac, bytes });
  await loginDevice({ username, password, ip: host.ip, mac });

  return { ok: true, ip: host.ip };
}

/*
 * ---------------------------------------------------------------------------
 * NOTE ON HOSTING (important):
 * The router (192.168.20.1) is only reachable from the LAN. A Vercel
 * serverless function on the public internet CANNOT call it directly. Two ways:
 *
 *   (A) Run this module on a small always-on machine on the LAN (a mini PC or
 *       the developer's server on site). Vercel handles Hubtel + UI; that LAN
 *       agent does the grantAccess() calls. Vercel talks to it via a queue or a
 *       polling endpoint (Option B pattern we discussed).
 *
 *   (B) Flip direction entirely — a RouterOS scheduler script on the router
 *       POLLS a Vercel endpoint every ~20s for paid sessions and runs the login
 *       locally. Then no inbound access to the router is needed at all. See the
 *       companion "router-poll" script. This is the recommended pattern for a
 *       Starlink site with a dynamic IP.
 * ---------------------------------------------------------------------------
 */
