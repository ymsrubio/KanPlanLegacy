# Today workspace

Artboard 6, `Desktop.dc.html`. Left list of In progress / Ready to start / Backlog / Done, right Day calendar, header with Day/Matrix toggle, project filter, Add task, More menu.

## Sub-features
- Day/Matrix toggle, previous/Today/next day, project filter, collapsible sections, "Next" badge on the first Ready task, WIP pips (e.g. 2/3).

## How to get to it (user POV)
- Sign in, land on `/`.

## Driving it with Playwright
- `compare.sh 6 <boards-dir>` for the screenshot pair. Headings: "Today", buttons "Day", "Matrix", "Add task".

## Gotchas
- Seeded schedules are relative to today; column placement may be adjusted by the app's time-based moves.
