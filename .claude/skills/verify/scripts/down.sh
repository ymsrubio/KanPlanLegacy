#!/usr/bin/env bash
# Kill only what up.sh/artboard.sh started (by recorded pid and its children), then delete the throwaway DB. Evidence in $OUT stays.
. "$(dirname "$0")/env.sh"
killtree() { for c in $(pgrep -P "$1" 2>/dev/null); do killtree "$c"; done; kill "$1" 2>/dev/null || true; }
for f in pids board.pid; do
  [ -f "$STATE/$f" ] && while read -r p; do [ -n "$p" ] && killtree "$p"; done <"$STATE/$f"
done
sleep 1
rm -rf "$STATE"
echo "down; evidence kept in $OUT"
