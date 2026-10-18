#!/usr/bin/env bash
# End to end: up -> seed -> screenshot app + artboard -> down. Evidence is left in $OUT.
# Usage: run.sh <artboard n|File.dc.html> <boards-dir> [app-path] [--phone]
set -uo pipefail
. "$(dirname "$0")/env.sh"
"$SKILL/scripts/deps.sh" && "$SKILL/scripts/up.sh" && node "$SKILL/scripts/seed.mjs" "$APP" && "$SKILL/scripts/doctor.sh" && "$SKILL/scripts/compare.sh" "$@"
rc=$?
"$SKILL/scripts/down.sh"
exit $rc
