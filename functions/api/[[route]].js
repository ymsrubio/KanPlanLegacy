// functions/api/[[route]].js
// Hono catch-all Cloudflare Pages Function
// All /api/* routes: auth (Google OAuth), columns, tasks — backed by D1.

import { Hono } from 'hono';
import { handle } from 'hono/cloudflare-pages';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';

const app = new Hono().basePath('/api');

// ============================================================
// Helper: D1 async equivalents of auth-service.js functions
// (auth-service.js is sync for better-sqlite3 tests;
//  these are the async D1 wrappers used in production routes)
// ============================================================

const DEFAULT_COLUMNS = [
  { name: 'Backlog', position: 0, wip_limit: null },
  { name: 'Ready to Start', position: 1, wip_limit: 3 },
  { name: 'In Progress', position: 2, wip_limit: 2 },
  { name: 'Done', position: 3, wip_limit: null }
];

const DEFAULT_PROJECTS = [
  { name: 'General', color: '#64748b' },
  { name: 'Work', color: '#ff4f00' },
  { name: 'Personal', color: '#10b981' }
];

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

async function findOrCreateAccountD1(db, profile) {
  const existing = await db.prepare('SELECT * FROM accounts WHERE google_id = ?').bind(profile.google_id).first();
  if (existing) return existing;

  const id = crypto.randomUUID();
  await db.prepare(
    'INSERT INTO accounts (id, google_id, email, name, avatar_url) VALUES (?, ?, ?, ?, ?)'
  ).bind(id, profile.google_id, profile.email, profile.name, profile.avatar_url || null).run();

  // Seed default columns
  for (const col of DEFAULT_COLUMNS) {
    await db.prepare(
      'INSERT INTO columns (account_id, name, position, wip_limit) VALUES (?, ?, ?, ?)'
    ).bind(id, col.name, col.position, col.wip_limit).run();
  }

  // Seed default projects
  for (const proj of DEFAULT_PROJECTS) {
    try {
      await db.prepare(
        'INSERT INTO projects (account_id, name, color) VALUES (?, ?, ?)'
      ).bind(id, proj.name, proj.color).run();
    } catch {
      // Ignore if exists
    }
  }

  return await db.prepare('SELECT * FROM accounts WHERE id = ?').bind(id).first();
}

async function createSessionD1(db, accountId) {
  const tokenBytes = new Uint8Array(32);
  crypto.getRandomValues(tokenBytes);
  const token = Array.from(tokenBytes).map(b => b.toString(16).padStart(2, '0')).join('');
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString();

  await db.prepare(
    'INSERT INTO sessions (token, account_id, expires_at) VALUES (?, ?, ?)'
  ).bind(token, accountId, expiresAt).run();

  return { token, expires_at: expiresAt };
}

async function resolveSessionD1(db, token) {
  if (!token) return null;
  const session = await db.prepare('SELECT * FROM sessions WHERE token = ?').bind(token).first();
  if (!session) return null;

  if (new Date(session.expires_at) <= new Date()) {
    await db.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
    return null;
  }

  return await db.prepare('SELECT * FROM accounts WHERE id = ?').bind(session.account_id).first();
}

async function deleteSessionD1(db, token) {
  await db.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
}

let schemaInitialized = false;

