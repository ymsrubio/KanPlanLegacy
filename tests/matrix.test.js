import test from 'node:test';
import assert from 'node:assert/strict';
import { buildMatrix } from '../src/lib/matrix.js';

const columns = [
  { id: 1, name: 'Backlog' }, { id: 2, name: 'Ready to Start' }, { id: 3, name: 'In Progress' }, { id: 4, name: 'Done' },
];
const L = { urgency_level: 1, importance_level: 1 };
const t = (id, column_id, urgency_level, importance_level, extra = {}) => ({ id, column_id, title: `T${id}`, urgency_level, importance_level, ...extra });

test('matrix - quadrants follow Plan, Do first / Later, Quick', () => {
  assert.deepEqual(buildMatrix([], columns).map((q) => q.key), ['plan', 'doFirst', 'later', 'quick']);
});

test('matrix - Backlog only, grouped by quadrant, archived and other columns excluded', () => {
  const tasks = [
    t(1, 1, 5, 5), t(2, 1, 2, 5), t(3, 1, 5, 2), t(4, 1, 1, 1),
    t(5, 2, 5, 5), t(6, 3, 5, 5), t(7, 4, 5, 5), t(8, 1, 5, 5, { is_archived: 1 }),
  ];
  const byKey = Object.fromEntries(buildMatrix(tasks, columns).map((q) => [q.key, q.tasks.map((x) => x.id)]));
  assert.deepEqual(byKey, { plan: [2], doFirst: [1], later: [4], quick: [3] });
});

test('matrix - empty quadrants stay present with no tasks, project filter applies', () => {
  const tasks = [t(1, 1, 5, 5, { project_id: 7 }), t(2, 1, 5, 5, { project_id: 8 })];
  const m = buildMatrix(tasks, columns, 7);
  assert.deepEqual(m.find((q) => q.key === 'doFirst').tasks.map((x) => x.id), [1]);
  assert.equal(m.find((q) => q.key === 'plan').tasks.length, 0);
});
