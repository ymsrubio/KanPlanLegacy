// tests/auth-service.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Database = require('better-sqlite3');
const {
  findOrCreateAccount,
  createSession,
  resolveSession,
  deleteSession,
  DEFAULT_COLUMNS
} = require('../lib/auth-service');

function setupTestDb() {
  const db = new Database(':memory:');
  const schemaSql = fs.readFileSync(path.join(__dirname, '../db/schema.sql'), 'utf8');
  db.exec(schemaSql);
  return db;
}

const mockGoogleProfile = {
  google_id: 'google-123',
  email: 'test@example.com',
  name: 'Test User',
  avatar_url: 'https://example.com/avatar.jpg'
};

// --- findOrCreateAccount ---

test('findOrCreateAccount creates new account on first call', () => {
  const db = setupTestDb();
  const account = findOrCreateAccount(db, mockGoogleProfile);

  assert.ok(account.id, 'Account should have an id');
  assert.equal(account.google_id, 'google-123');
  assert.equal(account.email, 'test@example.com');
  assert.equal(account.name, 'Test User');
  assert.equal(account.avatar_url, 'https://example.com/avatar.jpg');
});

test('findOrCreateAccount returns existing account on subsequent calls', () => {
  const db = setupTestDb();
  const first = findOrCreateAccount(db, mockGoogleProfile);
  const second = findOrCreateAccount(db, mockGoogleProfile);

  assert.equal(first.id, second.id, 'Same account returned');
  // Only 1 account in DB
  const count = db.prepare('SELECT COUNT(*) AS total FROM accounts').get().total;
  assert.equal(count, 1);
});

test('findOrCreateAccount seeds default columns for new account', () => {
  const db = setupTestDb();
  const account = findOrCreateAccount(db, mockGoogleProfile);

  const columns = db.prepare('SELECT * FROM columns WHERE account_id = ? ORDER BY position ASC').all(account.id);
  assert.equal(columns.length, 4);
  assert.equal(columns[0].name, 'Backlog');
  assert.equal(columns[0].wip_limit, null);
  assert.equal(columns[1].name, 'Ready to Start');
  assert.equal(columns[1].wip_limit, 3);
  assert.equal(columns[2].name, 'In Progress');
  assert.equal(columns[2].wip_limit, 2);
  assert.equal(columns[3].name, 'Done');
  assert.equal(columns[3].wip_limit, null);
});

test('findOrCreateAccount does not seed columns on second call', () => {
  const db = setupTestDb();
  findOrCreateAccount(db, mockGoogleProfile);
  findOrCreateAccount(db, mockGoogleProfile);

  const count = db.prepare('SELECT COUNT(*) AS total FROM columns').get().total;
  assert.equal(count, 4, 'Still only 4 default columns');
});

// --- createSession / resolveSession ---

test('createSession returns token and resolveSession returns account', () => {
  const db = setupTestDb();
  const account = findOrCreateAccount(db, mockGoogleProfile);
  const { token } = createSession(db, account.id);

  assert.ok(token, 'Token should exist');
  assert.equal(token.length, 64, 'Token is 32 bytes hex = 64 chars');

  const resolved = resolveSession(db, token);
  assert.equal(resolved.id, account.id);
  assert.equal(resolved.email, 'test@example.com');
});

test('resolveSession returns null for nonexistent token', () => {
  const db = setupTestDb();
  const resolved = resolveSession(db, 'nonexistent-token');
  assert.equal(resolved, null);
});

test('resolveSession returns null for expired token', () => {
  const db = setupTestDb();
  const account = findOrCreateAccount(db, mockGoogleProfile);

  // Insert session with past expiry
  const token = 'expired-token-123';
  const pastDate = new Date(Date.now() - 1000).toISOString();
  db.prepare('INSERT INTO sessions (token, account_id, expires_at) VALUES (?, ?, ?)').run(token, account.id, pastDate);

  const resolved = resolveSession(db, token);
  assert.equal(resolved, null, 'Expired session should return null');

  // Expired session should be cleaned up
  const session = db.prepare('SELECT * FROM sessions WHERE token = ?').get(token);
  assert.equal(session, undefined, 'Expired session should be deleted');
});

// --- deleteSession ---

test('deleteSession invalidates the token', () => {
  const db = setupTestDb();
  const account = findOrCreateAccount(db, mockGoogleProfile);
  const { token } = createSession(db, account.id);

  // Verify session works before deletion
  assert.ok(resolveSession(db, token));

  deleteSession(db, token);
  const resolved = resolveSession(db, token);
  assert.equal(resolved, null, 'Deleted session should not resolve');
});

// --- Row-level isolation ---

test('Two accounts have independent default columns', () => {
  const db = setupTestDb();
  const accountA = findOrCreateAccount(db, { google_id: 'a', email: 'a@test.com', name: 'A' });
  const accountB = findOrCreateAccount(db, { google_id: 'b', email: 'b@test.com', name: 'B' });

  const colsA = db.prepare('SELECT * FROM columns WHERE account_id = ?').all(accountA.id);
  const colsB = db.prepare('SELECT * FROM columns WHERE account_id = ?').all(accountB.id);

  assert.equal(colsA.length, 4);
  assert.equal(colsB.length, 4);
  // Both can have "Backlog" — UNIQUE(account_id, name) allows it
  assert.equal(colsA[0].name, 'Backlog');
  assert.equal(colsB[0].name, 'Backlog');
  // But different column IDs
  assert.notEqual(colsA[0].id, colsB[0].id);
});