async function ensureSchemaD1(db) {
  if (schemaInitialized || !db) return;
  try {
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS accounts (
        id TEXT PRIMARY KEY,
        google_id TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL,
        name TEXT NOT NULL,
        avatar_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS columns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        position INTEGER NOT NULL,
        wip_limit INTEGER DEFAULT NULL,
        UNIQUE(account_id, name)
      )
    `).run();

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        color TEXT DEFAULT '#ff4f00',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(account_id, name)
      )
    `).run();

    await db.prepare(`
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
        completed_at DATETIME,
        is_archived INTEGER DEFAULT 0,
        archived_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    // Safe migration: ensure project_id and archive columns exist on tasks table
    try {
      await db.prepare('ALTER TABLE tasks ADD COLUMN project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL').run();
    } catch {
      // Column already exists
    }
    try {
      await db.prepare('ALTER TABLE tasks ADD COLUMN is_archived INTEGER DEFAULT 0').run();
    } catch {
      // Column already exists
    }
    try {
      await db.prepare('ALTER TABLE tasks ADD COLUMN archived_at TEXT').run();
    } catch {
      // Column already exists
    }
    try {
      await db.prepare('ALTER TABLE tasks ADD COLUMN completed_at TEXT').run();
    } catch {
      // Column already exists
    }

    schemaInitialized = true;
  } catch (err) {
    console.error('ensureSchemaD1 error:', err);
  }
}

// ============================================================
// Auth middleware — protects all routes except /api/auth/*
// ============================================================

app.use('*', async (c, next) => {
  if (c.env.DB) {
    await ensureSchemaD1(c.env.DB);
  }

  const path = c.req.path;

  // Skip auth for auth routes
  if (path.startsWith('/api/auth')) {
    return next();
  }

  const token = getCookie(c, 'kanplan_session');
  const account = await resolveSessionD1(c.env.DB, token);

  if (!account) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  c.set('accountId', account.id);
  c.set('account', account);
  return next();
});

// ============================================================
// Auth routes — Google OAuth 2.0
// ============================================================

app.get('/auth/google', (c) => {
  const clientId = c.env.GOOGLE_CLIENT_ID;
  const appUrl = c.env.APP_URL || 'http://localhost:8788';
  const redirectUri = `${appUrl}/api/auth/google/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'consent'
  });

  return c.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
});

