// lib/column-service.js
// Service containing business logic for creating, updating, and deleting Kanban columns.
// All functions require accountId for row-level isolation.

function createColumn(db, accountId, { name, wip_limit = null }) {
  const row = db.prepare('SELECT MAX(position) AS maxPos FROM columns WHERE account_id = ?').get(accountId);
  const position = (row && row.maxPos !== null) ? row.maxPos + 1 : 0;

  const stmt = db.prepare('INSERT INTO columns (account_id, name, position, wip_limit) VALUES (?, ?, ?, ?)');
  const result = stmt.run(accountId, name, position, wip_limit);

  return { id: result.lastInsertRowid, account_id: accountId, name, position, wip_limit };
}

function updateColumn(db, accountId, columnId, { name, wip_limit }) {
  const column = db.prepare('SELECT * FROM columns WHERE id = ? AND account_id = ?').get(columnId, accountId);
  if (!column) {
    throw new Error('Column not found');
  }

  const updatedName = name !== undefined ? name : column.name;
  const updatedWipLimit = wip_limit !== undefined ? wip_limit : column.wip_limit;

  db.prepare('UPDATE columns SET name = ?, wip_limit = ? WHERE id = ? AND account_id = ?').run(updatedName, updatedWipLimit, columnId, accountId);

  return { ...column, name: updatedName, wip_limit: updatedWipLimit };
}

function deleteColumn(db, accountId, columnId) {
  const column = db.prepare('SELECT * FROM columns WHERE id = ? AND account_id = ?').get(columnId, accountId);
  if (!column) {
    throw new Error('Column not found');
  }

  db.prepare('DELETE FROM columns WHERE id = ? AND account_id = ?').run(columnId, accountId);
  return true;
}

module.exports = {
  createColumn,
  updateColumn,
  deleteColumn
};
