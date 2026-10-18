// Sign in via /api/auth/dev-login and seed 3 projects + 10 tasks. Usage: node seed.mjs <appUrl>
// Idempotent per fresh DB: run once after up.sh. Respects WIP limits (Ready 3, In Progress 2).
const app = process.argv[2];
if (!app) throw new Error('usage: node seed.mjs <appUrl>');

const login = await fetch(`${app}/api/auth/dev-login`, { redirect: 'manual', headers: { referer: `${app}/` } });
const cookie = (login.headers.getSetCookie?.() ?? []).map((c) => c.split(';')[0]).join('; ');
if (!cookie) throw new Error(`dev-login set no cookie (status ${login.status})`);
const api = async (method, path, body) => {
  const r = await fetch(`${app}/api${path}`, { method, headers: { cookie, 'content-type': 'application/json' }, body: body && JSON.stringify(body) });
  if (!r.ok) throw new Error(`${method} ${path} -> ${r.status} ${await r.text()}`);
  return r.json();
};

const columns = Object.fromEntries((await api('GET', '/columns')).map((c) => [c.name, c.id]));
const projects = Object.fromEntries((await api('GET', '/projects')).map((p) => [p.name, p.id]));
// the account already has General, Work, Personal from first login; add nothing else so "three projects" holds
for (const name of ['General', 'Work', 'Personal']) if (!projects[name]) throw new Error(`missing default project ${name}`);

const day = (offset, hh, mm = 0) => {
  const d = new Date(); d.setDate(d.getDate() + offset);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(hh)}:${p(mm)}:00`;
};
const tasks = [
  // Backlog (no limit)
  ['Backlog', 'Plan quarterly roadmap', 'Work', 4, 4],
  ['Backlog', 'Book dentist appointment', 'Personal', 2, 3],
  ['Backlog', 'Clean up old notes', 'General', 1, 2],
  // Ready to Start (limit 3)
  ['Ready to Start', 'Review pull requests', 'Work', 4, 3, day(0, 14), day(0, 15)],
  ['Ready to Start', 'Grocery shopping', 'Personal', 3, 2, day(1, 17), day(1, 18)],
  ['Ready to Start', 'Renew passport', 'General', 2, 5],
  // In Progress (limit 2)
  ['In Progress', 'Write design handoff', 'Work', 5, 5, day(0, 9), day(0, 10, 30)],
  ['In Progress', 'Morning run', 'Personal', 3, 3, day(0, 11), day(0, 12)],
  // Done
  ['Done', 'Send invoices', 'Work', 3, 4],
  ['Done', 'Water the plants', 'Personal', 1, 1],
];
for (const [col, title, proj, u, i, start, end] of tasks) {
  await api('POST', '/tasks', {
    column_id: columns[col], project_id: projects[proj], title,
    urgency_level: u, importance_level: i, schedule_start: start, schedule_end: end,
  });
}
console.log(`seeded ${Object.keys(projects).length} projects, ${tasks.length} tasks`);
