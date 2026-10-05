// src/lib/matrix.js
// Backlog tasks grouped by quadrant, in the same order as the Add task priority picker.
import { quadrantOf, QUADRANT_ORDER, QUADRANT_LABEL, QUADRANT_HINT } from './priority.js';

export function buildMatrix(tasks, columns, projectId = null) {
  const backlog = columns.find((c) => c.name === 'Backlog');
  const mine = tasks.filter(
    (t) => backlog && !t.is_archived && Number(t.column_id) === Number(backlog.id) && (projectId == null || Number(t.project_id) === Number(projectId))
  );
  return QUADRANT_ORDER.map((key) => ({
    key,
    label: QUADRANT_LABEL[key],
    hint: QUADRANT_HINT[key],
    tasks: mine.filter((t) => quadrantOf(t) === key)
  }));
}
