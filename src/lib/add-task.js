// src/lib/add-task.js
// Defaults over questions: title only is enough. Today, next free slot, 1h, Later.
import { QUADRANT_LEVELS } from './priority.js';
import { blocksOf, nextFreeSlot, formatTime, toIso } from './schedule.js';

export const LENGTHS = [15, 30, 60, 120];
export const DEFAULT_CHOICES = { quadrant: 'later', projectId: null, day: 'today', minutes: 60 };
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
