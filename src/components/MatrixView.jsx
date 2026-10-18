// src/components/MatrixView.jsx
// Pick what to start next. Not started shows the Backlog; All adds Ready to start and In progress.
// One tap on Ready moves a Backlog task to Ready to start (swap flow when full).
// Desktop: four quadrant panels, long ones fold to two rows. Phone: one card, four collapsible sections.
import React, { useState } from 'react';
import { buildMatrix, foldRows, phoneOrder, stageLabel, readyRoom, roomNote, MATRIX_FILTERS } from '../lib/matrix.js';
import { projectSlot } from '../lib/day-list.js';
import { useMedia } from '../lib/use-media.js';
import Icon from './Icon.jsx';
import '../matrix.css';

export default function MatrixView({ tasks, columns, projects = [], selectedProjectId = null, onReady, onEditTask, onComplete }) {
  const isPhone = useMedia('(max-width: 640px)');
  const [filter, setFilter] = useState('notStarted');
  const [open, setOpen] = useState({}); // phone: key -> false when collapsed
  const [more, setMore] = useState({}); // desktop: key -> true when expanded
  const room = readyRoom(tasks, columns);
  const backlog = columns.find((c) => c.name === 'Backlog');
  const stageOf = (t) => stageLabel(columns.find((c) => Number(c.id) === Number(t.column_id)));

  const row = (t) => {
    const pi = projects.findIndex((p) => Number(p.id) === Number(t.project_id));
    const inBacklog = backlog && Number(t.column_id) === Number(backlog.id);
    return (
      <li key={t.id} className="row">
        {isPhone && onComplete && (
          <label className="cbl"><input className="cb" type="checkbox" aria-label={t.title} onChange={() => onComplete(t)} /></label>
        )}
        {!isPhone && <span className={`dot ${pi >= 0 ? `d${projectSlot(pi)}` : 'd0'}`} />}
        <button type="button" className="ttl" onClick={() => onEditTask?.(t)}>{t.title}</button>
        {inBacklog ? (
          <button type="button" className="mv" aria-label={`Move ${t.title} to Ready to start`} onClick={() => onReady?.(t)}><Icon name="plus" />Ready</button>
        ) : (
          <span className="stg">{stageOf(t)}</span>
        )}
      </li>
    );
  };

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
            {isPhone ? (room.open === 0 ? 'Full' : `${room.open} open`) : roomNote(room.open)}
          </p>
        )}
      </div>
      {!isPhone && <div className="axis" aria-hidden="true"><span>Not urgent</span><span>Urgent</span></div>}
      <div className="mx">
        {isPhone ? (
          <section className="panel mxc" aria-label="Matrix">
            {phoneOrder(buildMatrix(tasks, columns, selectedProjectId, filter)).map((q) => {
              const expanded = open[q.key] !== false;
              return (
                <section key={q.key} aria-label={q.label}>
                  <h3>
                    <button type="button" className="gh" aria-expanded={expanded} onClick={() => setOpen({ ...open, [q.key]: !expanded })}>
                      <span className="tile"><Icon name="lines" /></span>
                      <span className="gname">{q.label}</span>
                      <span className="count">{q.tasks.length}</span>
                      <span className="chev"><Icon name={expanded ? 'down' : 'right'} /></span>
                    </button>
                  </h3>
                  {expanded && q.tasks.length > 0 && <ul>{q.tasks.map(row)}</ul>}
                </section>
              );
            })}
          </section>
        ) : (
          buildMatrix(tasks, columns, selectedProjectId, filter).map((q) => {
            const { rows, hidden } = foldRows(q.tasks, more[q.key]);
            return (
              <section key={q.key} className="panel q" aria-label={q.label}>
                <div className="qh"><b>{q.label}</b><span>{q.hint}</span><span className="count">{q.tasks.length}</span></div>
                {q.tasks.length === 0 ? <p className="qe">Nothing here yet.</p> : <ul>{rows.map(row)}</ul>}
                {hidden > 0 && <button type="button" className="link" onClick={() => setMore({ ...more, [q.key]: true })}><Icon name="down" />Show {hidden} more</button>}
              </section>
            );
          })
        )}
      </div>
    </div>
  );
}
