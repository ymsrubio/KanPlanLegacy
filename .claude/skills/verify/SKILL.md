---
name: verify
description: Run KanPlan (React + vite, Hono on wrangler pages dev, D1) on a throwaway database, sign in, seed projects and tasks, and screenshot the app at 1280x800 next to a design artboard. Use to prove a UI change in the real app or to compare a surface against its artboard.
---

# Verify KanPlan

Everything runs from the repo root of your worktree. Ports and state are derived from the worktree path, so sessions in different worktrees never collide and never touch the shared dev database (`.wrangler/`). State is throwaway (`$TMPDIR/kanplan-verify-<hash>`); evidence goes to `.scratch/verify/` (gitignored) and survives teardown.

## Fast path: artboard comparison

1. Read the artboard with the Artifact tool. This step is not scriptable. Artifact `https://claude.ai/artifact/ForfzZ9Q5iyNvGw33o7Zu7`, `action: read`, `paths: ["project/canvas.json", "project/<Board>.dc.html", "artifact-type/dc-runtime.js"]`. The result prints the save folder `.../artifact-files/<id>/`. Boards are numbered by the title in `canvas.json`: 6 is `Desktop.dc.html`, 8 is `DesktopFull.dc.html`, and so on. `dc-runtime.js` is what the boards load as `./support.js`; the artifact does not publish that name.
2. Run, with `<id-dir>` the folder from step 1:

```bash
.claude/skills/verify/scripts/run.sh 6 <id-dir>/project            # up, seed, screenshot both, down
.claude/skills/verify/scripts/run.sh 18 <id-dir>/project / --phone  # 375x812 for phone artboards
```

3. Open `.scratch/verify/app-<Board>.png` and `.scratch/verify/artboard-<Board>.png` with Read and compare structure. The artboard shows its own sample dates and tasks, so compare layout, spacing, type and color, not content.

`run.sh` exits non-zero if any step fails and always tears down.

## Iterating on a UI (keep it up)

```bash
scripts/up.sh                                 # prints the app URL; fresh D1 from db/schema.sql
node scripts/seed.mjs $APP                    # APP printed by up.sh / doctor.sh
scripts/compare.sh 6 <id-dir>/project [/path] # re-shoot after each edit; vite hot-reloads
scripts/doctor.sh                             # read-only health check; run first when anything looks off
scripts/down.sh                               # when done
```

Run `scripts/` paths from `.claude/skills/verify/`, or prefix them. `up.sh` is a no-op if this worktree's instance is already healthy.

## Launch

`up.sh` applies `db/schema.sql` to a D1 under `--persist-to $STATE/d1`, starts `wrangler pages dev --d1 DB=kanplan_db` on `$API_PORT`, then vite via `vite.verify.config.js` on `$VITE_PORT` (the repo config, with `/api` proxied to that API port). Ready means `GET $APP/api/auth/me` returns 401 through the proxy. Logs: `$STATE/api.log`, `$STATE/vite.log`. A fresh account gets the four columns (Backlog, Ready to Start limit 3, In Progress limit 2, Done) and projects General, Work, Personal on first login.

## Drive

- Sign-in: `GET /api/auth/dev-login` sets the `kanplan_session` cookie. `seed.mjs` and `shot.mjs` both do this; do not enter credentials anywhere.
- Seed: `seed.mjs` posts 10 tasks through the real API (`POST /api/tasks`): Backlog 3, Ready to Start 3, In Progress 2, Done 2, spread over the three projects, some scheduled today and tomorrow. Respects WIP limits.
- For interaction beyond a screenshot, write a throwaway Playwright script in `$STATE` that imports from `~/.cache/kanplan-verify/node_modules/playwright-core` and reuses the sign-in from `shot.mjs`. Prefer role/label selectors over coordinates.
- API shapes: `functions/api/[[route]].js` (`/columns`, `/projects`, `/tasks`, `PATCH /tasks/:id`).

## Evidence

Proof means the real path in the running app: screenshots from `compare.sh`, plus `curl`/`fetch` of `/api/tasks` when a change should have written a row. Capture the action and the resulting state, not only the final screen. Don't call internal setters. Screenshots are 1280x800 at 1x (phone: 375x812).

## Cleanup

`down.sh` kills only the pids recorded by `up.sh` and `compare.sh` (and their children) and deletes `$STATE`. It never kills by process name. `.scratch/verify/*.png` is kept. After a failed iteration run `down.sh` too.

## Gotchas

- The app moves tasks between columns based on schedule vs the current time, so the seeded columns on screen can differ from the seed counts (e.g. a past-scheduled Ready task shows In progress, Done shows more). See `features/`.
- Ports differ per worktree; read them from `doctor.sh` output instead of assuming 5173/8788.
- Needs `playwright-core` in `~/.cache/kanplan-verify` (installed by `deps.sh` on first run) and a Playwright Chromium in `~/Library/Caches/ms-playwright`; `deps.sh` installs one if missing. macOS arm64 path assumed in `shot.mjs`.
- The artboards load Google Fonts; offline runs fall back to system fonts.
- Feature map: `features/README.md`.
