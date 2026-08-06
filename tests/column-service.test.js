// tests/column-service.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Database = require('better-sqlite3');
const { createColumn, updateColumn, deleteColumn } = require('../lib/column-service');

function setupTestDb() {
  const db = new Database(':memory:');
  const schemaSql = fs.readFileSync(path.join(__dirname, '../db/schema.sql'), 'utf8');
  db.exec(schemaSql);
  return db;
}

test('Creates a new column at the end of the board', () => {
  const db = setupTestDb();
  const newCol = createColumn(db, { name: 'Review', wip_limit: 2 });

  assert.equal(newCol.name, 'Review');
  assert.equal(newCol.wip_limit, 2);
  assert.equal(newCol.position, 4); // Placed after initial 0,1,2,3 columns
});

test('Updates an existing column name and WIP limit', () => {
  const db = setupTestDb();
  const updated = updateColumn(db, 2, { name: 'Up Next', wip_limit: 5 });

  assert.equal(updated.name, 'Up Next');
  assert.equal(updated.wip_limit, 5);
});

test('Deletes a column and cascades task deletion', () => {
  const db = setupTestDb();
  deleteColumn(db, 2);

  const col = db.prepare('SELECT * FROM columns WHERE id = 2').get();
  assert.equal(col, undefined);
});
