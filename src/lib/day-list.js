// src/lib/day-list.js
// Pure grouping logic for the day list. Scores/tiers come from priority.js only.
import { scoreOf, tierOf, sortByScore } from './priority.js';
import { formatTime } from './schedule.js';

// Decoration only (project colors carry no meaning). Solids of proj-1..proj-5; repeats after the fifth.
export const PROJECT_COLORS = ['#99bab9', '#ccd5ae', '#e4acb2', '#c5bde0', '#a9c3e0'];
export const projectSlot = (index) => ((index % 5) + 5) % 5 + 1;
export const projectColor = (index) => PROJECT_COLORS[projectSlot(index) - 1];

export const BACKLOG_ROWS = 4;

const MARKS = { critical: 'Critical priority', high: 'High priority' };
export const priorityMark = (score) => {
  const level = tierOf(score);
  return MARKS[level] ? { level, label: MARKS[level] } : null;
};

const sameDay = (a, b) => a.toDateString() === b.toDateString();

// "Client work · 9:00 AM" today, "Admin · Fri" on another day.
export function chipLabel(task, projectName, now = new Date()) {
  const start = task.schedule_start ? new Date(task.schedule_start) : null;
  const when = start && (sameDay(start, now) ? formatTime(start) : start.toLocaleDateString('en-US', { weekday: 'short' }));
  return [projectName, when].filter(Boolean).join(' · ') || null;
}

const GROUPS = [
  ['inProgress', 'In progress', 'in progress'],
  ['ready', 'Ready to start', 'ready to start'],
  ['backlog', 'Backlog', 'backlog'],
  ['done', 'Done', 'done']
];

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
