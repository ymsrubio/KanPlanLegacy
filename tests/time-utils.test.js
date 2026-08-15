// tests/time-utils.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { getCurrentRoundedTime, generate5MinTimeOptions, formatLocalIso, hasDateChanged } from '../src/lib/time-utils.js';

test('time-utils - getCurrentRoundedTime rounds Date to nearest 5 minutes', () => {
  const d1 = new Date('2026-08-15T16:42:10');
  assert.equal(getCurrentRoundedTime(d1), '16:40');

  const d2 = new Date('2026-08-15T16:43:00');
  assert.equal(getCurrentRoundedTime(d2), '16:45');

  const d3 = new Date('2026-08-15T16:58:30');
  assert.equal(getCurrentRoundedTime(d3), '17:00');
});

test('time-utils - generate5MinTimeOptions generates 288 options (24h * 12 per hour)', () => {
  const options = generate5MinTimeOptions();
  assert.equal(options.length, 288);
  assert.equal(options[0].value, '00:00');
  assert.equal(options[0].label, '12:00 AM');
  assert.equal(options[12].value, '01:00');
  assert.equal(options[12].label, '1:00 AM');
  assert.equal(options[144].value, '12:00');
  assert.equal(options[144].label, '12:00 PM');
  assert.equal(options[287].value, '23:55');
  assert.equal(options[287].label, '11:55 PM');
});

test('time-utils - formatLocalIso formats Date without timezone shift', () => {
  const d = new Date(2026, 7, 15, 9, 5, 0); // Local Aug 15 2026 09:05:00
  assert.equal(formatLocalIso(d), '2026-08-15T09:05:00');
});

test('time-utils - hasDateChanged detects day transition across midnight', () => {
  const prevDate = '2026-08-15';
  const sameDayTime = new Date('2026-08-15T23:59:59');
  assert.equal(hasDateChanged(prevDate, sameDayTime), false);

  const midnightTime = new Date('2026-08-16T00:00:01');
  assert.equal(hasDateChanged(prevDate, midnightTime), true);
});
