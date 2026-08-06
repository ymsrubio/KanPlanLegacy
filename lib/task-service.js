// lib/task-service.js
// Service containing core business logic for tasks and WIP limit enforcement

function createTask(db, taskData) {
  const {
    column_id,
    title,
    description,
    is_urgent,
    is_important,
    schedule_start,
    schedule_end,
    deadline,
    color_tag
  } = taskData;

  // 1. Fetch column to check WIP limit
  const column = db.prepare('SELECT wip_limit FROM columns WHERE id = ?').get(column_id);
  if (!column) {
    throw new Error('Column not found');
  }

  // 2. Validate WIP limit
  if (column.wip_limit !== null) {
    const { total } = db.prepare('SELECT COUNT(*) AS total FROM tasks WHERE column_id = ?').get(column_id);
    if (total >= column.wip_limit) {
      throw new Error(`WIP limit reached for this column (Max: ${column.wip_limit})`);
    }
  }

  // 3. Insert task
  const stmt = db.prepare(`
    INSERT INTO tasks (column_id, title, description, is_urgent, is_important, schedule_start, schedule_end, deadline, color_tag)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    column_id,
    title,
    description || null,
    is_urgent ? 1 : 0,
    is_important ? 1 : 0,
    schedule_start || null,
    schedule_end || null,
    deadline || null,
    color_tag || '#3b82f6'
  );

  return { id: result.lastInsertRowid, ...taskData };
}

function moveTask(db, taskId, targetColumnId, newPosition = 0) {
  // 1. Fetch task
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
  if (!task) {
    throw new Error('Task not found');
  }

  // 2. Validate WIP limit on target column if changing columns
  if (task.column_id !== targetColumnId) {
    const targetColumn = db.prepare('SELECT wip_limit FROM columns WHERE id = ?').get(targetColumnId);
    if (!targetColumn) {
      throw new Error('Target column not found');
    }

    if (targetColumn.wip_limit !== null) {
      const { total } = db.prepare('SELECT COUNT(*) AS total FROM tasks WHERE column_id = ?').get(targetColumnId);
      if (total >= targetColumn.wip_limit) {
        throw new Error(`WIP limit reached for this column (Max: ${targetColumn.wip_limit})`);
      }
    }
  }

  // 3. Update task location
  db.prepare('UPDATE tasks SET column_id = ?, position = ? WHERE id = ?').run(targetColumnId, newPosition, taskId);

  return { ...task, column_id: targetColumnId, position: newPosition };
}

module.exports = {
  createTask,
  moveTask
};
