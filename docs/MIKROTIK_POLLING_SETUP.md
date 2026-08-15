> [!WARNING]
> **DEPRECATED (2026-08-15).** The CSV-parsing script below never matched the JSON API and contains a revoked key. Use `docs/hotspot/motionconnect-router.rsc`.
> See [`docs/MAINTENANCE.md`](MAINTENANCE.md) for the current, authoritative documentation.

# MikroTik Router Polling Setup Guide

This guide configures your MikroTik RB5009 to automatically poll the MotionConnect cloud server for paid users and create hotspot accounts locally.

## Prerequisites

1. Router running **RouterOS v7.13+** (you have v7.19.6 ✅)
2. **`device-mode` hotspot enabled** — see your client's AI instructions for the physical button process
3. Working internet uplink on the router
4. NTP client enabled (for TLS to work): `/system ntp client set enabled=yes`

---

## Step 1: Create the Sync Script

There are two ways to add this script:

**Option A: Using the Terminal (Fastest)**
Paste this entire block into the MikroTik terminal and **press Enter**. The `/system script add` command automatically creates and saves the script in one go.

**Option B: Using WinBox GUI**
1. Go to **System** -> **Scripts** -> **Add New (+)**
2. Set Name to `cloud-sync-users`
3. Paste only the code *inside* the outer `{ }` braces into the Source box.
4. Click **Apply** and **OK**.

```routeros
/system script add name="cloud-sync-users" policy=read,write,test,ftp source={
:local apiKey "Tq22rgVP9ljKMjGd4mIIVqLkz24l30FQq7mB"
:local syncUrl "https://motionconnect.vercel.app/api/router/sync"
:local confirmUrl "https://motionconnect.vercel.app/api/router/confirm"

:local fetchUrl ("$syncUrl?key=$apiKey")

:do {
  :local result [/tool fetch url=$fetchUrl mode=https http-method=get output=user as-value]

  :if ($result->"status" = "finished") do={
    :local body ($result->"data")

    :if ([:len $body] < 5) do={
      :return
    }

    :local lines [:toarray ""]
    :local lineStart 0
    :local synced ""

    :for i from=0 to=([:len $body] - 1) do={
      :if ([:pick $body $i ($i + 1)] = "\n") do={
        :local line [:pick $body $lineStart $i]
        :set lineStart ($i + 1)

        :if ($line != "username;password;profile;limit-uptime;reference" && [:len $line] > 5) do={
          :local semi1 [:find $line ";" 0]
          :local semi2 [:find $line ";" ($semi1 + 1)]
          :local semi3 [:find $line ";" ($semi2 + 1)]
          :local semi4 [:find $line ";" ($semi3 + 1)]

          :local uname [:pick $line 0 $semi1]
          :local upass [:pick $line ($semi1 + 1) $semi2]
          :local uprof [:pick $line ($semi2 + 1) $semi3]
          :local utime [:pick $line ($semi3 + 1) $semi4]
          :local uref  [:pick $line ($semi4 + 1) [:len $line]]

          :if ([:len [/ip hotspot user find name=$uname]] = 0) do={
            :do {
              /ip hotspot user add name=$uname password=$upass profile=$uprof limit-uptime=$utime comment=("Cloud Sync | $uref")
              :log info ("Hotspot user created: $uname (ref: $uref)")
              :if ([:len $synced] > 0) do={
                :set synced "$synced\n$uref"
              } else={
                :set synced $uref
              }
            } on-error={
              :log error ("Failed to create hotspot user: $uname")
            }
          }
        }
      }
    }

    :if ([:len $synced] > 0) do={
      :do {
        /tool fetch url=$confirmUrl mode=https http-method=post http-header-field="x-api-key: $apiKey" http-data=$synced output=none
        :log info ("Cloud sync confirmed for users")
      } on-error={
        :log warning ("Failed to confirm sync with cloud server")
      }
    }
  }
} on-error={
  :log warning ("Cloud sync fetch failed - will retry next cycle")
}
}
```

---

## Step 2: Create the Scheduler (runs every 10 seconds)

```routeros
/system scheduler add name="cloud-sync-scheduler" interval=10s on-event="/system script run cloud-sync-users" policy=read,write,test,ftp comment="Polls cloud server for paid hotspot users"
```

---

## Step 3: Verify It Works

1. Make a test payment through the portal
2. Watch the router log:
   ```routeros
   /log print where topics~"script"
   ```
3. Check if the user was created:
   ```routeros
   /ip hotspot user print
   ```

You should see log entries like:
```
Hotspot user created: mc-a1b2c3d4 (ref: MC-XXXX)
Cloud sync confirmed for users
```

---

## Troubleshooting

### Script runs but no users created
- Check that the API key matches between router and Vercel env var
- Verify the portal URL is correct in the `syncUrl` environment variable
- Check `/log print` for error messages

### TLS/HTTPS errors
- Ensure NTP is working: `/system ntp client print`
- Ensure clock is correct: `/system clock print`
- If certificate errors persist, the script uses `mode=https` which skips certificate verification by default

### Scheduler not running
- Check: `/system scheduler print`
- Ensure `device-mode` has `hotspot=yes`: `/system device-mode print`
