// tests/calendar-edit.test.js
import test from 'node:test';
import assert from 'node:assert/strict';

/**
 * Double-click / double-tap detection helper used by CalendarGrid
 */
export function handleCalendarEventTap(lastTapTime, currentTapTime, thresholdMs = 350) {
  const diff = currentTapTime - lastTapTime;
  const isDoubleTap = diff > 0 && diff <= thresholdMs;
  return {
    isDoubleTap,
    newTapTime: isDoubleTap ? 0 : currentTapTime
  };
}

test('calendar-edit - triggers double-tap when two taps occur within 350ms', () => {
  const t1 = 1000;
  const t2 = 1250; // 250ms later

  const result = handleCalendarEventTap(t1, t2, 350);
  assert.equal(result.isDoubleTap, true);
});

test('calendar-edit - rejects single tap or slow taps (> 350ms)', () => {
  const t1 = 1000;
  const t2 = 1450; // 450ms later

  const result = handleCalendarEventTap(t1, t2, 350);
  assert.equal(result.isDoubleTap, false);
  assert.equal(result.newTapTime, 1450);
});

test('calendar-edit - finds task matching calendar event ID for drawer opening', () => {
  const tasks = [
    { id: 101, title: 'Deep Work Session', schedule_start: '2026-08-16T09:00:00', schedule_end: '2026-08-16T10:00:00' },
    { id: 102, title: 'Code Review', schedule_start: '2026-08-16T11:00:00', schedule_end: '2026-08-16T11:30:00' }
  ];

  const clickedEventId = '101';
  const targetTask = tasks.find(t => String(t.id) === String(clickedEventId));

  assert.ok(targetTask);
  assert.equal(targetTask.id, 101);
  assert.equal(targetTask.title, 'Deep Work Session');
});
