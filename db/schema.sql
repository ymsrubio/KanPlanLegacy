-- db/schema.sql
-- Database schema for KanPlan (Cloudflare D1 / SQLite)

CREATE TABLE IF NOT EXISTS columns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  position INTEGER NOT NULL,
  wip_limit INTEGER DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  column_id INTEGER NOT NULL REFERENCES columns(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  is_urgent INTEGER DEFAULT 0,
  is_important INTEGER DEFAULT 0,
  urgency_level INTEGER DEFAULT 3 CHECK(urgency_level BETWEEN 1 AND 5),
  importance_level INTEGER DEFAULT 3 CHECK(importance_level BETWEEN 1 AND 5),
  schedule_start TEXT,
  schedule_end TEXT,
  deadline TEXT,
  color_tag TEXT DEFAULT '#3b82f6',
  position INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Seed initial default columns idempotently
INSERT INTO columns (id, name, position, wip_limit) VALUES 
  (1, 'Backlog', 0, NULL),
  (2, 'Ready to Start', 1, 3),
  (3, 'In Progress', 2, 2),
  (4, 'Done', 3, NULL)
ON CONFLICT(id) DO NOTHING;
