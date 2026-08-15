> [!WARNING]
> **DEPRECATED (2026-08-15).** The router script below is obsolete (bare :return errors) and contains a revoked API key. The only valid router script is `docs/hotspot/motionconnect-router.rsc`.
> See [`docs/MAINTENANCE.md`](MAINTENANCE.md) for the current, authoritative documentation.

# MotionConnect — Client & Infrastructure Handover

This document outlines the current architecture, recent fixes, and final deployment state of the MotionConnect captive portal billing system. It is designed to be handed over to the client and any assisting AI agents to understand the system's mechanics.

## 1. System Architecture Overview

MotionConnect is a Next.js (App Router) web application deployed on Vercel, utilizing Supabase for database management and Hubtel for Mobile Money payments. It serves as the Captive Portal for a MikroTik Hotspot network (currently running on a Starlink connection).

**The Core Flow:**
1. User connects to the Wi-Fi and is redirected to the Captive Portal (Vercel).
2. User selects a package and enters their Mobile Money number.
3. The Vercel backend initiates a payment request via Hubtel.
4. Hubtel sends an async webhook back to Vercel upon successful payment, which marks the transaction as `success` in Supabase.
5. **The Router Integration:** The MikroTik router polls Vercel every 20 seconds, fetches paid transactions, creates/updates the user on the router, and logs the device in directly via its MAC address.

## 2. The MAC-Based Login Refactor (Recent Fixes)

Previously, the system relied on the student's browser submitting a login form back to the router after payment. This proved unreliable due to SSL "Not Secure" warnings (from self-signed router certs) and credential mismatches.

Following the diagnostic analysis provided by the client's AI, we fully transitioned to a **Server-Side MAC-Based Login (Polling Model)**:

*   **JSON Sync Endpoint:** The `/api/router/sync` endpoint was rewritten to output structured JSON instead of semicolon-separated strings. It now explicitly returns the device's `mac` address (capitalized) alongside the `username`, `password`, `profile`, and `uptime`.
*   **Password Matching:** The backend now guarantees that the `password` field sent in the JSON perfectly matches the `username` field. This eliminates the credential mismatch bug.
*   **JSON Confirm Endpoint:** The `/api/router/confirm` endpoint was updated to accept a JSON array of processed IDs (`{ "ids": ["ref1", "ref2"] }`) to mark transactions as `mikrotik_synced: true`.
*   **Uppercase MACs:** To ensure compatibility with older/varying RouterOS v7 versions that lack the `[:toupper]` string function, the Vercel backend now forces the MAC address to uppercase before sending it to the router.

## 3. Router Configuration & Setup Instructions

Because the Starlink connection uses CGNAT (meaning the router does not have a public inbound IP address), the router must *pull* from Vercel. 

Below is the finalized polling script that must be running on the MikroTik router. It fetches the JSON, parses it, provisions the user, logs them in by MAC, and confirms receipt back to Vercel.

### Step 1: Remove Old Scripts
Before adding the new script, ensure any old sync scripts are removed:
```routeros
/system scheduler remove [find name="cloud-sync-sched"]
/system script remove [find name="cloud-sync"]
```

### Step 2: Add the Polling Script
In Winbox, navigate to **System** → **Scripts** and add a new script named `poll-payments`. Check `read`, `write`, `test`, `policy` permissions. Paste the following into the source:

```routeros
:local base "https://motionconnect.vercel.app"
:local key "Tq22rgVP9ljKMjGd4mIIVqLkz24l30FQq7mB"

:local resp
:do {
    :set resp [/tool fetch url="$base/api/router/sync" http-method=get http-header-field-value="X-Router-Key: $key" output=user as-value]
} on-error={ :log warning "poll: fetch failed"; :return }

:if (($resp->"status") != "finished") do={ :return }

:local body ($resp->"data")
:if ([:len $body] < 5) do={ :return }

:local list [:deserialize $body from=json]
:if ([:typeof $list] != "array") do={ :log warning "poll: invalid JSON"; :return }
:if ([:len $list] = 0) do={ :return }

:local done ""

:foreach item in=$list do={
    :local user  ($item->"username")
    :local pass  ($item->"password")
    :local prof  ($item->"profile")
    :local mac   ($item->"mac")
    :local utime ($item->"uptime")
    :local txid  ($item->"id")

    :if ([:len [/ip hotspot user find where name=$user]] = 0) do={
        :do {
            /ip hotspot user add name=$user password=$pass profile=$prof mac-address=$mac limit-uptime=$utime comment=("paid:" . $txid)
            :log info ("poll: created user $user (ref: $txid)")
        } on-error={ :log warning ("poll: failed to create user $user") }
    } else={
        :do {
            /ip hotspot user set [find name=$user] password=$pass profile=$prof mac-address=$mac limit-uptime=$utime
            :log info ("poll: updated user $user")
        } on-error={ :log warning ("poll: failed to update user $user") }
    }

    :local host [/ip hotspot host find where mac-address=$mac]
    :if ([:len $host] > 0) do={
        :local ipaddr [/ip hotspot host get [find where mac-address=$mac] address]

        :if ([:len [/ip hotspot active find where mac-address=$mac]] = 0) do={
            :do {
                /ip hotspot active login user=$user password=$pass ip=$ipaddr mac-address=$mac
                :log info ("poll: logged in $user ($mac) at $ipaddr")
            } on-error={ :log warning ("poll: login failed for $user ($mac)") }
        } else={
            :log info ("poll: $user already active, skipping")
        }
    } else={
        :log info ("poll: $mac not on network yet, will retry next cycle")
    }

    :if ($done = "") do={ :set done ("\"" . $txid . "\"") } else={ :set done ($done . ",\"" . $txid . "\"") }
}

:if ([:len $done] > 0) do={
    :do {
        /tool fetch url="$base/api/router/confirm" http-method=post http-header-field-value="X-Router-Key: $key,Content-Type: application/json" http-data=("{\"ids\":[" . $done . "]}") output=none
        :log info "poll: confirmed sync with cloud"
    } on-error={ :log warning "poll: mark-activated failed" }
}
```

### Step 3: Add the Scheduler
In Winbox, navigate to **System** → **Scheduler** and add a new scheduler named `poll-payments-sched`.
*   **Interval:** `00:00:20` (20 seconds)
*   **Policy:** `read`, `write`, `test`, `policy`
*   **On Event:** `/system script run poll-payments`

## 4. Verification & Testing

To verify the integration is working:
1. Make a real purchase on the Captive Portal using a device connected to the Hotspot.
2. Ensure the Hubtel payment goes through.
3. Check the MikroTik logs: `/log print follow-only where topics~"script"`
4. You should see logs indicating:
   *   `poll: created user mc-xxxx (ref: MC-xxxx)`
   *   `poll: logged in mc-xxxx (MAC_ADDRESS) at IP_ADDRESS`
   *   `poll: confirmed sync with cloud`
5. The user's device should instantly gain internet access without interacting with any further login forms.
