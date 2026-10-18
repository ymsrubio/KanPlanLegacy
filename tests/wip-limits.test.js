import test from 'node:test';
import assert from 'node:assert/strict';
import { parseWipLimit, columnCounts, MAX_WIP_LIMIT } from '../src/lib/wip-limits.js';
import { readyPlan } from '../src/lib/wip-swap.js';

test('parseWipLimit: blank means no limit', () => {
  for (const raw of ['', '  ', null, undefined]) assert.deepEqual(parseWipLimit(raw), { ok: true, value: null });
});

test('parseWipLimit: whole numbers 1 to 99 parse to numbers', () => {
  assert.deepEqual(parseWipLimit('3'), { ok: true, value: 3 });
  assert.deepEqual(parseWipLimit(' 12 '), { ok: true, value: 12 });
  assert.deepEqual(parseWipLimit(99), { ok: true, value: 99 });
  assert.equal(MAX_WIP_LIMIT, 99);
});

test('parseWipLimit: rejects zero, too large, decimals, negatives and text', () => {
  assert.equal(parseWipLimit('0').error, 'Use a number from 1 to 99.');
  assert.equal(parseWipLimit('100').error, 'Use a number from 1 to 99.');
  for (const raw of ['2.5', '-1', 'abc', '1e2', {}]) {
    assert.equal(parseWipLimit(raw).ok, false, String(raw));
  }
});

test('columnCounts counts unarchived tasks per column', () => {
  const tasks = [{ column_id: 2 }, { column_id: 2 }, { column_id: 2, is_archived: 1 }, { column_id: 3 }];
  assert.deepEqual(columnCounts(tasks), { 2: 2, 3: 1 });
});

test('a raised Ready limit stops the add flow from needing a swap', () => {
  const tasks = [{ id: 1, column_id: 2 }, { id: 2, column_id: 2 }];
  const backlog = { id: 1, name: 'Backlog', wip_limit: null };
  const full = readyPlan(tasks, [backlog, { id: 2, name: 'Ready to Start', wip_limit: 2 }], { column_id: 1 });
  assert.equal(full.full, true);
  assert.equal(full.candidates.length, 2);
  assert.equal(readyPlan(tasks, [backlog, { id: 2, name: 'Ready to Start', wip_limit: 3 }], { column_id: 1 }).full, false);
  assert.equal(readyPlan(tasks, [backlog, { id: 2, name: 'Ready to Start', wip_limit: null }], { column_id: 1 }).full, false);
});

test('settleLimitSaves keeps columns that saved and names the ones that failed', async () => {
  const { settleLimitSaves } = await import('../src/lib/wip-limits.js');
  const changes = [{ id: 2, wip_limit: 5 }, { id: 3, wip_limit: 0 }];
  const results = [{ status: 'fulfilled', value: { id: 2, wip_limit: 5 } }, { status: 'rejected', reason: new Error('x') }];
  assert.deepEqual(settleLimitSaves(changes, results), { saved: [{ id: 2, wip_limit: 5 }], failedIds: [3] });
});
