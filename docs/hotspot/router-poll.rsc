# router-poll.rsc
# ============================================================================
# RECOMMENDED APPROACH for a Starlink site (dynamic IP, no inbound access).
#
# The router POLLS the Vercel backend every 20s for paid-but-not-activated
# sessions, then logs each device in LOCALLY by MAC — the exact operation that
# worked in manual testing. Nothing inbound is ever opened on the router.
#
# This replaces "make the browser submit a login form" (which caused the
# credential mismatch + the 'not secure' warning) with a server-driven,
# MAC-based login that cannot mismatch.
#
# SETUP:
#   1. Replace <YOUR_VERCEL_DOMAIN> and <SHARED_SECRET>.
#   2. Paste into a MikroTik terminal (creates the script + scheduler).
#   3. The developer builds the two endpoints described at the bottom.
# ============================================================================

/system script add name=poll-payments policy=read,write,test,policy source={
    :local base "https://<YOUR_VERCEL_DOMAIN>";
    :local key  "<SHARED_SECRET>";

    # 1. Pull paid sessions awaiting activation
    :local resp;
    :do {
        :set resp [/tool fetch url="$base/api/pending-authorizations" \
            http-method=get \
            http-header-field-value="X-Router-Key: $key" \
            output=user as-value];
    } on-error={ :log warning "poll: fetch failed"; :return; }

    :if (($resp->"status") != "finished") do={ :return; }

    :local list [:deserialize ($resp->"data") from=json];
    :if ([:len $list] = 0) do={ :return; }

    :local done "";

    :foreach item in=$list do={
        :local user  ($item->"username");
        :local pass  ($item->"password");
        :local prof  ($item->"profile");
        :local mac   [:toupper ($item->"mac")];
        :local bytes ($item->"bytes");
        :local mins  ($item->"minutes");

        # 2. Create/refresh the user with a KNOWN password + data cap.
        #    (set-if-exists guarantees stored password == what we log in with)
        :if ([:len [/ip hotspot user find where name=$user]] = 0) do={
            /ip hotspot user add name=$user password=$pass profile=$prof \
                mac-address=$mac limit-bytes-total=$bytes \
                comment=("paid:" . ($item->"id"));
        } else={
            /ip hotspot user set [find name=$user] password=$pass profile=$prof \
                mac-address=$mac limit-bytes-total=$bytes;
        }

        # 3. Find the device on the network (get its current IP from its MAC)
        :local host [/ip hotspot host find where mac-address=$mac];
        :if ([:len $host] > 0) do={
            :local ipaddr [/ip hotspot host get $host address];

            # 4. Skip if already logged in (idempotent)
            :if ([:len [/ip hotspot active find where mac-address=$mac]] = 0) do={
                :do {
                    /ip hotspot active login user=$user password=$pass \
                        ip=$ipaddr mac-address=$mac;
                    :log info "poll: logged in $user ($mac) at $ipaddr";
                } on-error={ :log warning "poll: login failed for $user ($mac)"; }
            }
        } else={
            :log info "poll: $mac not on network yet, will retry";
        }

        # collect id for the mark-activated call
        :if ($done = "") do={ :set done ("\"" . ($item->"id") . "\"") } \
            else={ :set done ($done . ",\"" . ($item->"id") . "\"") }
    }

    # 5. Tell Vercel these are handled so they aren't returned again
    :do {
        /tool fetch url="$base/api/mark-activated" http-method=post \
            http-header-field-value="X-Router-Key: $key,Content-Type: application/json" \
            http-data=("{\"ids\":[" . $done . "]}") output=none;
    } on-error={ :log warning "poll: mark-activated failed"; }
}

/system scheduler add name=poll-payments-sched interval=20s \
    on-event="/system script run poll-payments" \
    policy=read,write,test,policy comment="Poll Vercel for paid WiFi sessions"

# ============================================================================
# WHAT THE DEVELOPER BUILDS ON VERCEL (two endpoints)
# ============================================================================
#
# GET /api/pending-authorizations
#   Header required: X-Router-Key: <SHARED_SECRET>  (reject if missing/wrong)
#   Returns paid sessions not yet activated, as JSON:
#   [
#     { "id":"uuid", "mac":"62:DD:36:3B:07:38", "username":"mc_ab12cd",
#       "password":"e7c19b4d", "profile":"weekly",
#       "bytes":5368709120, "minutes":10080 }
#   ]
#   Field names MUST match exactly (mac, username, password, profile, bytes,
#   minutes) — the script reads these keys.
#
# POST /api/mark-activated
#   Header required: X-Router-Key: <SHARED_SECRET>
#   Body: { "ids": ["uuid1","uuid2"] }
#   Flip those rows to activated so the next poll won't return them.
#
# CRITICAL: the "password" you return here MUST be the same value stored on the
# hotspot user. The script uses one value for both — do not generate a second
# password anywhere. This is the exact mismatch that broke the old flow.
# ============================================================================
