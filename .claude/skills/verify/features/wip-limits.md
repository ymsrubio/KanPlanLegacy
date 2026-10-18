# WIP limits and swap

Artboard 8 (`DesktopFull.dc.html`), phone 5 (`PhoneSwap`).

## Sub-features
- Ready to Start limit 3, In Progress limit 2; swap a task when Ready is full.

## How to get to it (user POV)
- Try moving a task into a full section ("Ready to start" with 3/3).

## Driving it with Playwright
- Check pips and counts in the left list; prove via `PATCH /api/tasks/:id` result and a follow-up `GET /api/tasks`.

## Gotchas
- `CONTEXT.md` still says moves are hard-rejected; the UI swaps instead.
