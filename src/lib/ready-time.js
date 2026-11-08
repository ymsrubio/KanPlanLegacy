// src/lib/ready-time.js
// Tasks are added without a time; the time is chosen on the move into Ready to start (issue 99).
import { toIso } from './schedule.js';

const MIN = 60000;

export const needsTime = (task, patch = {}) => !task.schedule_start && !patch.schedule_start;

export function timePatch(start, minutes) {
  if (!start) return {};
  return { schedule_start: toIso(start), schedule_end: toIso(new Date(start.getTime() + minutes * MIN)) };
}
