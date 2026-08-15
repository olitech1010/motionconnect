
# motionconnect-router.rsc — CANONICAL router-side setup (RouterOS v7.13+)
# ============================================================================
# This is the ONLY script that matches the deployed API. The two older files
# in this repo are both incompatible with production and must not be used:
#
#   - router-poll.rsc        calls /api/pending-authorizations and
#                            /api/mark-activated — endpoints that do not exist.
#   - cloud-sync-script.txt  calls the right endpoints but parses a
#                            semicolon-CSV body, while /api/router/sync
#                            returns JSON. It silently creates nothing.
#
# /api/router/sync returns:
#   [ { "id":"MC-…", "mac":"AA:BB:…", "ip":"10.5.50.23", "username":"mc-…",
#       "password":"mc-…", "profile":"weekly", "uptime":"7d" } ]
#
# /api/router/confirm accepts JSON: { "ids": ["MC-…", …] }  (x-router-key auth)
#
# SETUP:
#   1. Replace <SHARED_SECRET> below with the ROUTER_SYNC_API_KEY value that is
#      set in Vercel. Generate a fresh one — the old key is committed to this
#      repo in cloud-sync-script.txt and must be rotated.
#   2. Remove any previous script/scheduler:
#        /system scheduler remove [find name~"poll|cloud-sync"]
#        /system script remove [find name~"poll|cloud-sync"]
#   3. Paste this whole file into the MikroTik terminal.
#   4. Watch it work: /log print follow where message~"mcsync"
# ============================================================================

# ---------------------------------------------------------------------------
# WALLED GARDEN — without these, an unpaid user cannot reach the portal or
# complete payment, and everything upstream of the router is irrelevant.
# The Hubtel checkout page loads Cloudflare Turnstile (a bot check) plus CDN
# assets; block any of them and the payment page hangs on a spinner forever.
# (Domains verified against a HAR capture of a real pay.hubtel.com session.)
# ---------------------------------------------------------------------------
/ip hotspot walled-garden
add dst-host=motionconnect.vercel.app action=allow comment="mcsync: portal"
add dst-host=*.vercel.app action=allow comment="mcsync: vercel infra"
add dst-host=*.hubtel.com action=allow comment="mcsync: hubtel checkout"
add dst-host=challenges.cloudflare.com action=allow comment="mcsync: turnstile bot-check"
add dst-host=*.challenges.cloudflare.com action=allow comment="mcsync: turnstile assets"
add dst-host=code.jquery.com action=allow comment="mcsync: hubtel page dep"
add dst-host=fonts.googleapis.com action=allow comment="mcsync: hubtel page dep"
add dst-host=fonts.gstatic.com action=allow comment="mcsync: hubtel page dep"
add dst-host=use.fontawesome.com action=allow comment="mcsync: hubtel page dep"
add dst-host=*.cloudfront.net action=allow comment="mcsync: hubtel CDN"
add dst-host=static.cloudflareinsights.com action=allow comment="mcsync: hubtel telemetry"
add dst-host=wa.me action=allow comment="mcsync: support link"

# ---------------------------------------------------------------------------
# SYNC SCRIPT — polls Vercel, provisions the user, logs the device in by MAC.
# MAC-based login means the student gets online with zero typing; the voucher
# shown on the portal is a fallback for device changes.
# ---------------------------------------------------------------------------
# NOTE: no early exits — a bare :return is invalid at script level in RouterOS
# and made every idle run error out. Empty-queue runs must fall through quietly.
/system script add name=mcsync-poll policy=read,write,test,policy source={
    :local base "https://motionconnect.vercel.app";
    :local key  "<SHARED_SECRET>";

    :local resp;
    :local ok true;
    :do {
        :set resp [/tool fetch url="$base/api/router/sync" mode=https \
            http-method=get \
            http-header-field="x-router-key: $key" \
            output=user as-value];
    } on-error={ :log warning "mcsync: fetch failed"; :set ok false; }

    :if ($ok) do={
    :if (($resp->"status") = "finished") do={

    :local list;
    :do {
        :set list [:deserialize ($resp->"data") from=json];
    } on-error={ :log warning "mcsync: bad JSON from sync endpoint"; :set list [:toarray ""]; }

    :if ([:len $list] > 0) do={

    :local done "";

    :foreach item in=$list do={
        :local ref   ($item->"id");
        :local user  ($item->"username");
        :local pass  ($item->"password");
        :local prof  ($item->"profile");
        # API contract: sync returns the MAC already uppercased
        # (:toupper does not exist in RouterOS 7.23)
        :local mac   ($item->"mac");
        :local utime ($item->"uptime");

        # 1. Create or refresh the hotspot user (idempotent; password==username
        #    by API contract, so no mismatch is possible)
        :if ([:len [/ip hotspot user find where name=$user]] = 0) do={
            :do {
                /ip hotspot user add name=$user password=$pass profile=$prof \
                    limit-uptime=$utime comment=("mcsync:" . $ref);
                :log info "mcsync: created $user ($ref)";
            } on-error={ :log error "mcsync: failed to create $user"; }
        } else={
            /ip hotspot user set [find name=$user] password=$pass profile=$prof;
        }

        # 2. If the paying device is on the network, log it in by MAC so the
        #    student never has to type anything.
        :if ($mac != "00:00:00:00:00:00") do={
            :local host [/ip hotspot host find where mac-address=$mac];
            :if ([:len $host] > 0) do={
                :local ipaddr [/ip hotspot host get $host address];
                :if ([:len [/ip hotspot active find where mac-address=$mac]] = 0) do={
                    :do {
                        /ip hotspot active login user=$user password=$pass \
                            ip=$ipaddr mac-address=$mac;
                        :log info "mcsync: auto-login $user ($mac) at $ipaddr";
                    } on-error={ :log warning "mcsync: auto-login failed for $user"; }
                }
            } else={
                :log info "mcsync: $mac not on network, voucher login still works";
            }
        }

        # 3. Collect the reference for the confirm call. Confirm ALWAYS — the
        #    user exists on the router now, which is what synced means. The
        #    device logging in is a bonus, not a requirement.
        :if ($done = "") do={ :set done ("\"" . $ref . "\"") } \
            else={ :set done ($done . ",\"" . $ref . "\"") }
    }

    # 4. Flip mikrotik_synced=true so these stop being returned and the portal
    #    moves the student from 'syncing' to the credentials screen.
    :do {
        /tool fetch url="$base/api/router/confirm" mode=https http-method=post \
            http-header-field="x-router-key: $key,Content-Type: application/json" \
            http-data=("{\"ids\":[" . $done . "]}") output=none;
    } on-error={ :log warning "mcsync: confirm failed, will re-sync next cycle"; }

    }
    }
    }
}

/system scheduler add name=mcsync-sched interval=15s \
    on-event="/system script run mcsync-poll" \
    policy=read,write,test,policy comment="MotionConnect: poll for paid sessions"
