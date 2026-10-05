// src/lib/wip-swap.js
// Swap, don't block: a full Ready to start offers to return one task to Backlog.

// full: Ready is at its limit and `task` would add one. candidates: tasks that could be swapped out.
export function readyPlan(tasks, columns, task) {
  const ready = columns.find((c) => c.name === 'Ready to Start');
  const backlog = columns.find((c) => c.name === 'Backlog') ?? columns[0];
  const inReady = ready ? tasks.filter((t) => !t.is_archived && Number(t.column_id) === Number(ready.id)) : [];
  const joining = !ready || Number(task.column_id) !== Number(ready.id);
  const full = Boolean(ready) && joining && ready.wip_limit != null && inReady.length >= ready.wip_limit;
  return { ready, backlog, full, candidates: inReady };
}

// Ordered updates: free the slot first so the server-side WIP check passes for the second.
export function swapUpdates(columns, pendingId, outId, patch = {}) {
  const { ready, backlog } = readyPlan([], columns, {});
  return [
    { id: outId, patch: { column_id: backlog.id, schedule_start: null, schedule_end: null } },
    { id: pendingId, patch: { column_id: ready.id, ...patch } },
  ];
}

export const applyUpdates = (tasks, updates) =>
  tasks.map((t) => {
    const u = updates.find((x) => Number(x.id) === Number(t.id));
    return u ? { ...t, ...u.patch } : t;
  });
