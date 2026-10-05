import test from 'node:test';
import assert from 'node:assert/strict';
import { readyPlan, swapUpdates, applyUpdates } from '../src/lib/wip-swap.js';

const columns = [
  { id: 1, name: 'Backlog', wip_limit: null },
  { id: 2, name: 'Ready to Start', wip_limit: 2 },
  { id: 3, name: 'In Progress', wip_limit: 2 },
];
const t = (id, column_id, extra = {}) => ({ id, column_id, title: `T${id}`, ...extra });

test('ready plan - room means a plain move, full means swap candidates', () => {
  const room = readyPlan([t(1, 1), t(2, 2)], columns, t(1, 1));
  assert.equal(room.full, false);
  const full = readyPlan([t(1, 1), t(2, 2), t(3, 2)], columns, t(1, 1));
  assert.equal(full.full, true);
  assert.deepEqual(full.candidates.map((x) => x.id), [2, 3]);
});

test('ready plan - a task already in Ready is never "full" against itself', () => {
  assert.equal(readyPlan([t(2, 2), t(3, 2)], columns, t(2, 2)).full, false);
});

test('ready plan - archived tasks do not count and no limit never blocks', () => {
  assert.equal(readyPlan([t(1, 1), t(2, 2), t(3, 2, { is_archived: 1 })], columns, t(1, 1)).full, false);
  const open = [{ id: 2, name: 'Ready to Start', wip_limit: null }, { id: 1, name: 'Backlog', wip_limit: null }];
  assert.equal(readyPlan([t(2, 2), t(3, 2), t(4, 2)], open, t(1, 1)).full, false);
});

test('swap - returns the old task to Backlog first, then moves the pending task in', () => {
  const tasks = [t(1, 1), t(2, 2, { schedule_start: 'a', schedule_end: 'b' }), t(3, 2)];
  const updates = swapUpdates(columns, 1, 2, { schedule_start: 's', schedule_end: 'e' });
  assert.deepEqual(updates, [
    { id: 2, patch: { column_id: 1, schedule_start: null, schedule_end: null } },
    { id: 1, patch: { column_id: 2, schedule_start: 's', schedule_end: 'e' } },
  ]);
  const next = applyUpdates(tasks, updates);
  assert.deepEqual(next.map((x) => x.column_id), [2, 1, 2]);
  assert.equal(next[1].schedule_start, null);
  assert.deepEqual(tasks.map((x) => x.column_id), [1, 2, 2]); // input untouched
});
