// src/lib/day-list.js
// Pure grouping logic for the day list. Scores/tiers come from priority.js only.
import { scoreOf, tierOf, sortByScore } from './priority.js';

// Decoration only (see guide: project colors carry no meaning). Repeats after the fifth.
export const PROJECT_COLORS = ['#ff4f00', '#2f6f73', '#7a5af8', '#b54708', '#4d7c0f'];
export const projectColor = (index) => PROJECT_COLORS[((index % 5) + 5) % 5];

const MARKS = { critical: { text: '▲▲', label: 'Critical priority' }, high: { text: '▲', label: 'High priority' } };
export const priorityMark = (score) => MARKS[tierOf(score)] ?? null;

const GROUPS = [['inProgress', 'In progress', 'in progress'], ['ready', 'Ready to start', 'ready to start'], ['backlog', 'Backlog', 'backlog']];

export function buildDayList(tasks, columns, projectId = null) {
  const active = tasks.filter((t) => !t.is_archived);
  const visible = projectId == null ? active : active.filter((t) => Number(t.project_id) === Number(projectId));
  const groups = GROUPS.map(([key, name, match]) => {
    const col = columns.find((c) => c.name.toLowerCase() === match);
    const mine = col ? visible.filter((t) => Number(t.column_id) === Number(col.id)) : [];
    const limit = col?.wip_limit ?? null;
    return { key, name, limit, used: mine.length, full: limit !== null && mine.length >= limit, tasks: sortByScore(mine, scoreOf) };
  });
  const next = groups[1].tasks[0] ?? groups[2].tasks[0];
  const shown = groups.reduce((n, g) => n + g.used, 0);
  const state = shown > 0 ? 'ok' : active.length > 0 && projectId != null ? 'filtered' : 'empty';
  return { groups, nextId: next?.id ?? null, state };
}
