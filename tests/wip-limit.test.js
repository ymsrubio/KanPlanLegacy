// tests/wip-limit.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Database = require('better-sqlite3');
const { createTask, moveTask } = require('../lib/task-service');

function setupTestDb() {
  const db = new Database(':memory:');
  const schemaSql = fs.readFileSync(path.join(__dirname, '../db/schema.sql'), 'utf8');
  db.exec(schemaSql);
  return db;
}

test('Allows adding tasks up to the column WIP limit', () => {
  const db = setupTestDb();
  const colId = 2; // 'Ready to Start' (WIP limit: 3)

  createTask(db, { column_id: colId, title: 'Task 1' });
  createTask(db, { column_id: colId, title: 'Task 2' });
  createTask(db, { column_id: colId, title: 'Task 3' });

  const count = db.prepare('SELECT COUNT(*) AS total FROM tasks WHERE column_id = ?').get(colId).total;
  assert.equal(count, 3);
});

test('Rejects adding a task when column WIP limit is reached', () => {
  const db = setupTestDb();
  const colId = 2; // WIP limit: 3

  createTask(db, { column_id: colId, title: 'Task 1' });
  createTask(db, { column_id: colId, title: 'Task 2' });
  createTask(db, { column_id: colId, title: 'Task 3' });

  assert.throws(
    () => createTask(db, { column_id: colId, title: 'Task 4' }),
    { message: 'WIP limit reached for this column (Max: 3)' }
  );
});

test('Allows moving a task into a column under its WIP limit', () => {
  const db = setupTestDb();
  const backlogId = 1; // Backlog (unlimited)
  const readyId = 2;   // Ready to Start (WIP limit: 3)

  const task = createTask(db, { column_id: backlogId, title: 'Backlog Task' });
  moveTask(db, task.id, readyId, 0);

  const updated = db.prepare('SELECT * FROM tasks WHERE id = ?').get(task.id);
  assert.equal(updated.column_id, readyId);
});

test('Rejects moving a task into a column that has reached its WIP limit', () => {
  const db = setupTestDb();
  const backlogId = 1;
  const readyId = 2; // WIP limit: 3

  // Fill 'Ready to Start' to max capacity (3 tasks)
  createTask(db, { column_id: readyId, title: 'Task 1' });
  createTask(db, { column_id: readyId, title: 'Task 2' });
  createTask(db, { column_id: readyId, title: 'Task 3' });

  // Task in backlog
  const backlogTask = createTask(db, { column_id: backlogId, title: 'Task 4' });

  // Attempt to move from backlog to full column
  assert.throws(
    () => moveTask(db, backlogTask.id, readyId, 0),
    { message: 'WIP limit reached for this column (Max: 3)' }
  );
});
