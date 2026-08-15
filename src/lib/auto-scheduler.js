// src/lib/auto-scheduler.js

/**
 * Process automatic task state transitions based on wall-clock time and schedule boundaries.
 * 
 * Rules:
 * 1. If now >= schedule_end and task is not in Done column -> transition to Done (reason: 'end')
 * 2. If now >= schedule_start and now < schedule_end and task is in Backlog/Ready to Start -> transition to In Progress (reason: 'start')
 *
 * @param {Array} tasks - Array of task objects
 * @param {Array} columns - Array of column objects ({ id, name, wip_limit })
 * @param {Date|string} nowInput - Current reference time
 * @returns {Array} List of proposed transitions [{ taskId, task, targetColumnId, targetColumnName, reason }]
 */
export function processAutoTransitions(tasks, columns, nowInput = new Date()) {
  if (!tasks || !columns) return [];

  const now = typeof nowInput === 'string' ? new Date(nowInput) : new Date(nowInput);
  if (isNaN(now.getTime())) return [];

  const inProgressCol = columns.find((c) => c.name === 'In Progress');
  const doneCol = columns.find((c) => c.name === 'Done');

  if (!doneCol || !inProgressCol) return [];

  const transitions = [];

  for (const task of tasks) {
    if (!task.schedule_start) continue;

    const startTime = new Date(task.schedule_start);
    const endTime = task.schedule_end ? new Date(task.schedule_end) : null;

    if (isNaN(startTime.getTime())) continue;

    const isAlreadyDone = Number(task.column_id) === Number(doneCol.id);
    const isAlreadyInProgress = Number(task.column_id) === Number(inProgressCol.id);

    // Rule 1: End time passed -> move to Done
    if (endTime && !isNaN(endTime.getTime()) && now >= endTime) {
      if (!isAlreadyDone) {
        transitions.push({
          taskId: Number(task.id),
          task,
          targetColumnId: doneCol.id,
          targetColumnName: doneCol.name,
          reason: 'end'
        });
      }
      continue;
    }

    // Rule 2: Start time reached (and before end time) -> move to In Progress
    if (now >= startTime && (!endTime || now < endTime)) {
      if (!isAlreadyInProgress && !isAlreadyDone) {
        transitions.push({
          taskId: Number(task.id),
          task,
          targetColumnId: inProgressCol.id,
          targetColumnName: inProgressCol.name,
          reason: 'start'
        });
      }
    }
  }

  return transitions;
}
