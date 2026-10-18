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
