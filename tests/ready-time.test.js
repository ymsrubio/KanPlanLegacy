import test from 'node:test';
import assert from 'node:assert/strict';
import { needsTime, timePatch } from '../src/lib/ready-time.js';

test('ready time - ask only when neither the task nor the move carries a schedule (issue 99)', () => {
  assert.equal(needsTime({ id: 1, schedule_start: null }), true);
  assert.equal(needsTime({ id: 1 }, {}), true);
  assert.equal(needsTime({ id: 1, schedule_start: '2026-10-06T09:00:00' }), false);
  assert.equal(needsTime({ id: 1 }, { schedule_start: '2026-10-06T09:00:00' }), false);
});

test('ready time - a chosen start and length become the schedule patch', () => {
  assert.deepEqual(timePatch(new Date(2026, 9, 6, 9, 0), 90), {
    schedule_start: '2026-10-06T09:00:00',
    schedule_end: '2026-10-06T10:30:00',
  });
  assert.deepEqual(timePatch(null, 60), {});
});
