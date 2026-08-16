// tests/phase-movement.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getNextColumn, getPrevColumn, canMoveToColumn } from '../src/lib/phase-movement.js';

const MOCK_COLUMNS = [
  { id: 1, name: 'Backlog', position: 0, wip_limit: null },
  { id: 2, name: 'Ready to Start', position: 1, wip_limit: 3 },
  { id: 3, name: 'In Progress', position: 2, wip_limit: 2 },
  { id: 4, name: 'Done', position: 3, wip_limit: null }
];

test('phase-movement - getNextColumn returns adjacent column in position order', () => {
  const nextFromBacklog = getNextColumn(MOCK_COLUMNS, 1);
  assert.equal(nextFromBacklog.id, 2);
  assert.equal(nextFromBacklog.name, 'Ready to Start');

  const nextFromReady = getNextColumn(MOCK_COLUMNS, 2);
  assert.equal(nextFromReady.id, 3);
  assert.equal(nextFromReady.name, 'In Progress');

  const nextFromInProgress = getNextColumn(MOCK_COLUMNS, 3);
  assert.equal(nextFromInProgress.id, 4);
  assert.equal(nextFromInProgress.name, 'Done');

  const nextFromDone = getNextColumn(MOCK_COLUMNS, 4);
  assert.equal(nextFromDone, null);
});

test('phase-movement - getPrevColumn returns adjacent previous column in position order', () => {
  const prevFromDone = getPrevColumn(MOCK_COLUMNS, 4);
  assert.equal(prevFromDone.id, 3);
  assert.equal(prevFromDone.name, 'In Progress');

  const prevFromInProgress = getPrevColumn(MOCK_COLUMNS, 3);
  assert.equal(prevFromInProgress.id, 2);
  assert.equal(prevFromInProgress.name, 'Ready to Start');

  const prevFromReady = getPrevColumn(MOCK_COLUMNS, 2);
  assert.equal(prevFromReady.id, 1);
  assert.equal(prevFromReady.name, 'Backlog');

  const prevFromBacklog = getPrevColumn(MOCK_COLUMNS, 1);
  assert.equal(prevFromBacklog, null);
});

test('phase-movement - canMoveToColumn validates WIP limit capacity correctly', () => {
  const targetColWithLimit = { id: 2, name: 'Ready to Start', wip_limit: 2 };
  const targetColNoLimit = { id: 1, name: 'Backlog', wip_limit: null };

  const currentTasks = [
    { id: 101, column_id: 2, title: 'Task 1' },
    { id: 102, column_id: 2, title: 'Task 2' }
  ];

  // Moving a 3rd task into a column with limit of 2 should fail WIP check
  assert.equal(canMoveToColumn(currentTasks, targetColWithLimit, 103), false);

  // Moving task that is ALREADY in the column should pass
  assert.equal(canMoveToColumn(currentTasks, targetColWithLimit, 101), true);

  // Moving into column with no WIP limit should always pass
  assert.equal(canMoveToColumn(currentTasks, targetColNoLimit, 103), true);

  // If column has 1 task (under limit of 2), moving should pass
  const singleTask = [{ id: 101, column_id: 2, title: 'Task 1' }];
  assert.equal(canMoveToColumn(singleTask, targetColWithLimit, 103), true);
});
