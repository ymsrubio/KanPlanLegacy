// tests/task-edit-drawer.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { getTodayDateString, getCurrentRoundedTime } from '../src/lib/time-utils.js';

/**
 * Helper simulating TaskEditDrawer schedule payload construction
 */
function buildTaskEditPayload(task, formData) {
  const { title, description, urgencyLevel, importanceLevel, deadline, isScheduled, scheduleDate, startTime, durationMinutes } = formData;
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

test('TaskEditDrawer - unschedules task when isScheduled is set to false', () => {
  const originalTask = {
    id: 2,
    title: 'Review PR',
    schedule_start: '2026-08-15T10:00:00',
    schedule_end: '2026-08-15T11:00:00'
  };
  const formData = {
    title: 'Review PR',
    description: '',
    urgencyLevel: 3,
    importanceLevel: 3,
    deadline: '',
    isScheduled: false,
    scheduleDate: '2026-08-15',
    startTime: '10:00',
    durationMinutes: 60
  };

  const updated = buildTaskEditPayload(originalTask, formData);

  assert.equal(updated.schedule_start, null);
  assert.equal(updated.schedule_end, null);
});
