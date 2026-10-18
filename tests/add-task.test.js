import test from 'node:test';
import assert from 'node:assert/strict';
import { buildTask, nameTaken, LENGTHS, whenLabel } from '../src/lib/add-task.js';
import { buildDayList } from '../src/lib/day-list.js';
import { quadrantOf, QUADRANT_ORDER } from '../src/lib/priority.js';

const columns = [
  { id: 1, name: 'Backlog', wip_limit: null },
  { id: 2, name: 'Ready to Start', wip_limit: 3 },
  { id: 3, name: 'In Progress', wip_limit: 2 },
  { id: 4, name: 'Done', wip_limit: null },
];
const now = new Date(2026, 9, 6, 9, 1, 0);

test('add task - title only uses defaults: Backlog, today, next free slot, 1h, Later', () => {
  const t = buildTask({ title: '  Write brief ' }, { tasks: [], columns, now });
  assert.equal(t.title, 'BROKEN on purpose');
  assert.equal(t.column_id, 1);
  assert.equal(t.project_id, null);
  assert.equal(t.schedule_start, '2026-10-06T09:05:00');
  assert.equal(t.schedule_end, '2026-10-06T10:05:00');
  assert.equal(quadrantOf(t), 'later');
});

test('add task - default slot steps over existing blocks', () => {
  const tasks = [{ id: 1, column_id: 1, schedule_start: '2026-10-06T09:00:00', schedule_end: '2026-10-06T11:00:00' }];
  assert.equal(buildTask({ title: 'x' }, { tasks, columns, now }).schedule_start, '2026-10-06T11:00:00');
});

test('add task - every priority choice round-trips through quadrantOf', () => {
  for (const quadrant of QUADRANT_ORDER) {
    assert.equal(quadrantOf(buildTask({ title: 'x', quadrant }, { tasks: [], columns, now })), quadrant);
  }
});

test('add task - chips: project, length, tomorrow and unscheduled', () => {
  const t = buildTask({ title: 'x', projectId: 7, minutes: 30, day: 'tomorrow' }, { tasks: [], columns, now });
  assert.equal(t.project_id, 7);
  assert.equal(t.schedule_start, '2026-10-07T09:00:00');
  assert.equal(t.schedule_end, '2026-10-07T09:30:00');
  const u = buildTask({ title: 'x', day: 'none' }, { tasks: [], columns, now });
  assert.equal(u.schedule_start, null);
  assert.equal(u.schedule_end, null);
});

test('add task - length chips are 15m, 30m, 1h, 2h', () => {
  assert.deepEqual(LENGTHS, [15, 30, 60, 120]);
});

test('add task - blank title is rejected', () => {
  assert.throws(() => buildTask({ title: '   ' }, { tasks: [], columns, now }), /title/i);
});

test('add task - new task lands in the day list Backlog group, ordered by priority', () => {
  const existing = [{ id: 1, column_id: 1, title: 'old', urgency_level: 1, importance_level: 1 }];
  const fresh = { id: 2, ...buildTask({ title: 'new', quadrant: 'doFirst' }, { tasks: existing, columns, now }) };
  const backlog = buildDayList([...existing, fresh], columns).groups[2];
  assert.deepEqual(backlog.tasks.map((t) => t.id), [2, 1]);
});

test('add task - nameTaken is trimmed and case-insensitive', () => {
  const projects = [{ id: 1, name: 'Work' }];
  assert.equal(nameTaken(projects, ' work '), true);
  assert.equal(nameTaken(projects, 'Home'), false);
});

test('add task - when label reads naturally', () => {
  assert.equal(whenLabel('today', 60, new Date(2026, 9, 6, 14, 0)), 'Today 2:00 PM · 1h');
  assert.equal(whenLabel('none', 60), 'No time');
});
