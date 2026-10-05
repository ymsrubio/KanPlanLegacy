// src/lib/priority.js
// v0.4 priority model: the only source of scores and tier thresholds.
export const PRIORITY_SCORE = { doFirst: 25, plan: 10, quick: 10, later: 4 };
export const TIER_MIN = { critical: 20, high: 15, medium: 10 };

export const tierOf = (score) =>
  score >= TIER_MIN.critical ? 'critical' : score >= TIER_MIN.high ? 'high' : score >= TIER_MIN.medium ? 'medium' : 'low';

// Highest score first; returns a new array.
export const sortByScore = (items, getScore) => [...items].sort((a, b) => getScore(b) - getScore(a));

// Legacy 1-5 levels (or is_urgent/is_important flags, which legacy code treats as 4 vs 2) -> quadrant.
// Level >= 4 counts as high, matching the legacy flag mapping. Original columns are untouched.
export function quadrantOf(task) {
  const urgent = (task.urgency_level ?? (task.is_urgent ? 4 : 2)) >= 4;
  const important = (task.importance_level ?? (task.is_important ? 4 : 2)) >= 4;
  return urgent ? (important ? 'doFirst' : 'quick') : (important ? 'plan' : 'later');
}

export const scoreOf = (task) => PRIORITY_SCORE[quadrantOf(task)];
