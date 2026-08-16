-- db/schema.sql
-- Database schema for KanPlan (Cloudflare D1 / SQLite)
-- Clean break: account-scoped tables with row-level isolation

CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  google_id TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS columns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  position INTEGER NOT NULL,
  wip_limit INTEGER DEFAULT NULL,
  UNIQUE(account_id, name)
);

CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#ff4f00',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(account_id, name)
);

CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  column_id INTEGER NOT NULL REFERENCES columns(id) ON DELETE CASCADE,
  project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
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
