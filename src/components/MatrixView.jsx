// src/components/MatrixView.jsx
// Pick what to start next. Not started shows the Backlog; All adds Ready to start and In progress.
// One tap on Ready moves a Backlog task to Ready to start (swap flow when full).
import React, { useState } from 'react';
import { buildMatrix, readyRoom, roomNote, MATRIX_FILTERS } from '../lib/matrix.js';
import { projectSlot } from '../lib/day-list.js';
import Icon from './Icon.jsx';
import '../matrix.css';

export default function MatrixView({ tasks, columns, projects = [], selectedProjectId = null, onReady, onEditTask }) {
  const [filter, setFilter] = useState('notStarted');
  const room = readyRoom(tasks, columns);
  const backlog = columns.find((c) => c.name === 'Backlog');
  return (
    <div className="mxw">
      <div className="mf">
        <div className="seg" role="tablist" aria-label="Show">
          {MATRIX_FILTERS.map(([key, label]) => (
            <button key={key} type="button" role="tab" aria-selected={filter === key} onClick={() => setFilter(key)}>{label}</button>
          ))}
        </div>
        {room.limit != null && (
          <p className={`room${room.open === 0 ? ' full' : ''}`}>
            <span className="pips" aria-hidden="true">
              {Array.from({ length: room.limit }, (_, i) => <span key={i} className={`pip${i < room.used ? ' on' : ''}`} />)}
            </span>
            <span className="room-long">{roomNote(room.open)}</span>
            <span className="room-short">{room.open === 0 ? 'Full' : `${room.open} open`}</span>
          </p>
        )}
      </div>
      <div className="axis" aria-hidden="true"><span>Not urgent</span><span>Urgent</span></div>
      <div className="mx">
        {buildMatrix(tasks, columns, selectedProjectId, filter).map((q) => (
          <section key={q.key} className={`panel q q-${q.key}`} aria-label={q.label}>
            <div className="qh"><b>{q.label}</b><span>{q.hint}</span><span className="count">{q.tasks.length}</span></div>
            {q.tasks.length === 0 ? (
              <p className="qe">Nothing here yet.</p>
            ) : (
              <ul>
                {q.tasks.map((t) => {
                  const pi = projects.findIndex((p) => Number(p.id) === Number(t.project_id));
                  const inBacklog = backlog && Number(t.column_id) === Number(backlog.id);
                  return (
                    <li key={t.id} className="row">
                      <span className={`dot ${pi >= 0 ? `d${projectSlot(pi)}` : 'd0'}`} />
                      <button type="button" className="ttl" onClick={() => onEditTask?.(t)}>{t.title}</button>
                      {inBacklog ? (
                        <button type="button" className="mv" aria-label={`Move ${t.title} to Ready to start`} onClick={() => onReady?.(t)}><Icon name="plus" />Ready</button>
                      ) : (
                        <span className="stg">{columns.find((c) => Number(c.id) === Number(t.column_id))?.name === 'In Progress' ? 'In progress' : 'Ready'}</span>
                      )}
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
