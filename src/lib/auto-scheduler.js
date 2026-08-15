// src/lib/auto-scheduler.js

/**
 * Process automatic task state transitions based on wall-clock time and schedule boundaries.
 * 
 * Rules:
 * 1. If now >= schedule_end and task is not in Done column -> transition to Done (reason: 'end')
 * 2. If now >= schedule_start and now < schedule_end and task is in Backlog/Ready to Start -> transition to In Progress (reason: 'start')
 *    - Respects WIP limit: if In Progress is at capacity, flags wipOverflow and calculates demoteCandidateId (lowest priority in In Progress).
 *
 * @param {Array} tasks - Array of task objects
 * @param {Array} columns - Array of column objects ({ id, name, wip_limit })
 * @param {Date|string} nowInput - Current reference time
 * @returns {Array} List of proposed transitions [{ taskId, task, targetColumnId, targetColumnName, reason, wipOverflow, demoteCandidateId }]
 */
export function processAutoTransitions(tasks, columns, nowInput = new Date()) {
  if (!tasks || !columns) return [];

  const now = typeof nowInput === 'string' ? new Date(nowInput) : new Date(nowInput);
  if (isNaN(now.getTime())) return [];

  const inProgressCol = columns.find((c) => c.name === 'In Progress');
  const doneCol = columns.find((c) => c.name === 'Done');

  if (!doneCol || !inProgressCol) return [];

  const transitions = [];
  const currentInProgressTasks = tasks.filter((t) => Number(t.column_id) === Number(inProgressCol.id));

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
        let wipOverflow = false;
        let demoteCandidateId = null;

        if (inProgressCol.wip_limit !== null && currentInProgressTasks.length >= inProgressCol.wip_limit) {
          wipOverflow = true;
          // Find lowest priority score in current In Progress tasks
          const sorted = [...currentInProgressTasks].sort((a, b) => {
            const scoreA = a.priority_score || ((a.urgency_level || 3) * (a.importance_level || 3));
            const scoreB = b.priority_score || ((b.urgency_level || 3) * (b.importance_level || 3));
            return scoreA - scoreB;
          });
          if (sorted.length > 0) {
            demoteCandidateId = Number(sorted[0].id);
          }
        }

        transitions.push({
          taskId: Number(task.id),
          task,
          targetColumnId: inProgressCol.id,
          targetColumnName: inProgressCol.name,
          reason: 'start',
          wipOverflow,
          demoteCandidateId
        });
      }
    }
  }

  return transitions;
}
