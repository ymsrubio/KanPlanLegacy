// src/lib/phase-movement.js
// Helpers for adjacent column phase movement and WIP capacity validation.

/**
 * Gets the next column in position order.
 * @param {Array} columns 
 * @param {number|string} currentColumnId 
 * @returns {Object|null}
 */
export function getNextColumn(columns, currentColumnId) {
  if (!Array.isArray(columns) || columns.length === 0) return null;
  const sorted = [...columns].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  const currentIdx = sorted.findIndex(c => String(c.id) === String(currentColumnId));
  if (currentIdx === -1 || currentIdx >= sorted.length - 1) return null;
  return sorted[currentIdx + 1];
}

/**
 * Gets the previous column in position order.
 * @param {Array} columns 
 * @param {number|string} currentColumnId 
 * @returns {Object|null}
 */
export function getPrevColumn(columns, currentColumnId) {
  if (!Array.isArray(columns) || columns.length === 0) return null;
  const sorted = [...columns].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  const currentIdx = sorted.findIndex(c => String(c.id) === String(currentColumnId));
  if (currentIdx <= 0) return null;
  return sorted[currentIdx - 1];
}

/**
 * Validates if moving a task to a target column would exceed its WIP limit.
 * @param {Array} tasks 
 * @param {Object} targetColumn 
 * @param {number|string} movingTaskId 
 * @returns {boolean}
 */
export function canMoveToColumn(tasks, targetColumn, movingTaskId) {
  if (!targetColumn) return false;
  if (!targetColumn.wip_limit) return true; // No WIP limit

  const currentCount = (tasks || []).filter(
    t => String(t.column_id) === String(targetColumn.id) && String(t.id) !== String(movingTaskId)
  ).length;

  return currentCount < targetColumn.wip_limit;
}
