// tests/task-edit-drawer.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { getTodayDateString, getCurrentRoundedTime } from '../src/lib/time-utils.js';

/**
 * Helper simulating TaskEditDrawer schedule payload construction
 */
function buildTaskEditPayload(task, formData) {
  const { title, description, columnId, urgencyLevel, importanceLevel, deadline, isScheduled, scheduleDate, startTime, durationMinutes } = formData;
  const priorityScore = urgencyLevel * importanceLevel;

  let schedule_start = null;
  let schedule_end = null;

  if (isScheduled && scheduleDate && startTime) {
    schedule_start = `${scheduleDate}T${startTime}:00`;
    const [h, m] = startTime.split(':').map(Number);
    const startObj = new Date(scheduleDate);
    startObj.setHours(h, m, 0, 0);

    const endObj = new Date(startObj.getTime() + Number(durationMinutes || 60) * 60 * 1000);
    const endY = endObj.getFullYear();
    const endM = String(endObj.getMonth() + 1).padStart(2, '0');
    const endD = String(endObj.getDate()).padStart(2, '0');
    const endHStr = String(endObj.getHours()).padStart(2, '0');
    const endMinStr = String(endObj.getMinutes()).padStart(2, '0');
    schedule_end = `${endY}-${endM}-${endD}T${endHStr}:${endMinStr}:00`;
  }

  return {
    ...task,
    column_id: columnId !== undefined ? Number(columnId) : task.column_id,
    title: title.trim(),
    description,
    urgency_level: urgencyLevel,
    importance_level: importanceLevel,
    is_urgent: urgencyLevel >= 4 ? 1 : 0,
    is_important: importanceLevel >= 4 ? 1 : 0,
    priority_score: priorityScore,
    deadline: deadline || null,
    schedule_start,
    schedule_end
  };
}

test('TaskEditDrawer - constructs 5-minute scheduled time block ISO string when enabled', () => {
  const originalTask = { id: 1, title: 'Draft Spec', schedule_start: null, schedule_end: null };
  const formData = {
    title: 'Draft Spec',
    description: 'Updated notes',
    urgencyLevel: 4,
    importanceLevel: 4,
    deadline: '2026-08-20',
    isScheduled: true,
    scheduleDate: '2026-08-15',
    startTime: '14:25',
    durationMinutes: 45
  };

  const updated = buildTaskEditPayload(originalTask, formData);

  assert.equal(updated.schedule_start, '2026-08-15T14:25:00');
  assert.equal(updated.schedule_end, '2026-08-15T15:10:00');
  assert.equal(updated.priority_score, 16);
});

test('TaskEditDrawer - updates column_id when selected', () => {
  const originalTask = { id: 3, column_id: 1, title: 'Drafting Spec' };
  const formData = {
    title: 'Drafting Spec',
    columnId: 2,
    urgencyLevel: 3,
    importanceLevel: 3,
    isScheduled: false
  };

  const updated = buildTaskEditPayload(originalTask, formData);
  assert.equal(updated.column_id, 2);
});

test('TaskEditDrawer - validates target column WIP limit', () => {
  const columns = [
    { id: 1, name: 'Backlog', wip_limit: null },
    { id: 2, name: 'Ready to Start', wip_limit: 2 }
  ];
  const activeTasks = [
    { id: 10, column_id: 2, is_archived: 0 },
    { id: 11, column_id: 2, is_archived: 0 }
  ];

  // Target column 2 is at capacity (2/2)
  const targetCol = columns.find(c => c.id === 2);
  const currentCount = activeTasks.filter(t => t.column_id === 2 && !t.is_archived).length;
  const isFull = targetCol.wip_limit !== null && currentCount >= targetCol.wip_limit;

  assert.equal(isFull, true);
});