app.get('/auth/google/callback', async (c) => {
  const db = c.env.DB;
  const code = c.req.query('code');
  if (!code) return c.json({ error: 'Missing authorization code' }, 400);

  const clientId = c.env.GOOGLE_CLIENT_ID;
  const clientSecret = c.env.GOOGLE_CLIENT_SECRET;
  const appUrl = c.env.APP_URL || 'http://localhost:8788';
  const redirectUri = `${appUrl}/api/auth/google/callback`;

  // Exchange code for tokens
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    })
  });

  if (!tokenResponse.ok) {
    return c.json({ error: 'Failed to exchange authorization code' }, 400);
  }

  const tokens = await tokenResponse.json();

  // Fetch user profile
  const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` }
  });

  if (!profileResponse.ok) {
    return c.json({ error: 'Failed to fetch user profile' }, 400);
  }

  const profile = await profileResponse.json();

  // Find or create account
  const account = await findOrCreateAccountD1(db, {
    google_id: profile.id,
    email: profile.email,
    name: profile.name,
    avatar_url: profile.picture
  });

  // Create session
  const session = await createSessionD1(db, account.id);

  // Set HTTP-only cookie (secure only on HTTPS so localhost HTTP can persist cookies)
  const isSecure = c.req.url.startsWith('https://');
  setCookie(c, 'kanplan_session', session.token, {
    path: '/',
    httpOnly: true,
    secure: isSecure,
    sameSite: 'Lax',
    maxAge: 7 * 24 * 60 * 60 // 7 days in seconds
  });

  const referer = c.req.header('referer');
  const targetUrl = referer ? new URL(referer).origin : (c.env.APP_URL || '/');
  return c.redirect(targetUrl);
});

// Local dev login helper — enables instant local testing without external Google OAuth setup
app.get('/auth/dev-login', async (c) => {
  const db = c.env.DB;
  const referer = c.req.header('referer');
  const targetUrl = referer ? new URL(referer).origin : (c.env.APP_URL || '/');

  const account = await findOrCreateAccountD1(db, {
    google_id: 'dev_user_local',
    email: 'dev@kanplan.local',
    name: 'Developer (Local)',
    avatar_url: null
  });

  const session = await createSessionD1(db, account.id);
  const isSecure = c.req.url.startsWith('https://');

  setCookie(c, 'kanplan_session', session.token, {
    path: '/',
    httpOnly: true,
    secure: isSecure,
    sameSite: 'Lax',
    maxAge: 7 * 24 * 60 * 60
  });

  return c.redirect(targetUrl);
});

app.post('/auth/logout', async (c) => {
  const token = getCookie(c, 'kanplan_session');
  if (token) {
    await deleteSessionD1(c.env.DB, token);
  }
  deleteCookie(c, 'kanplan_session', { path: '/' });
  return c.json({ ok: true });
});

app.get('/auth/me', async (c) => {
  const token = getCookie(c, 'kanplan_session');
  const account = await resolveSessionD1(c.env.DB, token);

  if (!account) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  return c.json({
    name: account.name,
    email: account.email,
    avatar_url: account.avatar_url
  });
});

// ============================================================
// Column routes (account-scoped)
// ============================================================

app.get('/columns', async (c) => {
  const db = c.env.DB;
  const accountId = c.get('accountId');
  const { results } = await db.prepare('SELECT * FROM columns WHERE account_id = ? ORDER BY position ASC').bind(accountId).all();
  return c.json(results);
});

app.post('/columns', async (c) => {
  const db = c.env.DB;
  const accountId = c.get('accountId');
  const { name, wip_limit = null } = await c.req.json();

  const maxRow = await db.prepare('SELECT MAX(position) AS maxPos FROM columns WHERE account_id = ?').bind(accountId).first();
  const position = (maxRow && maxRow.maxPos !== null) ? maxRow.maxPos + 1 : 0;

  const { meta } = await db.prepare('INSERT INTO columns (account_id, name, position, wip_limit) VALUES (?, ?, ?, ?)')
    .bind(accountId, name, position, wip_limit)
    .run();

  return c.json({ id: meta.last_row_id, account_id: accountId, name, position, wip_limit }, 201);
});

// ============================================================
// Project routes (account-scoped)
// ============================================================

app.get('/projects', async (c) => {
  const db = c.env.DB;
  const accountId = c.get('accountId');
  const { results } = await db.prepare('SELECT * FROM projects WHERE account_id = ? ORDER BY id ASC').bind(accountId).all();
  return c.json(results);
});

app.post('/projects', async (c) => {
  const db = c.env.DB;
  const accountId = c.get('accountId');
  const { name, color = '#ff4f00' } = await c.req.json();

  if (!name || !name.trim()) {
    return c.json({ error: 'Project name is required' }, 400);
  }

  const trimmedName = name.trim();
  const trimmedColor = color?.trim() || '#ff4f00';

  const { meta } = await db.prepare('INSERT INTO projects (account_id, name, color) VALUES (?, ?, ?)')
    .bind(accountId, trimmedName, trimmedColor)
    .run();

  return c.json({ id: meta.last_row_id, account_id: accountId, name: trimmedName, color: trimmedColor }, 201);
});

app.delete('/projects/:id', async (c) => {
  const db = c.env.DB;
  const accountId = c.get('accountId');
  const projectId = Number(c.req.param('id'));

  const existing = await db.prepare('SELECT * FROM projects WHERE id = ? AND account_id = ?').bind(projectId, accountId).first();
  if (!existing) return c.json({ error: 'Project not found' }, 404);

  // Unassign tasks from this project
  await db.prepare('UPDATE tasks SET project_id = NULL WHERE project_id = ? AND account_id = ?').bind(projectId, accountId).run();

  // Delete project
  await db.prepare('DELETE FROM projects WHERE id = ? AND account_id = ?').bind(projectId, accountId).run();

  return c.json({ ok: true });
});

// ============================================================
// Task routes (account-scoped)
// ============================================================

app.get('/tasks', async (c) => {
  const db = c.env.DB;
  const accountId = c.get('accountId');
  const { results } = await db.prepare('SELECT * FROM tasks WHERE account_id = ? AND (is_archived = 0 OR is_archived IS NULL) ORDER BY column_id ASC, position ASC').bind(accountId).all();
  return c.json(results);
});

app.get('/tasks/archived', async (c) => {
  const db = c.env.DB;
  const accountId = c.get('accountId');
  const { results } = await db.prepare('SELECT * FROM tasks WHERE account_id = ? AND is_archived = 1 ORDER BY archived_at DESC, id DESC').bind(accountId).all();
  return c.json(results);
});

app.post('/tasks/:id/archive', async (c) => {
  const db = c.env.DB;
  const accountId = c.get('accountId');
  const taskId = Number(c.req.param('id'));

  const task = await db.prepare('SELECT * FROM tasks WHERE id = ? AND account_id = ?').bind(taskId, accountId).first();
  if (!task) return c.json({ error: 'Task not found' }, 404);

  const nowIso = new Date().toISOString();
  await db.prepare('UPDATE tasks SET is_archived = 1, archived_at = ? WHERE id = ? AND account_id = ?').bind(nowIso, taskId, accountId).run();

  const updated = await db.prepare('SELECT * FROM tasks WHERE id = ? AND account_id = ?').bind(taskId, accountId).first();
  return c.json(updated);
});

app.post('/tasks/:id/restore', async (c) => {
  const db = c.env.DB;
  const accountId = c.get('accountId');
  const taskId = Number(c.req.param('id'));

  const task = await db.prepare('SELECT * FROM tasks WHERE id = ? AND account_id = ?').bind(taskId, accountId).first();
  if (!task) return c.json({ error: 'Task not found' }, 404);

  await db.prepare('UPDATE tasks SET is_archived = 0, archived_at = NULL WHERE id = ? AND account_id = ?').bind(taskId, accountId).run();

  const updated = await db.prepare('SELECT * FROM tasks WHERE id = ? AND account_id = ?').bind(taskId, accountId).first();
  return c.json(updated);
});

app.post('/tasks', async (c) => {
  const db = c.env.DB;
  const accountId = c.get('accountId');
  const taskData = await c.req.json();
  const {
    column_id, project_id, title, description,
    is_urgent, is_important,
    urgency_level, importance_level,
    schedule_start, schedule_end, deadline, color_tag
  } = taskData;

  const finalUrgency = urgency_level !== undefined
    ? Math.min(5, Math.max(1, Number(urgency_level)))
    : (is_urgent ? 4 : 2);
  const finalImportance = importance_level !== undefined
    ? Math.min(5, Math.max(1, Number(importance_level)))
    : (is_important ? 4 : 2);

  // Check WIP limit (account-scoped)
  const column = await db.prepare('SELECT wip_limit FROM columns WHERE id = ? AND account_id = ?').bind(column_id, accountId).first();
  if (!column) return c.json({ error: 'Column not found' }, 400);

  if (column.wip_limit !== null) {
    const countRow = await db.prepare('SELECT COUNT(*) AS total FROM tasks WHERE column_id = ? AND account_id = ? AND (is_archived = 0 OR is_archived IS NULL)').bind(column_id, accountId).first();
    if (countRow.total >= column.wip_limit) {
      return c.json({ error: `WIP limit reached for this column (Max: ${column.wip_limit})` }, 400);
    }
  }

  const { meta } = await db.prepare(
    `INSERT INTO tasks (account_id, column_id, project_id, title, description, is_urgent, is_important, urgency_level, importance_level, schedule_start, schedule_end, deadline, color_tag)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    accountId, column_id, project_id ? Number(project_id) : null, title, description || null,
    finalUrgency >= 4 ? 1 : 0,
    finalImportance >= 4 ? 1 : 0,
    finalUrgency, finalImportance,
    schedule_start || null, schedule_end || null,
    deadline || null, color_tag || '#3b82f6'
  ).run();

  return c.json({
    id: meta.last_row_id,
    ...taskData,
    project_id: project_id ? Number(project_id) : null,
    urgency_level: finalUrgency,
    importance_level: finalImportance,
    priority_score: finalUrgency * finalImportance
  }, 201);
});

