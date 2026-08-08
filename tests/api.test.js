// tests/api.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import { createTask, moveTask, deleteTask, calculateEscalatedUrgency } from '../lib/task-service.js';
import { findOrCreateAccount } from '../lib/auth-service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function setupTestDb() {
  const db = new Database(':memory:');
  const schemaSql = fs.readFileSync(path.join(__dirname, '../db/schema.sql'), 'utf8');
  db.exec(schemaSql);
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

// --- Task Deletion ---

test('deleteTask removes a task owned by the account', () => {
  const { db, accountId } = setupTestDb();
  const backlogId = getColumnId(db, accountId, 'Backlog');
  const task = createTask(db, accountId, { column_id: backlogId, title: 'Delete Me' });

  deleteTask(db, accountId, task.id);

  const remaining = db.prepare('SELECT * FROM tasks WHERE id = ? AND account_id = ?').get(task.id, accountId);
  assert.equal(remaining, undefined, 'Task should be deleted');
});

test('deleteTask throws when task belongs to another account', () => {
  const db = new Database(':memory:');
  const schemaSql = fs.readFileSync(path.join(__dirname, '../db/schema.sql'), 'utf8');
  db.exec(schemaSql);

  const accountA = findOrCreateAccount(db, { google_id: 'del-a', email: 'del-a@test.com', name: 'Del A' });
  const accountB = findOrCreateAccount(db, { google_id: 'del-b', email: 'del-b@test.com', name: 'Del B' });

  const backlogA = db.prepare('SELECT id FROM columns WHERE account_id = ? AND name = ?').get(accountA.id, 'Backlog').id;
  const task = createTask(db, accountA.id, { column_id: backlogA, title: 'A Secret' });

  assert.throws(
    () => deleteTask(db, accountB.id, task.id),
    { message: 'Task not found' }
  );

  // Task still exists for account A
  const still = db.prepare('SELECT * FROM tasks WHERE id = ?').get(task.id);
  assert.ok(still, 'Task should still exist for account A');
});

test('deleteTask throws for nonexistent task ID', () => {
  const { db, accountId } = setupTestDb();
  assert.throws(
    () => deleteTask(db, accountId, 99999),
    { message: 'Task not found' }
  );
});

// --- Urgency Escalation ---

test('calculateEscalatedUrgency escalates to 5 when <= 1 day remains', () => {
  const now = new Date('2026-08-08T12:00:00Z').getTime();
  const deadline = '2026-08-09T00:00:00Z'; // 12 hours away
  const escalated = calculateEscalatedUrgency(2, deadline, now);
  assert.equal(escalated, 5);
});

test('calculateEscalatedUrgency escalates +1 (min 4) when <= 3 days remain', () => {
  const now = new Date('2026-08-08T12:00:00Z').getTime();
  const deadline = '2026-08-10T12:00:00Z'; // 2 days away
  const escalated = calculateEscalatedUrgency(2, deadline, now);
  assert.equal(escalated, 4);
});

test('calculateEscalatedUrgency preserves base urgency when > 3 days remain', () => {
  const now = new Date('2026-08-08T12:00:00Z').getTime();
  const deadline = '2026-08-15T12:00:00Z'; // 7 days away
  const escalated = calculateEscalatedUrgency(2, deadline, now);
  assert.equal(escalated, 2);
});
