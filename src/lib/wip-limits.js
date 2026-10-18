// src/lib/wip-limits.js
// WIP limit input rules shared by the dialog and the columns API: blank means no limit, otherwise a whole number from 1 to 99.
export const MAX_WIP_LIMIT = 99;

// Returns { ok: true, value } with value a positive integer or null, or { ok: false, error }.
export function parseWipLimit(raw) {
  if (raw === null || raw === undefined) return { ok: true, value: null };
  const text = String(raw).trim();
  if (text === '') return { ok: true, value: null };
  if (!/^\d+$/.test(text)) return { ok: false, error: 'Use a whole number, or leave blank for no limit.' };
  const n = Number(text);
  if (n < 1 || n > MAX_WIP_LIMIT) return { ok: false, error: `Use a number from 1 to ${MAX_WIP_LIMIT}.` };
  return { ok: true, value: n };
}

// Active (unarchived) task count per column id.
export function columnCounts(tasks) {
  const counts = {};
  for (const t of tasks) if (!t.is_archived) counts[t.column_id] = (counts[t.column_id] || 0) + 1;
  return counts;
}

// Fold Promise.allSettled results for the per-column saves into what to apply and what to report.
// changes: [{ id, ... }] in the same order as results. A fulfilled value is the saved column.
export function settleLimitSaves(changes, results) {
  const saved = [];
  const failedIds = [];
  results.forEach((r, i) => (r.status === 'fulfilled' ? saved.push(r.value) : failedIds.push(changes[i].id)));
  return { saved, failedIds };
}
