// tests/wip-limit.test.js
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
