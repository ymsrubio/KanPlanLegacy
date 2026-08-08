// tests/schema.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Database = require('better-sqlite3');
const { findOrCreateAccount } = require('../lib/auth-service');

test('Initializes database schema and seeds default columns via account creation', () => {
  const db = new Database(':memory:');
  const schemaSql = fs.readFileSync(path.join(__dirname, '../db/schema.sql'), 'utf8');
  db.exec(schemaSql);

  // Schema alone seeds no columns — they come from account provisioning
  const emptyColumns = db.prepare('SELECT * FROM columns').all();
  assert.equal(emptyColumns.length, 0, 'No columns before account creation');

  // Create account — triggers default column seeding
  const account = findOrCreateAccount(db, { google_id: 'test-1', email: 'a@test.com', name: 'A' });
  const columns = db.prepare('SELECT * FROM columns WHERE account_id = ? ORDER BY position ASC').all(account.id);

  assert.equal(columns.length, 4);
  assert.equal(columns[0].name, 'Backlog');
  assert.equal(columns[0].wip_limit, null);
  assert.equal(columns[1].name, 'Ready to Start');
  assert.equal(columns[1].wip_limit, 3);
  assert.equal(columns[2].name, 'In Progress');
  assert.equal(columns[2].wip_limit, 2);
  assert.equal(columns[3].name, 'Done');
  assert.equal(columns[3].wip_limit, null);
});
