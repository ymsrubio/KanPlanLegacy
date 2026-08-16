// lib/project-service.js
// Service for project / category management with account row-level isolation.

export const DEFAULT_PROJECTS = [
  { name: 'General', color: '#64748b' },
  { name: 'Work', color: '#ff4f00' },
  { name: 'Personal', color: '#10b981' }
];

/**
 * Get all projects for an account.
 * @param {import('better-sqlite3').Database} db 
 * @param {string} accountId 
 * @returns {Array<Object>}
 */
export function getProjects(db, accountId) {
  return db.prepare('SELECT * FROM projects WHERE account_id = ? ORDER BY id ASC').all(accountId);
}

/**
 * Create a new project for an account.
 * @param {import('better-sqlite3').Database} db 
 * @param {string} accountId 
 * @param {{ name: string, color?: string }} projectData 
 * @returns {Object}
 */
export function createProject(db, accountId, { name, color = '#ff4f00' }) {
  if (!name || !name.trim()) {
    throw new Error('Project name is required');
  }

  const trimmedName = name.trim();
  const trimmedColor = color?.trim() || '#ff4f00';

  const stmt = db.prepare(`
    INSERT INTO projects (account_id, name, color)
    VALUES (?, ?, ?)
  `);

  const result = stmt.run(accountId, trimmedName, trimmedColor);

  return {
    id: result.lastInsertRowid,
    account_id: accountId,
    name: trimmedName,
    color: trimmedColor
  };
}

/**
 * Delete a project and unassign any tasks belonging to it.
 * @param {import('better-sqlite3').Database} db 
 * @param {string} accountId 
 * @param {number|string} projectId 
 * @returns {boolean}
 */
export function deleteProject(db, accountId, projectId) {
  const existing = db.prepare('SELECT * FROM projects WHERE id = ? AND account_id = ?').get(projectId, accountId);
  if (!existing) {
    throw new Error('Project not found');
  }

  // Unassign tasks from this project
  db.prepare('UPDATE tasks SET project_id = NULL WHERE project_id = ? AND account_id = ?').run(projectId, accountId);

  // Delete project
  db.prepare('DELETE FROM projects WHERE id = ? AND account_id = ?').run(projectId, accountId);

  return true;
}
