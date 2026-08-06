// lib/column-service.js
// Service containing business logic for creating, updating, and deleting Kanban columns

function createColumn(db, { name, wip_limit = null }) {
  const row = db.prepare('SELECT MAX(position) AS maxPos FROM columns').get();
  const position = (row && row.maxPos !== null) ? row.maxPos + 1 : 0;

  const stmt = db.prepare('INSERT INTO columns (name, position, wip_limit) VALUES (?, ?, ?)');
  const result = stmt.run(name, position, wip_limit);

  return { id: result.lastInsertRowid, name, position, wip_limit };
}

function updateColumn(db, columnId, { name, wip_limit }) {
  const column = db.prepare('SELECT * FROM columns WHERE id = ?').get(columnId);
  if (!column) {
    throw new Error('Column not found');
  }

  const updatedName = name !== undefined ? name : column.name;
  const updatedWipLimit = wip_limit !== undefined ? wip_limit : column.wip_limit;

  db.prepare('UPDATE columns SET name = ?, wip_limit = ? WHERE id = ?').run(updatedName, updatedWipLimit, columnId);

  return { ...column, name: updatedName, wip_limit: updatedWipLimit };
}

function deleteColumn(db, columnId) {
  const column = db.prepare('SELECT * FROM columns WHERE id = ?').get(columnId);
  if (!column) {
    throw new Error('Column not found');
  }

  db.prepare('DELETE FROM columns WHERE id = ?').run(columnId);
  return true;
}

module.exports = {
  createColumn,
  updateColumn,
  deleteColumn
};
