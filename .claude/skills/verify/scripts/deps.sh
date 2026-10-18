#!/usr/bin/env bash
# One-time: playwright-core into ~/.cache/kanplan-verify (outside the repo). Uses the Chrome Playwright already cached.
. "$(dirname "$0")/env.sh"
[ -d "$DEPS/node_modules/playwright-core" ] && exit 0
mkdir -p "$DEPS" && (cd "$DEPS" && npm init -y >/dev/null && npm i playwright-core >/dev/null)
ls "$HOME/Library/Caches/ms-playwright" >/dev/null 2>&1 || (cd "$DEPS" && npx playwright-core install chromium)
