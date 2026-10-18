#!/usr/bin/env bash
# Start vite + wrangler pages dev on a throwaway D1. Prints the app URL when usable.
set -euo pipefail
. "$(dirname "$0")/env.sh"
cd "$ROOT"
if [ -f "$STATE/pids" ] && "$SKILL/scripts/doctor.sh" >/dev/null 2>&1; then echo "already up: $APP"; exit 0; fi
"$SKILL/scripts/down.sh" >/dev/null 2>&1 || true
rm -rf "$STATE/d1"; mkdir -p "$STATE/d1"
# fresh D1 with the real schema (the API only seeds columns/projects per account, not tables)
npx wrangler d1 execute kanplan_db --local --persist-to "$STATE/d1" --file=db/schema.sql >"$STATE/schema.log" 2>&1 \
  || { cat "$STATE/schema.log"; exit 1; }
# --persist-to is the isolation: the shared dev DB lives in ./.wrangler and is never opened
nohup npx wrangler pages dev --d1 DB=kanplan_db --port "$API_PORT" --persist-to "$STATE/d1" >"$STATE/api.log" 2>&1 &
echo $! >"$STATE/pids"
nohup npx vite --config "$SKILL/vite.verify.config.js" --port "$VITE_PORT" --strictPort >"$STATE/vite.log" 2>&1 &
echo $! >>"$STATE/pids"
for i in $(seq 1 90); do
  # usable = the proxied API answers, not just that a port is open
  if [ "$(curl -s -o /dev/null -w '%{http_code}' "$APP/api/auth/me")" = "401" ]; then echo "up: $APP (api :$API_PORT, state $STATE)"; exit 0; fi
  sleep 1
done
echo "not ready after 90s; see $STATE/api.log and $STATE/vite.log" >&2; tail -20 "$STATE/api.log" "$STATE/vite.log" >&2; exit 1
