// tests/priority.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { PRIORITY_SCORE, TIER_MIN, tierOf, sortByScore, quadrantOf } from '../src/lib/priority.js';

test('priority - scores match v0.4 constants', () => {
  assert.deepEqual(PRIORITY_SCORE, { doFirst: 25, plan: 10, quick: 10, later: 4 });
});

test('priority - tier boundaries', () => {
  const cases = [[25, 'critical'], [20, 'critical'], [19, 'high'], [15, 'high'], [14, 'medium'], [10, 'medium'], [9, 'low'], [4, 'low']];
  for (const [score, tier] of cases) assert.equal(tierOf(score), tier, `score ${score}`);
  assert.deepEqual(TIER_MIN, { critical: 20, high: 15, medium: 10 });
});

test('priority - sortByScore is highest first and does not mutate', () => {
  const tasks = [{ id: 1, score: 4 }, { id: 2, score: 25 }, { id: 3, score: 10 }];
  assert.deepEqual(sortByScore(tasks, (t) => t.score).map((t) => t.id), [2, 3, 1]);
  assert.equal(tasks[0].id, 1);
});

test('priority - legacy 1-5 urgency/importance map to quadrants', () => {
  assert.equal(quadrantOf({ urgency_level: 5, importance_level: 4 }), 'doFirst');
  assert.equal(quadrantOf({ urgency_level: 2, importance_level: 4 }), 'plan');
  assert.equal(quadrantOf({ urgency_level: 4, importance_level: 2 }), 'quick');
  assert.equal(quadrantOf({ urgency_level: 2, importance_level: 2 }), 'later');
  // legacy boolean-only rows (no levels)
  assert.equal(quadrantOf({ is_urgent: 1, is_important: 1 }), 'doFirst');
  assert.equal(quadrantOf({}), 'later');
});
