# Sourced by the other scripts. Per-worktree state and ports so parallel sessions never collide.
ROOT="$(git rev-parse --show-toplevel)"
KEY="$(printf %s "$ROOT" | cksum | cut -d' ' -f1)"
STATE="${VERIFY_STATE:-${TMPDIR:-/tmp}/kanplan-verify-$KEY}"      # throwaway: D1, pids, logs
OUT="${VERIFY_OUT:-$ROOT/.scratch/verify}"                         # evidence: survives teardown (.scratch is gitignored)
OFFSET=$((KEY % 300))
VITE_PORT="${VERIFY_VITE_PORT:-$((5300 + OFFSET))}"
API_PORT="${VERIFY_API_PORT:-$((8900 + OFFSET))}"
BOARD_PORT="${VERIFY_BOARD_PORT:-$((5700 + OFFSET))}"
APP="http://localhost:$VITE_PORT"
SKILL="$ROOT/.claude/skills/verify"
DEPS="${VERIFY_DEPS:-$HOME/.cache/kanplan-verify}"                 # playwright-core lives here, outside the repo
mkdir -p "$STATE" "$OUT"
export VERIFY_API_PORT="$API_PORT"
