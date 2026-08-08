// tests/column-service.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Database = require('better-sqlite3');
const { createColumn, updateColumn, deleteColumn } = require('../lib/column-service');
const { findOrCreateAccount } = require('../lib/auth-service');

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
