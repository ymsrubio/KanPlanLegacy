#!/usr/bin/env bash
# Screenshot the running app and one artboard. Usage: compare.sh <artboard n|File.dc.html> <boards-dir> [app-path] [--phone]
#   boards-dir = the folder the Artifact tool saved "project/*.dc.html" and "project/canvas.json" into
#                (printed as ".../artifact-files/<id>/project"); see SKILL.md step "Read the artboard".
#   app-path   = route to open in the app, default "/".
set -euo pipefail
. "$(dirname "$0")/env.sh"
n="$1"; boards="${2%/}"; path="${3:-/}"; flag="${4:-}"
[ "${path#--}" != "$path" ] && { flag="$path"; path=/; }
[ -f "$boards/canvas.json" ] || { echo "no canvas.json in $boards; read project/canvas.json and the board with the Artifact tool first" >&2; exit 1; }
file="$(node "$SKILL/scripts/board-file.mjs" "$boards" "$n")"
[ -f "$boards/$file" ] || { echo "$file not saved in $boards; read it with the Artifact tool (path project/$file)" >&2; exit 1; }
"$SKILL/scripts/deps.sh"
# board server: reuse ours if running, else start it (pid recorded so down.sh kills only this one)
if ! curl -sf "http://localhost:$BOARD_PORT/canvas.json" >/dev/null; then
  nohup node "$SKILL/scripts/board.mjs" "$boards" "$BOARD_PORT" >"$STATE/board.log" 2>&1 &
  echo $! >"$STATE/board.pid"; sleep 1
fi
tag="${file%.dc.html}"
node "$SKILL/scripts/shot.mjs" app "$APP$path" "$OUT/app-$tag.png" $flag
node "$SKILL/scripts/shot.mjs" board "http://localhost:$BOARD_PORT/$file" "$OUT/artboard-$tag.png" $flag
