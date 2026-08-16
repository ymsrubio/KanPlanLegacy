// tests/archive-service.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import {
  createTask,
  getTasks,
  getArchivedTasks,
  archiveTask,
  restoreTask
} from '../lib/task-service.js';
import { findOrCreateAccount } from '../lib/auth-service.js';
import { processAutoArchiving } from '../src/lib/auto-archiver.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function setupTestDb() {
  const db = new Database(':memory:');
  const schemaSql = fs.readFileSync(path.join(__dirname, '../db/schema.sql'), 'utf8');
  db.exec(schemaSql);
  const accountA = findOrCreateAccount(db, { google_id: 'user-a', email: 'a@test.com', name: 'User A' });
  const accountB = findOrCreateAccount(db, { google_id: 'user-b', email: 'b@test.com', name: 'User B' });
  return { db, accountAId: accountA.id, accountBId: accountB.id };
}

test('archive-service - getTasks excludes archived tasks by default', () => {
  const { db, accountAId } = setupTestDb();
  const col = db.prepare('SELECT id FROM columns WHERE account_id = ?').get(accountAId);

  const activeTask = createTask(db, accountAId, { column_id: col.id, title: 'Active Task' });
  const taskToArchive = createTask(db, accountAId, { column_id: col.id, title: 'Archived Task' });

  archiveTask(db, accountAId, taskToArchive.id);

  const tasks = getTasks(db, accountAId);
  assert.equal(tasks.length, 1);
  assert.equal(tasks[0].id, activeTask.id);
});

test('archive-service - getArchivedTasks returns only archived tasks for account', () => {
  const { db, accountAId, accountBId } = setupTestDb();
  const colA = db.prepare('SELECT id FROM columns WHERE account_id = ?').get(accountAId);
  const colB = db.prepare('SELECT id FROM columns WHERE account_id = ?').get(accountBId);

  const taskA = createTask(db, accountAId, { column_id: colA.id, title: 'Task A' });
  const taskB = createTask(db, accountBId, { column_id: colB.id, title: 'Task B' });

  archiveTask(db, accountAId, taskA.id);
  archiveTask(db, accountBId, taskB.id);

  const aArchived = getArchivedTasks(db, accountAId);
  assert.equal(aArchived.length, 1);
  assert.equal(aArchived[0].id, taskA.id);
  assert.equal(aArchived[0].title, 'Task A');
  assert.equal(aArchived[0].is_archived, 1);
  assert.ok(aArchived[0].archived_at);

  const bArchived = getArchivedTasks(db, accountBId);
  assert.equal(bArchived.length, 1);
  assert.equal(bArchived[0].id, taskB.id);
});

test('archive-service - restoreTask moves task back to active list', () => {
  const { db, accountAId } = setupTestDb();
  const col = db.prepare('SELECT id FROM columns WHERE account_id = ?').get(accountAId);

  const task = createTask(db, accountAId, { column_id: col.id, title: 'Will Be Restored' });
  archiveTask(db, accountAId, task.id);
  assert.equal(getTasks(db, accountAId).length, 0);

  const restored = restoreTask(db, accountAId, task.id);
  assert.equal(restored.is_archived, 0);
  assert.equal(restored.archived_at, null);

  const activeTasks = getTasks(db, accountAId);
  assert.equal(activeTasks.length, 1);
  assert.equal(activeTasks[0].id, task.id);
});

test('archive-service - account isolation prevents archiving another account task', () => {
  const { db, accountAId, accountBId } = setupTestDb();
  const colB = db.prepare('SELECT id FROM columns WHERE account_id = ?').get(accountBId);

  const taskB = createTask(db, accountBId, { column_id: colB.id, title: 'Account B Task' });

  assert.throws(() => {
    archiveTask(db, accountAId, taskB.id);
  }, /not found or unauthorized/i);
});

test('auto-archiver - processAutoArchiving identifies Done tasks completed over 24h ago', () => {
  const now = new Date('2026-08-16T12:00:00Z');
  const columns = [
    { id: 1, name: 'Backlog' },
    { id: 2, name: 'Ready to Start' },
    { id: 3, name: 'In Progress' },
    { id: 4, name: 'Done' }
  ];

  const tasks = [
    // Completed 30 hours ago (should be archived)
    {
      id: 101,
      title: 'Old Done Task',
      column_id: 4,
      schedule_end: '2026-08-15T06:00:00Z',
      completed_at: '2026-08-15T06:00:00Z'
    },
    // Completed 2 hours ago (should NOT be archived)
    {
      id: 102,
      title: 'Recent Done Task',
      column_id: 4,
      schedule_end: '2026-08-16T10:00:00Z',
      completed_at: '2026-08-16T10:00:00Z'
    },
    // In Progress task > 24h ago (should NOT be archived because not in Done)
    {
      id: 103,
      title: 'Active In Progress Task',
      column_id: 3,
      schedule_end: '2026-08-14T10:00:00Z'
    }
  ];

  const toArchive = processAutoArchiving(tasks, columns, now);
  assert.equal(toArchive.length, 1);
  assert.equal(toArchive[0].taskId, 101);
  assert.equal(toArchive[0].task.title, 'Old Done Task');
});
