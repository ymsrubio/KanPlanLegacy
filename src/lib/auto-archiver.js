// src/lib/auto-archiver.js
// Identifies tasks in Done column that have been completed for > 24 hours.

const ARCHIVE_DELAY_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Identify completed tasks that are eligible for auto-archiving.
 * @param {Array} tasks List of active tasks
 * @param {Array} columns List of columns
 * @param {Date} [now=new Date()] Current reference time
 * @returns {Array<{ taskId: number, task: object, reason: string }>} Tasks to archive
 */
export function processAutoArchiving(tasks, columns, now = new Date()) {
  const doneCol = columns.find((c) => c.name === 'Done');
  if (!doneCol) return [];

  const nowMs = now.getTime();
  const toArchive = [];

  const doneTasks = tasks.filter((t) => Number(t.column_id) === Number(doneCol.id) && !t.is_archived);

  for (const task of doneTasks) {
    // Check completion timestamp: prefer completed_at, then schedule_end, then created_at
    const timeRefStr = task.completed_at || task.schedule_end || task.created_at;
    if (!timeRefStr) continue;

    const timeRefMs = new Date(timeRefStr).getTime();
    if (isNaN(timeRefMs)) continue;

    if (nowMs - timeRefMs >= ARCHIVE_DELAY_MS) {
      toArchive.push({
        taskId: task.id,
        task,
        reason: 'Completed over 24 hours ago'
      });
    }
  }

  return toArchive;
}
