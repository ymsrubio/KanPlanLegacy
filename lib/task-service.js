// lib/task-service.js
// Service containing core business logic for tasks and WIP limit enforcement.
// All functions require accountId for row-level isolation.

export function calculateEscalatedUrgency(baseUrgency, deadlineStr, nowMs = Date.now()) {
  let urgency = Math.min(5, Math.max(1, Number(baseUrgency || 3)));
  if (!deadlineStr) return urgency;

  const deadlineMs = new Date(deadlineStr).getTime();
  if (isNaN(deadlineMs)) return urgency;

  const diffMs = deadlineMs - nowMs;
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays <= 1) {
    return 5;
  } else if (diffDays <= 3) {
    return Math.max(urgency + 1, 4);
  }
  return urgency;
}

export function createTask(db, accountId, taskData) {
  const {
    column_id,
    project_id,
    title,
    description,
    is_urgent,
    is_important,
    urgency_level,
    importance_level,
    schedule_start,
    schedule_end,
    deadline,
    color_tag
  } = taskData;

  const rawUrgency = urgency_level !== undefined ? Number(urgency_level) : (is_urgent ? 4 : 2);
  const finalUrgency = calculateEscalatedUrgency(rawUrgency, deadline);
  const finalImportance = importance_level !== undefined ? Math.min(5, Math.max(1, Number(importance_level))) : (is_important ? 4 : 2);

  // 1. Fetch column (must belong to this account)
  const column = db.prepare('SELECT wip_limit FROM columns WHERE id = ? AND account_id = ?').get(column_id, accountId);
  if (!column) {
    throw new Error('Column not found');
  }

  // 2. Validate WIP limit (count only this account's tasks)
  if (column.wip_limit !== null) {
    const { total } = db.prepare('SELECT COUNT(*) AS total FROM tasks WHERE column_id = ? AND account_id = ?').get(column_id, accountId);
    if (total >= column.wip_limit) {
      throw new Error(`WIP limit reached for this column (Max: ${column.wip_limit})`);
    }
  }

  // 3. Insert task
  const stmt = db.prepare(`
    INSERT INTO tasks (account_id, column_id, project_id, title, description, is_urgent, is_important, urgency_level, importance_level, schedule_start, schedule_end, deadline, color_tag)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    accountId,
    column_id,
    project_id ? Number(project_id) : null,
    title,
    description || null,
    finalUrgency >= 4 ? 1 : 0,
    finalImportance >= 4 ? 1 : 0,
    finalUrgency,
    finalImportance,
    schedule_start || null,
    schedule_end || null,
    deadline || null,
    color_tag || '#3b82f6'
  );

  return {
    id: result.lastInsertRowid,
    ...taskData,
    account_id: accountId,
    project_id: project_id ? Number(project_id) : null,
    urgency_level: finalUrgency,
    importance_level: finalImportance,
    priority_score: finalUrgency * finalImportance
  };
}

export function moveTask(db, accountId, taskId, targetColumnId, newPosition = 0) {
  // 1. Fetch task (must belong to this account)
  const task = db.prepare('SELECT * FROM tasks WHERE id = ? AND account_id = ?').get(taskId, accountId);
  if (!task) {
    throw new Error('Task not found');
  }

  // 2. Validate WIP limit on target column if changing columns
  if (task.column_id !== targetColumnId) {
    const targetColumn = db.prepare('SELECT wip_limit FROM columns WHERE id = ? AND account_id = ?').get(targetColumnId, accountId);
    if (!targetColumn) {
      throw new Error('Target column not found');
    }

    if (targetColumn.wip_limit !== null) {
      const { total } = db.prepare('SELECT COUNT(*) AS total FROM tasks WHERE column_id = ? AND account_id = ?').get(targetColumnId, accountId);
      if (total >= targetColumn.wip_limit) {
        throw new Error(`WIP limit reached for this column (Max: ${targetColumn.wip_limit})`);
      }
    }
  }

  // 3. Update task location
  db.prepare('UPDATE tasks SET column_id = ?, position = ? WHERE id = ? AND account_id = ?').run(targetColumnId, newPosition, taskId, accountId);

  return { ...task, column_id: targetColumnId, position: newPosition };
}

export function getTasks(db, accountId) {
  return db.prepare(`
    SELECT * FROM tasks
    WHERE account_id = ? AND (is_archived = 0 OR is_archived IS NULL)
    ORDER BY position ASC, id ASC
  `).all(accountId);
}

export function getArchivedTasks(db, accountId) {
  return db.prepare(`
    SELECT * FROM tasks
    WHERE account_id = ? AND is_archived = 1
    ORDER BY archived_at DESC, id DESC
  `).all(accountId);
}

export function archiveTask(db, accountId, taskId) {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ? AND account_id = ?').get(taskId, accountId);
  if (!task) {
    throw new Error('Task not found or unauthorized');
  }

  const nowIso = new Date().toISOString();
  db.prepare(`
    UPDATE tasks
    SET is_archived = 1, archived_at = ?
    WHERE id = ? AND account_id = ?
  `).run(nowIso, taskId, accountId);

  return { ...task, is_archived: 1, archived_at: nowIso };
}

export function restoreTask(db, accountId, taskId) {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ? AND account_id = ?').get(taskId, accountId);
  if (!task) {
    throw new Error('Task not found or unauthorized');
  }

  db.prepare(`
    UPDATE tasks
    SET is_archived = 0, archived_at = NULL
    WHERE id = ? AND account_id = ?
  `).run(taskId, accountId);

  return { ...task, is_archived: 0, archived_at: null };
}

export function deleteTask(db, accountId, taskId) {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ? AND account_id = ?').get(taskId, accountId);
  if (!task) {
    throw new Error('Task not found');
  }

  db.prepare('DELETE FROM tasks WHERE id = ? AND account_id = ?').run(taskId, accountId);
  return true;
}
