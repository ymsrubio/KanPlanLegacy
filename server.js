// server.js
// Express API Server for KanPlan with SQLite / D1 backend

const express = require('express');
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const { createTask, moveTask } = require('./lib/task-service');
const { createColumn, updateColumn, deleteColumn } = require('./lib/column-service');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable JSON body parsing
app.use(express.json());

// Initialize SQLite database (local dev / production file)
const dbPath = path.join(__dirname, 'kanplan.db');
const db = new Database(dbPath);

// Ensure database schema is initialized
const schemaSql = fs.readFileSync(path.join(__dirname, 'db/schema.sql'), 'utf8');
db.exec(schemaSql);

// --- REST API ENDPOINTS ---

// 1. GET /api/columns - Fetch all columns
app.get('/api/columns', (req, res) => {
  try {
    const columns = db.prepare('SELECT * FROM columns ORDER BY position ASC').all();
    res.json(columns);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. GET /api/tasks - Fetch all tasks
app.get('/api/tasks', (req, res) => {
  try {
    const tasks = db.prepare('SELECT * FROM tasks ORDER BY column_id ASC, position ASC').all();
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. POST /api/tasks - Create a new task (with WIP limit validation)
app.post('/api/tasks', (req, res) => {
  try {
    const newTask = createTask(db, req.body);
    res.status(201).json(newTask);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 4. PATCH /api/tasks/:id - Move task / update column or position
app.patch('/api/tasks/:id', (req, res) => {
  try {
    const taskId = Number(req.params.id);
    const { column_id, position } = req.body;
    const updated = moveTask(db, taskId, column_id, position || 0);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 5. POST /api/columns - Create new column
app.post('/api/columns', (req, res) => {
  try {
    const newCol = createColumn(db, req.body);
    res.status(201).json(newCol);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Serve Vite static build in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 KanPlan server running on http://localhost:${PORT}`);
  });
}

module.exports = { app, db };