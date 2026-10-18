// src/components/MatrixView.jsx
// Backlog only. One tap on Ready moves a task to Ready to start (swap flow when full).
import React from 'react';
import { buildMatrix } from '../lib/matrix.js';
import { projectSlot } from '../lib/day-list.js';
import '../matrix.css';

export default function MatrixView({ tasks, columns, projects = [], selectedProjectId = null, onReady, onEditTask }) {
  return (
    <div className="mxw">
      <div className="axis" aria-hidden="true"><span>Not urgent</span><span>Urgent</span></div>
      <div className="mx">
        {buildMatrix(tasks, columns, selectedProjectId).map((q) => (
          <section key={q.key} className="panel q" aria-label={q.label}>
            <div className="qh"><b>{q.label}</b><span>{q.hint}</span><span className="count">{q.tasks.length}</span></div>
            {q.tasks.length === 0 ? (
              <p className="qe">Nothing here yet.</p>
            ) : (
              <ul>
                {q.tasks.map((t) => {
                  const pi = projects.findIndex((p) => Number(p.id) === Number(t.project_id));
                  return (
                    <li key={t.id} className="row">
                      <span className={`dot ${pi >= 0 ? `d${projectSlot(pi)}` : 'd0'}`} />
                      <button type="button" className="ttl" onClick={() => onEditTask?.(t)}>{t.title}</button>
                      <button type="button" className="mv" aria-label={`Move ${t.title} to Ready to start`} onClick={() => onReady?.(t)}>Ready</button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
