import test from 'node:test';
import assert from 'node:assert/strict';
import { snapUp, blocksOf, nextFreeSlot, findOverlap, formatTime, formatRange } from '../src/lib/schedule.js';

const at = (h, m = 0) => new Date(2026, 9, 6, h, m, 0);
const iso = (h, m = 0) => `2026-10-06T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
const block = (id, sh, eh) => ({ id, start: at(sh), end: at(eh) });

test('schedule - snapUp rounds up to the next 5 minutes and zeroes seconds', () => {
  assert.equal(snapUp(new Date(2026, 9, 6, 9, 1, 30)).getMinutes(), 5);
  assert.equal(snapUp(new Date(2026, 9, 6, 9, 5, 0)).getMinutes(), 5);
  assert.equal(snapUp(new Date(2026, 9, 6, 9, 56, 0)).getHours(), 10);
});

test('schedule - nextFreeSlot skips busy blocks, stacking back to back', () => {
  const blocks = [block(1, 9, 10), block(2, 10, 11)];
  assert.deepEqual(nextFreeSlot(blocks, at(9, 12), 60), at(11));
  assert.deepEqual(nextFreeSlot(blocks, at(8), 60), at(8));
  assert.deepEqual(nextFreeSlot(blocks, at(8, 30), 60), at(11)); // 8:30-9:30 collides with block 1
  assert.deepEqual(nextFreeSlot([], at(9, 1), 30), at(9, 5));
});

test('schedule - nextFreeSlot ignores the task being moved', () => {
  assert.deepEqual(nextFreeSlot([block(1, 9, 10)], at(9), 60, 1), at(9));
});

test('schedule - findOverlap reports the colliding block, touching edges are free', () => {
  const blocks = [block(1, 9, 10), block(2, 13, 14)];
  assert.equal(findOverlap(blocks, 3, at(9, 30), at(10, 30)).id, 1);
  assert.equal(findOverlap(blocks, 3, at(10), at(11)), null);
  assert.equal(findOverlap(blocks, 1, at(9, 30), at(10, 30)), null); // itself
});

test('schedule - blocksOf keeps only scheduled, non-done tasks (default 1h when no end)', () => {
  const columns = [{ id: 1, name: 'Backlog' }, { id: 4, name: 'Done' }];
  const tasks = [
    { id: 1, column_id: 1, schedule_start: iso(9), schedule_end: iso(10) },
    { id: 2, column_id: 1, schedule_start: iso(11) },
    { id: 3, column_id: 4, schedule_start: iso(12), schedule_end: iso(13) },
    { id: 4, column_id: 1 },
  ];
  const out = blocksOf(tasks, columns);
  assert.deepEqual(out.map((b) => b.id), [1, 2]);
  assert.deepEqual(out[1].end, at(12));
});

test('schedule - time formats are zero padded with an explicit range', () => {
  assert.equal(formatTime(at(14)), '2:00 PM');
  assert.equal(formatRange(iso(9), iso(10)), '09:00 AM - 10:00 AM');
  assert.equal(formatRange(iso(0, 5), iso(13, 30)), '12:05 AM - 01:30 PM');
});
