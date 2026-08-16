// tests/projects-api.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import { getProjects, createProject, deleteProject, DEFAULT_PROJECTS } from '../lib/project-service.js';
import { createTask } from '../lib/task-service.js';
import { findOrCreateAccount } from '../lib/auth-service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function setupTestDb() {
  const db = new Database(':memory:');
  const schemaSql = fs.readFileSync(path.join(__dirname, '../db/schema.sql'), 'utf8');
  db.exec(schemaSql);
  const accountA = findOrCreateAccount(db, { google_id: 'user-a', email: 'a@test.com', name: 'User A' });
  const accountB = findOrCreateAccount(db, { google_id: 'user-b', email: 'b@test.com', name: 'User B' });
  return { db, accountAId: accountA.id, accountBId: accountB.id };
}

test('project-service - createProject creates a project for an account', () => {
  const { db, accountAId } = setupTestDb();
  const project = createProject(db, accountAId, { name: 'Client X', color: '#8b5cf6' });

  assert.ok(project.id);
  assert.equal(project.name, 'Client X');
  assert.equal(project.color, '#8b5cf6');
  assert.equal(project.account_id, accountAId);

  const projects = getProjects(db, accountAId);
  const found = projects.find(p => p.name === 'Client X');
  assert.ok(found);
});

test('project-service - account isolation prevents seeing other accounts projects', () => {
  const { db, accountAId, accountBId } = setupTestDb();
  createProject(db, accountAId, { name: 'Account A Project', color: '#ff4f00' });
  createProject(db, accountBId, { name: 'Account B Project', color: '#3b82f6' });

  const aProjects = getProjects(db, accountAId);
  const bProjects = getProjects(db, accountBId);

  assert.ok(aProjects.some(p => p.name === 'Account A Project'));
  assert.ok(!aProjects.some(p => p.name === 'Account B Project'));

  assert.ok(bProjects.some(p => p.name === 'Account B Project'));
  assert.ok(!bProjects.some(p => p.name === 'Account A Project'));
});

test('project-service - deleteProject removes project and unassigns tasks', () => {
  const { db, accountAId } = setupTestDb();
  const project = createProject(db, accountAId, { name: 'Temporary', color: '#ef4444' });
  const col = db.prepare('SELECT id FROM columns WHERE account_id = ?').get(accountAId);

  const task = createTask(db, accountAId, {
    column_id: col.id,
    title: 'Task in project',
    project_id: project.id
  });

  assert.equal(task.project_id, project.id);

  deleteProject(db, accountAId, project.id);

  const projects = getProjects(db, accountAId);
  assert.ok(!projects.some(p => p.id === project.id));

  // Task remains but project_id is set to null
  const updatedTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(task.id);
  assert.equal(updatedTask.project_id, null);
});

test('project-service - filtering tasks by project ID returns only matching tasks', () => {
  const { db, accountAId } = setupTestDb();
  const proj1 = createProject(db, accountAId, { name: 'Alpha', color: '#ff4f00' });
  const proj2 = createProject(db, accountAId, { name: 'Beta', color: '#3b82f6' });
  const col = db.prepare('SELECT id FROM columns WHERE account_id = ?').get(accountAId);

  const task1 = createTask(db, accountAId, { column_id: col.id, title: 'Alpha Task', project_id: proj1.id });
  const task2 = createTask(db, accountAId, { column_id: col.id, title: 'Beta Task', project_id: proj2.id });
  const task3 = createTask(db, accountAId, { column_id: col.id, title: 'Unassigned Task' });

  const allTasks = [task1, task2, task3];

  const filterByProject = (tasks, projId) => {
    if (!projId) return tasks;
    return tasks.filter(t => Number(t.project_id) === Number(projId));
  };

  const alphaOnly = filterByProject(allTasks, proj1.id);
  assert.equal(alphaOnly.length, 1);
  assert.equal(alphaOnly[0].title, 'Alpha Task');

  const betaOnly = filterByProject(allTasks, proj2.id);
  assert.equal(betaOnly.length, 1);
  assert.equal(betaOnly[0].title, 'Beta Task');

  const allUnfiltered = filterByProject(allTasks, null);
  assert.equal(allUnfiltered.length, 3);
});
