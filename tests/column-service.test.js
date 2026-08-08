// tests/column-service.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import { createColumn, updateColumn, deleteColumn } from '../lib/column-service.js';
import { findOrCreateAccount } from '../lib/auth-service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function setupTestDb() {
  const db = new Database(':memory:');
  const schemaSql = fs.readFileSync(path.join(__dirname, '../db/schema.sql'), 'utf8');
  db.exec(schemaSql);
  const account = findOrCreateAccount(db, { google_id: 'col-test', email: 'col@test.com', name: 'Col Test' });
  return { db, accountId: account.id };
}

function getColumnId(db, accountId, name) {
  return db.prepare('SELECT id FROM columns WHERE account_id = ? AND name = ?').get(accountId, name).id;
}

test('Creates a new column at the end of the board', () => {
  const { db, accountId } = setupTestDb();
  const newCol = createColumn(db, accountId, { name: 'Review', wip_limit: 2 });

  assert.equal(newCol.name, 'Review');
  assert.equal(newCol.wip_limit, 2);
  assert.equal(newCol.position, 4); // After default 0,1,2,3
});

test('Updates an existing column name and WIP limit', () => {
  const { db, accountId } = setupTestDb();
  const readyId = getColumnId(db, accountId, 'Ready to Start');
  const updated = updateColumn(db, accountId, readyId, { name: 'Up Next', wip_limit: 5 });

  assert.equal(updated.name, 'Up Next');
  assert.equal(updated.wip_limit, 5);
});

test('Deletes a column', () => {
  const { db, accountId } = setupTestDb();
  const readyId = getColumnId(db, accountId, 'Ready to Start');
  deleteColumn(db, accountId, readyId);

  const col = db.prepare('SELECT * FROM columns WHERE id = ? AND account_id = ?').get(readyId, accountId);
  assert.equal(col, undefined);
});
