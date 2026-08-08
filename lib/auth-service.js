// lib/auth-service.js
// Authentication service: account provisioning, session management, default column seeding.
// Works with both better-sqlite3 (sync, for tests) and D1 (async, for production).
// Exported functions are sync — D1 callers use the async wrappers in auth-service-d1.js.

const crypto = require('node:crypto');

const DEFAULT_COLUMNS = [
  { name: 'Backlog', position: 0, wip_limit: null },
  { name: 'Ready to Start', position: 1, wip_limit: 3 },
  { name: 'In Progress', position: 2, wip_limit: 2 },
  { name: 'Done', position: 3, wip_limit: null }
];

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function generateAccountId() {
  return crypto.randomUUID();
}

function generateSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Find existing account by google_id or create a new one.
 * On creation, seeds default columns for the account.
 * @param {import('better-sqlite3').Database} db
 * @param {{ google_id: string, email: string, name: string, avatar_url?: string }} profile
 * @returns {{ id: string, google_id: string, email: string, name: string, avatar_url: string|null, created_at: string }}
 */
function findOrCreateAccount(db, profile) {
  const existing = db.prepare('SELECT * FROM accounts WHERE google_id = ?').get(profile.google_id);
  if (existing) return existing;

  const id = generateAccountId();
  db.prepare(
    'INSERT INTO accounts (id, google_id, email, name, avatar_url) VALUES (?, ?, ?, ?, ?)'
  ).run(id, profile.google_id, profile.email, profile.name, profile.avatar_url || null);

  // Seed default columns for this account
  const insertCol = db.prepare(
    'INSERT INTO columns (account_id, name, position, wip_limit) VALUES (?, ?, ?, ?)'
  );
  for (const col of DEFAULT_COLUMNS) {
    insertCol.run(id, col.name, col.position, col.wip_limit);
  }

  return db.prepare('SELECT * FROM accounts WHERE id = ?').get(id);
}

/**
 * Create a new session for an account.
 * @param {import('better-sqlite3').Database} db
 * @param {string} accountId
 * @returns {{ token: string, expires_at: string }}
 */
function createSession(db, accountId) {
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString();

  db.prepare(
    'INSERT INTO sessions (token, account_id, expires_at) VALUES (?, ?, ?)'
  ).run(token, accountId, expiresAt);

  return { token, expires_at: expiresAt };
}

/**
 * Resolve a session token to its account. Returns null if expired or not found.
 * @param {import('better-sqlite3').Database} db
 * @param {string} token
 * @returns {{ id: string, google_id: string, email: string, name: string, avatar_url: string|null } | null}
 */
function resolveSession(db, token) {
  const session = db.prepare('SELECT * FROM sessions WHERE token = ?').get(token);
  if (!session) return null;

  // Check expiry
  if (new Date(session.expires_at) <= new Date()) {
    // Clean up expired session
    db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
    return null;
  }

  const account = db.prepare('SELECT * FROM accounts WHERE id = ?').get(session.account_id);
  return account || null;
}

/**
 * Delete a session (logout).
 * @param {import('better-sqlite3').Database} db
 * @param {string} token
 */
function deleteSession(db, token) {
  db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
}

module.exports = {
  findOrCreateAccount,
  createSession,
  resolveSession,
  deleteSession,
  DEFAULT_COLUMNS,
  SESSION_DURATION_MS
};
