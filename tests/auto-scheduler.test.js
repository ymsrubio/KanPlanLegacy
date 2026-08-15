// tests/auto-scheduler.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { processAutoTransitions } from '../src/lib/auto-scheduler.js';

const mockColumns = [
  { id: 1, name: 'Backlog', wip_limit: null },
  { id: 2, name: 'Ready to Start', wip_limit: 3 },
  { id: 3, name: 'In Progress', wip_limit: 2 },
  { id: 4, name: 'Done', wip_limit: null }
];

test('Auto-scheduler - transitions task to In Progress when now reaches schedule_start', () => {
  const now = new Date('2026-08-15T10:00:00');
  const tasks = [
    {
      id: 101,
      title: 'Design Mockups',
      column_id: 2, // Ready to Start
      schedule_start: '2026-08-15T09:55:00',
      schedule_end: '2026-08-15T11:00:00'
    }
  ];

  const transitions = processAutoTransitions(tasks, mockColumns, now);

  assert.equal(transitions.length, 1);
  assert.equal(transitions[0].taskId, 101);
  assert.equal(transitions[0].targetColumnId, 3); // In Progress
  assert.equal(transitions[0].reason, 'start');
});

test('Auto-scheduler - transitions task to Done when now reaches schedule_end', () => {
  const now = new Date('2026-08-15T11:05:00');
  const tasks = [
    {
      id: 102,
      title: 'Code API',
      column_id: 3, // In Progress
      schedule_start: '2026-08-15T09:00:00',
      schedule_end: '2026-08-15T11:00:00'
    }
  ];

  const transitions = processAutoTransitions(tasks, mockColumns, now);

  assert.equal(transitions.length, 1);
  assert.equal(transitions[0].taskId, 102);
  assert.equal(transitions[0].targetColumnId, 4); // Done
  assert.equal(transitions[0].reason, 'end');
});

test('Auto-scheduler - catches up past due scheduled task to Done directly if schedule_end is passed', () => {
  const now = new Date('2026-08-15T14:00:00');
  const tasks = [
    {
      id: 103,
      title: 'Old Meeting',
      column_id: 2, // Ready to Start
      schedule_start: '2026-08-15T09:00:00',
      schedule_end: '2026-08-15T10:00:00'
    }
  ];

  const transitions = processAutoTransitions(tasks, mockColumns, now);

  assert.equal(transitions.length, 1);
  assert.equal(transitions[0].taskId, 103);
  assert.equal(transitions[0].targetColumnId, 4); // Done
  assert.equal(transitions[0].reason, 'end');
});

test('Auto-scheduler - makes no transition if task is already in target column or unscheduled', () => {
  const now = new Date('2026-08-15T10:00:00');
  const tasks = [
    { id: 104, title: 'No schedule', column_id: 2, schedule_start: null, schedule_end: null },
    { id: 105, title: 'Completed', column_id: 4, schedule_start: '2026-08-15T09:00:00', schedule_end: '2026-08-15T09:30:00' }
  ];

  const transitions = processAutoTransitions(tasks, mockColumns, now);
  assert.equal(transitions.length, 0);
});
