// src/components/MatrixView.jsx
// Backlog only. One tap on Ready moves a task to Ready to start (swap flow when full).
import React from 'react';
import { buildMatrix } from '../lib/matrix.js';
import { projectColor } from '../lib/day-list.js';
import '../matrix.css';

export default function MatrixView({ tasks, columns, projects = [], selectedProjectId = null, onReady, onEditTask }) {
  return (
    <div className="mx">
      {buildMatrix(tasks, columns, selectedProjectId).map((q) => (
        <section key={q.key} className="mx-q" aria-label={q.label}>
          <h3 className="mx-head">
            {q.label}
            <span className="mx-count">{q.tasks.length}</span>
          </h3>
          <p className="mx-hint">{q.hint}</p>
          {q.tasks.length === 0 && <div className="mx-empty">Nothing here yet.</div>}
          {q.tasks.map((t) => {
            const pi = projects.findIndex((p) => Number(p.id) === Number(t.project_id));
            return (
              <div key={t.id} className="mx-card">
                <button type="button" className="mx-title" onClick={() => onEditTask?.(t)}>
                  {pi >= 0 && <span className="mx-dot" style={{ background: projectColor(pi) }} />}
                  {t.title}
                </button>
                <button type="button" className="mx-ready" aria-label={`Ready: ${t.title}`} onClick={() => onReady?.(t)}>Ready</button>
              </div>
            );
          })}
        </section>
      ))}
    </div>
  );
}
