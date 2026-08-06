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
  schedule_start TEXT,
  schedule_end TEXT,
  deadline TEXT,
  color_tag TEXT DEFAULT '#3b82f6',
  position INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Seed initial default columns
INSERT INTO columns (name, position, wip_limit) VALUES 
  ('Backlog', 0, NULL),
  ('Ready to Start', 1, 3),
  ('In Progress', 2, 2),
  ('Done', 3, NULL);
