#!/usr/bin/env bash
# Read-only: is this worktree's instance up, on its own DB, signed in capable?
. "$(dirname "$0")/env.sh"
ok=0
chk() { if eval "$2" >/dev/null 2>&1; then echo "ok   $1"; else echo "FAIL $1"; ok=1; fi; }
chk "pids alive" 'for p in $(cat "$STATE/pids"); do kill -0 $p; done'
chk "vite serves $APP" "curl -sf $APP/"
chk "API through proxy answers 401 unauthenticated" "[ \$(curl -s -o /dev/null -w %{http_code} $APP/api/auth/me) = 401 ]"
chk "D1 is throwaway ($STATE/d1)" "[ -d $STATE/d1 ]"
chk "playwright-core installed" "[ -d $DEPS/node_modules/playwright-core ]"
echo "app=$APP api=:$API_PORT board=:$BOARD_PORT out=$OUT"
exit $ok
