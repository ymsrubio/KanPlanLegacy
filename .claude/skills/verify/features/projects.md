# Projects

Artboards 10 (new project), 11 (filter), 16 (name taken), 13 (five colors).

## Sub-features
- Project filter menu, new-project dialog, taken-name error (API returns 409 "That name is taken").

## How to get to it (user POV)
- "All projects" menu in the header; More menu for project management.

## Driving it with Playwright
- Open the menu, create a project, expect it in `GET /api/projects`; repeat the name and expect the error text.

## Gotchas
- Fresh accounts start with General, Work, Personal.
