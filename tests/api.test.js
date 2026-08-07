// tests/api.test.js
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

test('API Service - Fetches default columns and tasks', () => {
  const db = setupTestDb();
  const columns = db.prepare('SELECT * FROM columns ORDER BY position ASC').all();
  assert.equal(columns.length, 4);

  createTask(db, { column_id: 1, title: 'API Test Task' });
  const tasks = db.prepare('SELECT * FROM tasks').all();
  assert.equal(tasks.length, 1);
  assert.equal(tasks[0].title, 'API Test Task');
});

test('API Service - Schema execution is idempotent and avoids duplicate columns', () => {
  const db = setupTestDb();
  const schemaSql = fs.readFileSync(path.join(__dirname, '../db/schema.sql'), 'utf8');

  // Execute schema 3 more times
  db.exec(schemaSql);
  db.exec(schemaSql);
  db.exec(schemaSql);

  const columns = db.prepare('SELECT * FROM columns ORDER BY position ASC').all();
  assert.equal(columns.length, 4);
});

test('API Service - Calculates 1-5 scale Priority Score correctly', () => {
  const db = setupTestDb();
  const task = createTask(db, {
    column_id: 1,
    title: 'High Priority Task',
    urgency_level: 5,
    importance_level: 4
  });

  assert.equal(task.urgency_level, 5);
  assert.equal(task.importance_level, 4);
  assert.equal(task.priority_score, 20);
});

test('API Service - Moves task and rejects WIP limit overflow', () => {
  const db = setupTestDb();
  const backlogId = 1;
  const readyId = 2; // WIP limit: 3

  // Fill Ready to Start
  createTask(db, { column_id: readyId, title: 'Task 1' });
  createTask(db, { column_id: readyId, title: 'Task 2' });
  createTask(db, { column_id: readyId, title: 'Task 3' });

  const extraTask = createTask(db, { column_id: backlogId, title: 'Extra Task' });

  assert.throws(
    () => moveTask(db, extraTask.id, readyId, 0),
    { message: 'WIP limit reached for this column (Max: 3)' }
  );
});