app.patch('/tasks/:id', async (c) => {
  const db = c.env.DB;
  const accountId = c.get('accountId');
  const taskId = Number(c.req.param('id'));
  const body = await c.req.json();
  const { column_id, project_id, position, schedule_start, schedule_end, title, description, urgency_level, importance_level, is_urgent, is_important, deadline, is_archived, archived_at, completed_at } = body;

  const task = await db.prepare('SELECT * FROM tasks WHERE id = ? AND account_id = ?').bind(taskId, accountId).first();
  if (!task) return c.json({ error: 'Task not found' }, 400);

  // If changing columns, validate WIP limit (account-scoped)
  if (column_id !== undefined && task.column_id !== column_id) {
    const targetColumn = await db.prepare('SELECT wip_limit FROM columns WHERE id = ? AND account_id = ?').bind(column_id, accountId).first();
    if (!targetColumn) return c.json({ error: 'Target column not found' }, 400);

    if (targetColumn.wip_limit !== null) {
      const countRow = await db.prepare('SELECT COUNT(*) AS total FROM tasks WHERE column_id = ? AND account_id = ? AND (is_archived = 0 OR is_archived IS NULL)').bind(column_id, accountId).first();
      if (countRow.total >= targetColumn.wip_limit) {
        return c.json({ error: `WIP limit reached for this column (Max: ${targetColumn.wip_limit})` }, 400);
      }
    }
  }

  // Build dynamic update
  const updates = [];
  const values = [];
  if (column_id !== undefined) { updates.push('column_id = ?'); values.push(column_id); }
  if (project_id !== undefined) { updates.push('project_id = ?'); values.push(project_id ? Number(project_id) : null); }
  if (position !== undefined) { updates.push('position = ?'); values.push(position); }
  if (schedule_start !== undefined) { updates.push('schedule_start = ?'); values.push(schedule_start); }
  if (schedule_end !== undefined) { updates.push('schedule_end = ?'); values.push(schedule_end); }
  if (title !== undefined) { updates.push('title = ?'); values.push(title); }
  if (description !== undefined) { updates.push('description = ?'); values.push(description); }
  if (urgency_level !== undefined) { updates.push('urgency_level = ?'); values.push(urgency_level); }
  if (importance_level !== undefined) { updates.push('importance_level = ?'); values.push(importance_level); }
  if (is_urgent !== undefined) { updates.push('is_urgent = ?'); values.push(is_urgent); }
  if (is_important !== undefined) { updates.push('is_important = ?'); values.push(is_important); }
  if (deadline !== undefined) { updates.push('deadline = ?'); values.push(deadline); }
  if (is_archived !== undefined) { updates.push('is_archived = ?'); values.push(is_archived); }
  if (archived_at !== undefined) { updates.push('archived_at = ?'); values.push(archived_at); }
  if (completed_at !== undefined) { updates.push('completed_at = ?'); values.push(completed_at); }

  if (updates.length > 0) {
    values.push(taskId, accountId);
    await db.prepare(`UPDATE tasks SET ${updates.join(', ')} WHERE id = ? AND account_id = ?`).bind(...values).run();
  }

  const updated = await db.prepare('SELECT * FROM tasks WHERE id = ? AND account_id = ?').bind(taskId, accountId).first();
  return c.json(updated);
});

// DELETE /api/tasks/:id — Delete a task (account-scoped)
app.delete('/tasks/:id', async (c) => {
  const db = c.env.DB;
  const accountId = c.get('accountId');
  const taskId = Number(c.req.param('id'));

  const task = await db.prepare('SELECT * FROM tasks WHERE id = ? AND account_id = ?').bind(taskId, accountId).first();
  if (!task) return c.json({ error: 'Task not found' }, 404);

  await db.prepare('DELETE FROM tasks WHERE id = ? AND account_id = ?').bind(taskId, accountId).run();
  return c.json({ ok: true });
});

export const onRequest = handle(app);
