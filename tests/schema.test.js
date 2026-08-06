// tests/schema.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Database = require('better-sqlite3');

test('Initializes database schema and seeds default columns', () => {
  // 1. Create temporary in-memory SQLite database
  const db = new Database(':memory:');

  // 2. Read and execute the SQL schema script
  const schemaSql = fs.readFileSync(path.join(__dirname, '../db/schema.sql'), 'utf8');
  db.exec(schemaSql);

  // 3. Query all columns from the database
  const columns = db.prepare('SELECT * FROM columns ORDER BY position ASC').all();

  // 4. Verify default columns exist
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
