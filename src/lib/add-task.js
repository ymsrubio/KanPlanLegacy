// src/lib/add-task.js
// Defaults over questions: title only is enough. Backlog, no time, Later.
// A time is chosen when the task moves into Ready to start (issue 99); "Add a time" still schedules on add.
import { QUADRANT_LEVELS } from './priority.js';
import { blocksOf, nextFreeSlot, formatTime, toIso } from './schedule.js';

export const LENGTHS = [15, 30, 60, 120];
export const DEFAULT_CHOICES = { quadrant: 'later', projectId: null, day: 'none', minutes: 60 };
const TOMORROW_START_HOUR = 9;

export const lengthLabel = (m) => (m < 60 ? `${m}m` : m % 60 === 0 ? `${m / 60}h` : `${Math.floor(m / 60)}h ${m % 60}m`);
export const nameTaken = (projects, name) => projects.some((p) => p.name.trim().toLowerCase() === name.trim().toLowerCase());

// Start of the chosen slot, or null when unscheduled.
export function slotStart(day, minutes, { tasks, columns, now = new Date() }) {
  if (day === 'none') return null;
  const from = new Date(now);
  if (day === 'tomorrow') { from.setDate(from.getDate() + 1); from.setHours(TOMORROW_START_HOUR, 0, 0, 0); }
  return nextFreeSlot(blocksOf(tasks, columns), from, minutes);
}

// "2:00 PM", "2pm", "14:00" -> minutes since midnight, or null.
export function parseClock(text) {
  const m = /^(\d{1,2})(?::(\d{2}))?\s*([ap])?m?$/i.exec(text.trim());
  if (!m) return null;
  let h = Number(m[1]);
  const min = Number(m[2] ?? 0);
  if (min > 59 || h > 23) return null;
  if (m[3]) {
    if (h < 1 || h > 12) return null;
    h = (h % 12) + (m[3].toLowerCase() === 'p' ? 12 : 0);
  }
  return h * 60 + min;
}

// The start the When picker shows: the next free slot on the chosen day (or picked 'YYYY-MM-DD' date),
// moved to a typed clock when one parses. Null when unscheduled.
export function resolveStart({ day, date = null, minutes, startText = null }, ctx) {
  if (day === 'none') return null;
  const auto = date ? nextFreeSlot(blocksOf(ctx.tasks, ctx.columns), new Date(`${date}T09:00:00`), minutes) : slotStart(day, minutes, ctx);
  const clock = startText == null ? null : parseClock(startText);
  if (clock == null) return auto;
  const start = new Date(auto);
  start.setHours(Math.floor(clock / 60), clock % 60, 0, 0);
  return start;
}

export function whenLabel(day, minutes, start) {
  if (day === 'none' || !start) return 'No time';
  return `${day === 'tomorrow' ? 'Tomorrow' : 'Today'} ${formatTime(start)} · ${lengthLabel(minutes)}`;
}

export function buildTask(choices, ctx) {
  const { title = '', quadrant, projectId, day, minutes } = { ...DEFAULT_CHOICES, ...choices };
  if (!title.trim()) throw new Error('Task title is required');
  const start = slotStart(day, minutes, ctx);
  const backlog = ctx.columns.find((c) => c.name === 'Backlog') ?? ctx.columns[0];
  return {
    title: title.trim(),
    column_id: backlog?.id,
    project_id: projectId ?? null,
    ...QUADRANT_LEVELS[quadrant],
    schedule_start: start ? toIso(start) : null,
    schedule_end: start ? toIso(new Date(start.getTime() + minutes * 60000)) : null
  };
}
