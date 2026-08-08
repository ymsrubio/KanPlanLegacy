// tests/schema.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import { findOrCreateAccount } from '../lib/auth-service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
