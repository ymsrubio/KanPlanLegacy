// tests/api.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Database = require('better-sqlite3');
const { createTask, moveTask } = require('../lib/task-service');
const { findOrCreateAccount } = require('../lib/auth-service');

function setupTestDb() {
  const db = new Database(':memory:');
  const schemaSql = fs.readFileSync(path.join(__dirname, '../db/schema.sql'), 'utf8');
  db.exec(schemaSql);
  // Create a test account (seeds default columns)
  const account = findOrCreateAccount(db, { google_id: 'test-api', email: 'api@test.com', name: 'API Test' });
  return { db, accountId: account.id };
}

function getColumnId(db, accountId, name) {
  return db.prepare('SELECT id FROM columns WHERE account_id = ? AND name = ?').get(accountId, name).id;
}

test('API Service - Fetches default columns and tasks', () => {
  const { db, accountId } = setupTestDb();
  const columns = db.prepare('SELECT * FROM columns WHERE account_id = ? ORDER BY position ASC').all(accountId);
  assert.equal(columns.length, 4);

  const backlogId = getColumnId(db, accountId, 'Backlog');
  createTask(db, accountId, { column_id: backlogId, title: 'API Test Task' });
  const tasks = db.prepare('SELECT * FROM tasks WHERE account_id = ?').all(accountId);
  assert.equal(tasks.length, 1);
  assert.equal(tasks[0].title, 'API Test Task');
});

test('API Service - Schema execution is idempotent', () => {
  const { db, accountId } = setupTestDb();
  const schemaSql = fs.readFileSync(path.join(__dirname, '../db/schema.sql'), 'utf8');
  db.exec(schemaSql);
  db.exec(schemaSql);
  db.exec(schemaSql);

  const columns = db.prepare('SELECT * FROM columns WHERE account_id = ? ORDER BY position ASC').all(accountId);
  assert.equal(columns.length, 4);
});

test('API Service - Calculates 1-5 scale Priority Score correctly', () => {
  const { db, accountId } = setupTestDb();
  const backlogId = getColumnId(db, accountId, 'Backlog');
  const task = createTask(db, accountId, {
    column_id: backlogId,
    title: 'High Priority Task',
    urgency_level: 5,
    importance_level: 4
  });

  assert.equal(task.urgency_level, 5);
  assert.equal(task.importance_level, 4);
  assert.equal(task.priority_score, 20);
});

test('API Service - Moves task and rejects WIP limit overflow', () => {
  const { db, accountId } = setupTestDb();
  const backlogId = getColumnId(db, accountId, 'Backlog');
  const readyId = getColumnId(db, accountId, 'Ready to Start'); // WIP limit: 3

  createTask(db, accountId, { column_id: readyId, title: 'Task 1' });
  createTask(db, accountId, { column_id: readyId, title: 'Task 2' });
  createTask(db, accountId, { column_id: readyId, title: 'Task 3' });

  const extraTask = createTask(db, accountId, { column_id: backlogId, title: 'Extra Task' });

  assert.throws(
    () => moveTask(db, accountId, extraTask.id, readyId, 0),
    { message: 'WIP limit reached for this column (Max: 3)' }
  );
});

// --- Row-level isolation ---

test('Account A tasks are invisible to Account B', () => {
  const db = new Database(':memory:');
  const schemaSql = fs.readFileSync(path.join(__dirname, '../db/schema.sql'), 'utf8');
  db.exec(schemaSql);

  const accountA = findOrCreateAccount(db, { google_id: 'a', email: 'a@test.com', name: 'A' });
  const accountB = findOrCreateAccount(db, { google_id: 'b', email: 'b@test.com', name: 'B' });

  const backlogA = db.prepare('SELECT id FROM columns WHERE account_id = ? AND name = ?').get(accountA.id, 'Backlog').id;
  createTask(db, accountA.id, { column_id: backlogA, title: 'Secret Task' });

  const tasksB = db.prepare('SELECT * FROM tasks WHERE account_id = ?').all(accountB.id);
  assert.equal(tasksB.length, 0, 'Account B sees zero tasks');

  const tasksA = db.prepare('SELECT * FROM tasks WHERE account_id = ?').all(accountA.id);
  assert.equal(tasksA.length, 1);
});

test('WIP limits are enforced per-account independently', () => {
  const db = new Database(':memory:');
  const schemaSql = fs.readFileSync(path.join(__dirname, '../db/schema.sql'), 'utf8');
  db.exec(schemaSql);

  const accountA = findOrCreateAccount(db, { google_id: 'a2', email: 'a2@test.com', name: 'A2' });
  const accountB = findOrCreateAccount(db, { google_id: 'b2', email: 'b2@test.com', name: 'B2' });

  const readyA = db.prepare('SELECT id FROM columns WHERE account_id = ? AND name = ?').get(accountA.id, 'Ready to Start').id;
  const readyB = db.prepare('SELECT id FROM columns WHERE account_id = ? AND name = ?').get(accountB.id, 'Ready to Start').id;

  // Fill A's Ready to Start (WIP: 3)
  createTask(db, accountA.id, { column_id: readyA, title: 'A1' });
  createTask(db, accountA.id, { column_id: readyA, title: 'A2' });
  createTask(db, accountA.id, { column_id: readyA, title: 'A3' });

  // B should still be able to add to their own Ready to Start
  const bTask = createTask(db, accountB.id, { column_id: readyB, title: 'B1' });
  assert.ok(bTask.id, 'Account B can add tasks despite A being at WIP limit');
});
