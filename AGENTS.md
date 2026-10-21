# AGENTS.md

## Development Workflow Rules

- **Full-Speed Execution**: Build feature specs efficiently and completely.
- **Test-Driven Development (`/tdd`)**: Use TDD to build features with clean automated tests.
- **Code Review**: Run `/code-review` and verify build/test status before closing tickets.

## Agent skills

### Issue tracker

Issues and specs live as GitHub issues. Use the `gh` CLI for all operations. See [docs/agents/issue-tracker.md](docs/agents/issue-tracker.md).

### Triage labels

Canonical triage roles mapped to tracker labels (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See [docs/agents/triage-labels.md](docs/agents/triage-labels.md).

### Domain docs

Single-context repo layout (`CONTEXT.md` + `docs/adr/` at root). See [docs/agents/domain.md](docs/agents/domain.md).

### Design system

UI work targets the [Design canvas](https://claude.ai/artifact/ForfzZ9Q5iyNvGw33o7Zu7) artboards and its [Design System](https://claude.ai/artifact/WKrLGuMynS2pCXtK2zweCT) tokens (dark primary `#201515`, pastel project slots). Read them with the Artifact tool's `read` action. Each task replaces one surface against one named artboard and is verified by screenshot beside it (the `verify` skill); never build a second version beside the old one. [docs/redesign-handoff.md](docs/redesign-handoff.md) lists the units and what remains. `DESIGN.md`'s orange palette is superseded.

## UX & Interaction Guidelines

- **Drag & Drop Clarity:** Ensure a single drag preview renders when dragging tasks between Kanban columns or onto the Calendar grid.
- **WIP Capacity Safety:** When a WIP limit is reached, prefer interactive swap modals (allowing users to return an old task to Backlog) over hard blocking.
- **Explicit Time-Block Labeling:** Always align hour grid labels to top boundaries and display explicit time range badges (`09:00 AM - 10:00 AM`) on cards and blocks.

### Redesign guide

The calm-UI redesign spec (philosophy, build order, priority constants) is the [KanPlan Implementation Guide](https://claude.ai/code/artifact/6bb9c7c1-3984-40d4-b56f-20435814ed60), a Claude Docs doc. Read it with the Claude Docs connector (`read` on the project id `6bb9c7c1-3984-40d4-b56f-20435814ed60`), never by web fetch. Its tickets are GitHub issues #74–#82.
