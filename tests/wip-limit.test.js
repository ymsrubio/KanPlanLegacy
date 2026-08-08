// tests/wip-limit.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import { createTask, moveTask } from '../lib/task-service.js';
import { findOrCreateAccount } from '../lib/auth-service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function setupTestDb() {
  const db = new Database(':memory:');
  const schemaSql = fs.readFileSync(path.join(__dirname, '../db/schema.sql'), 'utf8');
  db.exec(schemaSql);
  const account = findOrCreateAccount(db, { google_id: 'wip-test', email: 'wip@test.com', name: 'WIP Test' });
  return { db, accountId: account.id };
}

function getColumnId(db, accountId, name) {
  return db.prepare('SELECT id FROM columns WHERE account_id = ? AND name = ?').get(accountId, name).id;
}

test('Allows adding tasks up to the column WIP limit', () => {
  const { db, accountId } = setupTestDb();
  const colId = getColumnId(db, accountId, 'Ready to Start'); // WIP limit: 3

  createTask(db, accountId, { column_id: colId, title: 'Task 1' });
  createTask(db, accountId, { column_id: colId, title: 'Task 2' });
  createTask(db, accountId, { column_id: colId, title: 'Task 3' });

  const count = db.prepare('SELECT COUNT(*) AS total FROM tasks WHERE column_id = ? AND account_id = ?').get(colId, accountId).total;
  assert.equal(count, 3);
});

test('Rejects adding a task when column WIP limit is reached', () => {
  const { db, accountId } = setupTestDb();
  const colId = getColumnId(db, accountId, 'Ready to Start'); // WIP limit: 3

  createTask(db, accountId, { column_id: colId, title: 'Task 1' });
  createTask(db, accountId, { column_id: colId, title: 'Task 2' });
  createTask(db, accountId, { column_id: colId, title: 'Task 3' });

  assert.throws(
    () => createTask(db, accountId, { column_id: colId, title: 'Task 4' }),
    { message: 'WIP limit reached for this column (Max: 3)' }
  );
});

test('Allows moving a task into a column under its WIP limit', () => {
  const { db, accountId } = setupTestDb();
  const backlogId = getColumnId(db, accountId, 'Backlog');
  const readyId = getColumnId(db, accountId, 'Ready to Start'); // WIP limit: 3

  const task = createTask(db, accountId, { column_id: backlogId, title: 'Backlog Task' });
  moveTask(db, accountId, task.id, readyId, 0);

  const updated = db.prepare('SELECT * FROM tasks WHERE id = ? AND account_id = ?').get(task.id, accountId);
  assert.equal(updated.column_id, readyId);
});

test('Rejects moving a task into a column that has reached its WIP limit', () => {
  const { db, accountId } = setupTestDb();
  const backlogId = getColumnId(db, accountId, 'Backlog');
  const readyId = getColumnId(db, accountId, 'Ready to Start'); // WIP limit: 3

  createTask(db, accountId, { column_id: readyId, title: 'Task 1' });
  createTask(db, accountId, { column_id: readyId, title: 'Task 2' });
  createTask(db, accountId, { column_id: readyId, title: 'Task 3' });

  const backlogTask = createTask(db, accountId, { column_id: backlogId, title: 'Task 4' });

  assert.throws(
    () => moveTask(db, accountId, backlogTask.id, readyId, 0),
    { message: 'WIP limit reached for this column (Max: 3)' }
  );
});
