# Add task

Artboards 9 (add and schedule), 14 (WIP full), 15 (time overlap), 22 (priority), 24 (when). Phone: 18, 23, 25.

## Sub-features
- Title plus Project, Priority and When chips; overlap suggestion; WIP-full state.

## How to get to it (user POV)
- Click "Add task" in the header, or "Add task" at the bottom of Backlog.

## Driving it with Playwright
- `getByRole('button', {name: 'Add task'}).click()`, fill the title, pick chips, submit. Prove with `GET /api/tasks` containing the new title.

## Gotchas
- WIP-full needs 3 tasks in Ready to Start (the seed leaves Ready at 3 before the app's moves; check `/api/columns` and `/api/tasks`).
