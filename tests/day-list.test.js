import test from 'node:test';
import assert from 'node:assert/strict';
import { buildDayList, projectColor, PROJECT_COLORS, priorityMark } from '../src/lib/day-list.js';

const columns = [
  { id: 1, name: 'Backlog', wip_limit: null },
  { id: 2, name: 'Ready to Start', wip_limit: 2 },
  { id: 3, name: 'In Progress', wip_limit: 1 },
  { id: 4, name: 'Done', wip_limit: null },
];
const hi = { urgency_level: 5, importance_level: 5 };
const lo = { urgency_level: 1, importance_level: 1 };
const t = (id, column_id, extra = lo) => ({ id, column_id, title: `T${id}`, ...extra });

test('day list - three groups in order, sorted by score, with used/limit', () => {
  const { groups } = buildDayList([t(1, 1), t(2, 1, hi), t(3, 2), t(4, 3), t(5, 4)], columns);
  assert.deepEqual(groups.map((g) => g.key), ['inProgress', 'ready', 'backlog']);
  assert.deepEqual(groups[2].tasks.map((x) => x.id), [2, 1]);
  assert.deepEqual([groups[0].used, groups[0].limit, groups[0].full], [1, 1, true]);
  assert.deepEqual([groups[1].used, groups[1].limit, groups[1].full], [1, 2, false]);
  assert.equal(groups[2].limit, null);
});

test('day list - exactly one Next: top Ready task, else top Backlog', () => {
  assert.equal(buildDayList([t(1, 1, hi), t(2, 2), t(3, 2, hi)], columns).nextId, 3);
  assert.equal(buildDayList([t(1, 1), t(2, 1, hi)], columns).nextId, 2);
  assert.equal(buildDayList([t(1, 3)], columns).nextId, null);
});

test('day list - project filter and filtered/empty flags', () => {
  const tasks = [{ ...t(1, 1), project_id: 7 }, { ...t(2, 1), project_id: 8 }];
  const f = buildDayList(tasks, columns, 7);
  assert.deepEqual(f.groups[2].tasks.map((x) => x.id), [1]);
  assert.equal(buildDayList(tasks, columns, 99).state, 'filtered');
  assert.equal(buildDayList([], columns).state, 'empty');
  assert.equal(buildDayList(tasks, columns).state, 'ok');
});

test('day list - priority mark only on critical/high with a label', () => {
  assert.deepEqual(priorityMark(25), { text: '▲▲', label: 'Critical priority' });
  assert.deepEqual(priorityMark(15), { text: '▲', label: 'High priority' });
  assert.equal(priorityMark(10), null);
});

test('day list - 5 project colors repeating', () => {
  assert.equal(PROJECT_COLORS.length, 5);
  assert.equal(projectColor(0), projectColor(5));
  assert.notEqual(projectColor(0), projectColor(1));
});
