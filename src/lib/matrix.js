// src/lib/matrix.js
// Tasks grouped by quadrant, in the same order as the Add task priority picker.
// 'notStarted' is the Backlog; 'all' adds Ready to start and In progress (Done stays out).
import { quadrantOf, QUADRANT_ORDER, QUADRANT_LABEL, QUADRANT_HINT } from './priority.js';

export const MATRIX_FILTERS = [['notStarted', 'Not started'], ['all', 'All']];

export function buildMatrix(tasks, columns, projectId = null, filter = 'notStarted') {
  const shown = new Set(
    columns.filter((c) => (filter === 'all' ? c.name !== 'Done' : c.name === 'Backlog')).map((c) => Number(c.id))
  );
  const mine = tasks.filter(
    (t) => !t.is_archived && shown.has(Number(t.column_id)) && (projectId == null || Number(t.project_id) === Number(projectId))
  );
  return QUADRANT_ORDER.map((key) => ({
    key,
    label: QUADRANT_LABEL[key],
    hint: QUADRANT_HINT[key],
    tasks: mine.filter((t) => quadrantOf(t) === key)
  }));
}

// Free places in Ready to start. limit is null when the column has no WIP limit.
export function readyRoom(tasks, columns) {
  const ready = columns.find((c) => c.name === 'Ready to Start');
  if (!ready) return { limit: null, used: 0, open: null };
  const used = tasks.filter((t) => !t.is_archived && Number(t.column_id) === Number(ready.id)).length;
  const limit = ready.wip_limit ?? null;
  return { limit, used, open: limit == null ? null : Math.max(0, limit - used) };
}

export const roomNote = (open) => (open == null ? '' : open === 0 ? 'Ready is full' : `${open} ${open === 1 ? 'spot' : 'spots'} open in Ready`);
