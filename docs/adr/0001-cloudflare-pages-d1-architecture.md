# ADR 0001: Tech Stack Selection — Cloudflare Pages & Cloudflare D1

## Status
Accepted

## Context
KanPlan requires a lightweight, fast, serverless web application hosting solution and a zero-cost SQL database with high reliability, low latency, and zero vendor lock-in concerns.

The application needs to support:
- Single-page React frontend with drag-and-drop capabilities.
- Serverless API routes for managing tasks, columns, and scheduling.
- SQL database for structured relational persistence (Columns, Tasks, Positions, Schedule timestamps).

## Decision
We will build KanPlan using:
1. **Frontend**: Vite + React deployed to **Cloudflare Pages**.
2. **Database**: **Cloudflare D1** (serverless SQLite) for zero-cost serverless SQL storage.
3. **Backend API**: Cloudflare Pages Functions / Workers API endpoints exposing REST routes (`/api/columns`, `/api/tasks`).
4. **Local Development**: Wrangler + local SQLite / Node.js development server.

## Consequences
### Positive
- Zero hosting costs on Cloudflare's free tier.
- Native integration between Cloudflare Pages and Cloudflare D1 with minimal latency.
- Uses standard SQLite SQL dialect.
- Seamless Git-based deployments.

### Negative / Trade-offs
- SQLite dialect instead of PostgreSQL (requires lightweight migrations via D1 migrations / Wrangler).
