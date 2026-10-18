# Redesign handoff

Branch `redesign/workspace-shell` (commit `4d1d74e`) makes artboard 6 the only workspace. This file is the brief for each follow-up session. Start each one fresh, read this file, and do one unit.

## Sources of truth

- Screens: KanPlan design canvas, https://claude.ai/artifact/ForfzZ9Q5iyNvGw33o7Zu7. Read `project/canvas.json`, then only the `project/<Board>.dc.html` files your unit names, with the Artifact tool (`action: read`, `paths`).
- Tokens: `src/tokens.css`, copied from the KanPlan Design System artifact. Shared classes (`btn`, `panel`, `row`, `chip`, `c-1`..`c-5`, `fmenu`, `scrim`, `dlg`, `seg`, `empty`) live in `src/workspace.css`. Reuse them. No hex values, pixel font sizes or emoji in components.
- Time ranges keep the `AGENTS.md` format `09:00 AM - 10:00 AM`, not the artboard's en dash.

## Rules for every unit

- Replace the old surface. Never add a second version next to it.
- Touch only the files your unit lists. Another session may be editing the others.
- Done means `npm test` and `npm run build` pass, and a 1280x800 screenshot of your surface sits next to a screenshot of its artboard with the same structure.
- Commit on your own branch cut from `redesign/workspace-shell`.

## Verifying against an artboard

1. Use the project verify skill at `.claude/skills/verify/` once unit 0 lands. Until then:
2. Run the app on a throwaway database: `npx concurrently -k "vite --port 5173" "wrangler pages dev --d1 DB=kanplan_db --port 8788 --persist-to <scratch>/d1"`. Never the shared dev database.
3. Sign in at `http://localhost:5173/api/auth/dev-login`, then seed projects and tasks with `fetch('/api/projects')` and `fetch('/api/tasks')` POSTs.
4. Serve the artboard files from the folder the Artifact read saved them to (`python3 -m http.server 5199`) and open `http://localhost:5199/<Board>.dc.html` at the same size.

## Units

| # | Unit | Files | Artboards |
|---|---|---|---|
| 0 | Verify skill: script the server, dev login, seed and artboard screenshot steps above | `.claude/skills/verify/` | none |
| 1 | Add task dialog | `src/components/AddTask.jsx`, `src/components/Chip.jsx`, `src/add-task.css` | 9, 14, 15, 22, 24, phone 18, 23, 25 |
| 2 | WIP swap | `src/components/WipSwapModal.jsx` | 8, phone 5 |
| 3 | Projects | `src/components/ProjectManagerModal.jsx` | 10, 16, 13 |
| 4 | Edit and archive drawers | `src/components/TaskEditDrawer.jsx`, `src/components/ArchiveDrawer.jsx` | none drawn; follow the Components artboard (3) and `workspace.css` |
| 5 | Login | `src/components/LoginPage.jsx` | none drawn; use the tokens and the artboard 7 empty-state type |
| 6 | Matrix filter: Not started / All and "N spots open in Ready" | `src/components/MatrixView.jsx`, `src/lib/matrix.js`, `src/matrix.css`, `tests/matrix.test.js` | 20, phone 21 |
| 7 | WIP limits item in the More menu, replacing the inline editor the old board had | `src/App.jsx`, one new dialog component | Components artboard (3), "More menu" |

Unit 0 goes first because every other unit verifies with it. Units 1 to 7 share no files and can run at the same time. Unit 7 is the only one that may edit `src/App.jsx`.

## Known gaps not in any unit

- Dragging a task from the list onto the calendar was removed with the old board. The design has no drag source in the list. Decide before rebuilding it.
- `CONTEXT.md` still says WIP moves are hard-rejected.

## Status as of 2026-10-18

Merged into `redesign/workspace-shell`: unit 0 (verify skill), unit 1 (PR 85, Add task dialog), unit 2 (PR 86, WIP swap), unit 6 (PR 87, Matrix filter). Each review round fixed its findings before merge.

Not started: unit 3 (Projects), unit 4 (Edit and archive drawers), unit 5 (Login), unit 7 (WIP limits in the More menu). Start each in its own session cut from `redesign/workspace-shell`, with the brief in the Units table above.

## Backlog before `redesign/workspace-shell` goes to `main`

- Units 3, 4, 5 and 7, in any order. Unit 7 is the only one that edits `src/App.jsx`.
- Wire the Add task dialog's "Swap a task" button to the swap modal. The modal state lives in `src/App.jsx` (`wipSwapState`, `handleWipSwap`), so do it inside unit 7. Until then the button runs the dialog's add handler.
- Close PR 88 (verify skill against `main`). It is redundant now that its commit is in `redesign/workspace-shell`. Then open one PR from `redesign/workspace-shell` into `main`.
- The in-list "Ready to start is full" banner with its "Swap a task" button (artboard 8) is not built. It belongs to the shell, not to any unit.
- Add CI. The repo has no test workflow, only the Cloudflare Pages deploy check. Add `.github/workflows/ci.yml` running `npm ci`, `npm test` and `npm run build` on pull requests and prove it can fail.
- Matrix: the desktop "Show N more" collapse from artboard 20 is unverified because the seed data is small.

## Known gaps carried over

- Dragging a task from the list onto the calendar was removed with the old board. Decide before rebuilding it.
- `CONTEXT.md` still says WIP moves are hard-rejected.
- Google sign-in uses one fixed `APP_URL`, so it cannot work on Cloudflare preview URLs. Review UI changes locally with `.claude/skills/verify/` and `/api/auth/dev-login`.
- Open issues not covered above: #83 (deadline urgency escalation never runs in production), #63 (post-sign-in redirect uses the Referer header), #84 (tests do not exercise the real API).
