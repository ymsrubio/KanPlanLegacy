// src/lib/schedule.js
// Pure time-block helpers shared by Add task and the calendar. Times are local wall-clock.
import { formatLocalIso } from './time-utils.js';

const MIN = 60000;
export const SNAP_MIN = 5;
const DEFAULT_MIN = 60;

export function snapUp(date) {
  const d = new Date(date);
  d.setSeconds(0, 0);
  const rem = d.getMinutes() % SNAP_MIN;
  if (rem) d.setMinutes(d.getMinutes() + SNAP_MIN - rem);
  return d;
}

// Scheduled, not-done tasks as {id, start, end} Dates, sorted by start.
export function blocksOf(tasks, columns = []) {
  const done = columns.find((c) => c.name === 'Done');
  return tasks
    .filter((t) => t.schedule_start && !(done && Number(t.column_id) === Number(done.id)))
    .map((t) => {
      const start = new Date(t.schedule_start);
      return { id: t.id, start, end: t.schedule_end ? new Date(t.schedule_end) : new Date(start.getTime() + DEFAULT_MIN * MIN) };
    })
    .sort((a, b) => a.start - b.start);
}

const collides = (b, start, end) => b.start < end && b.end > start;

export function findOverlap(blocks, id, start, end) {
  return blocks.find((b) => Number(b.id) !== Number(id) && collides(b, start, end)) ?? null;
}

// First free slot of `minutes` at or after `from`, snapped to 5 minutes.
export function nextFreeSlot(blocks, from, minutes, ignoreId = null) {
  let t = snapUp(from);
  for (const b of blocks) { // sorted by start, so t only moves forward
    if (Number(b.id) === Number(ignoreId)) continue;
    if (collides(b, t, new Date(t.getTime() + minutes * MIN))) t = snapUp(b.end);
  }
  return t;
}

const pad = (n) => String(n).padStart(2, '0');
export function formatTime(date, padHour = false) {
  const h = date.getHours();
  const hh = h % 12 || 12;
  return `${padHour ? pad(hh) : hh}:${pad(date.getMinutes())} ${h >= 12 ? 'PM' : 'AM'}`;
}

// "09:00 AM - 10:00 AM"
export function formatRange(startIso, endIso) {
  const start = new Date(startIso);
  const end = endIso ? new Date(endIso) : new Date(start.getTime() + DEFAULT_MIN * MIN);
  return `${formatTime(start, true)} - ${formatTime(end, true)}`;
}

export const toIso = formatLocalIso;

// Swap, don't block: when a block lands on another, suggest the next free slot of the same length.
export function overlapSuggestion(blocks, id, startIso, endIso) {
  const start = new Date(startIso);
  const end = endIso ? new Date(endIso) : new Date(start.getTime() + DEFAULT_MIN * MIN);
  const hit = findOverlap(blocks, id, start, end);
  if (!hit) return null;
  const minutes = (end - start) / MIN;
  const slot = nextFreeSlot(blocks, start, minutes, id);
  return { with: hit, start: toIso(slot), end: toIso(new Date(slot.getTime() + minutes * MIN)), label: `Use ${formatTime(slot)}` };
}
