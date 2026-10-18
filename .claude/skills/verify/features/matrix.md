# Matrix

Artboard 20 (`DesktopMatrix`), phone 21.

## Sub-features
- Backlog-only urgent/important matrix with one-tap Ready.

## How to get to it (user POV)
- Header toggle "Matrix".

## Driving it with Playwright
- Click "Matrix"; screenshot with `compare.sh 20 <boards-dir>` then open the Matrix view first (the screenshot route is `/`, so drive the toggle in a custom script).

## Gotchas
- `compare.sh` shoots the page as loaded; it does not click anything.
