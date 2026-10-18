import test from 'node:test';
import assert from 'node:assert/strict';
import { buildMatrix, readyRoom, roomNote, foldRows, phoneOrder, stageLabel, QUADRANT_ROWS } from '../src/lib/matrix.js';

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

const wip = [
  { id: 1, name: 'Backlog' }, { id: 2, name: 'Ready to Start', wip_limit: 3 }, { id: 3, name: 'In Progress', wip_limit: 2 }, { id: 4, name: 'Done' },
];
const ids = (m) => m.flatMap((q) => q.tasks.map((x) => x.id)).sort((a, b) => a - b);

test('matrix - Not started is the Backlog, All adds Ready and In progress but not Done or archived', () => {
  const tasks = [t(1, 1, 5, 5), t(2, 2, 5, 5), t(3, 3, 2, 2), t(4, 4, 5, 5), t(5, 2, 5, 5, { is_archived: 1 })];
  assert.deepEqual(ids(buildMatrix(tasks, wip, null, 'notStarted')), [1]);
  assert.deepEqual(ids(buildMatrix(tasks, wip)), [1]);
  assert.deepEqual(ids(buildMatrix(tasks, wip, null, 'all')), [1, 2, 3]);
});

test('matrix - All still respects the project filter', () => {
  const tasks = [t(1, 1, 5, 5, { project_id: 7 }), t(2, 2, 5, 5, { project_id: 8 })];
  assert.deepEqual(ids(buildMatrix(tasks, wip, 8, 'all')), [2]);
});

test('matrix - readyRoom counts open places in Ready to start', () => {
  const tasks = [t(1, 2, 5, 5), t(2, 2, 5, 5), t(3, 2, 5, 5, { is_archived: 1 }), t(4, 1, 5, 5)];
  assert.deepEqual(readyRoom(tasks, wip), { limit: 3, used: 2, open: 1 });
  assert.equal(readyRoom([t(1, 2, 5, 5), t(2, 2, 5, 5), t(3, 2, 5, 5), t(4, 2, 5, 5)], wip).open, 0);
  assert.equal(readyRoom(tasks, columns).open, null);
});

test('matrix - roomNote wording', () => {
  assert.equal(roomNote(1), '1 spot open in Ready');
  assert.equal(roomNote(2), '2 spots open in Ready');
  assert.equal(roomNote(0), 'Ready is full');
  assert.equal(roomNote(null), '');
});

test('matrix - Do first hint reads Urgent and important', () => {
  assert.equal(buildMatrix([], columns).find((q) => q.key === 'doFirst').hint, 'Urgent and important');
});

test('matrix - long quadrants fold to two rows with a hidden count, expanding shows all', () => {
  const five = [1, 2, 3, 4, 5].map((i) => t(i, 1, 5, 5));
  assert.equal(QUADRANT_ROWS, 2);
  const f = foldRows(five, false);
  assert.deepEqual([f.rows.map((x) => x.id), f.hidden], [[1, 2], 3]);
  assert.equal(foldRows(five, true).hidden, 0);
  assert.equal(foldRows(five.slice(0, 2), false).hidden, 0);
  assert.equal(foldRows(five, false, Infinity).rows.length, 5);
});

test('matrix - phone order is Do first, Plan, Quick, Later', () => {
  assert.deepEqual(phoneOrder(buildMatrix([], columns)).map((q) => q.key), ['doFirst', 'plan', 'quick', 'later']);
});

test('matrix - stage label comes from the column name, custom columns keep their own', () => {
  assert.equal(stageLabel({ name: 'Ready to Start' }), 'Ready');
  assert.equal(stageLabel({ name: 'In Progress' }), 'In progress');
  assert.equal(stageLabel({ name: 'Review' }), 'Review');
  assert.equal(stageLabel(undefined), '');
});

test('matrix - phoneOrder never drops or throws on quadrants outside its list', () => {
  const qs = [{ key: 'later' }, { key: 'extra' }, { key: 'doFirst' }];
  assert.deepEqual(phoneOrder(qs).map((q) => q.key), ['doFirst', 'later', 'extra']);
  assert.deepEqual(phoneOrder([]), []);
});
