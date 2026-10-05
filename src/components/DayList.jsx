// src/components/DayList.jsx
import React from 'react';
import { buildDayList, priorityMark, projectColor } from '../lib/day-list.js';
import { scoreOf } from '../lib/priority.js';
import '../day-list.css';

const EMPTY = {
  empty: ['Nothing planned', 'Add a task to start your day.'],
  filtered: ['No tasks in this project', 'Choose another project to see more.']
};

export default function DayList({ tasks, columns, projects = [], selectedProjectId = null, onEditTask, onComplete }) {
  const { groups, nextId, state } = buildDayList(tasks, columns, selectedProjectId);
  if (state !== 'ok') {
    const [title, hint] = EMPTY[state];
    return <div className="dl-empty"><b>{title}</b>{hint}</div>;
  }
  return (
    <div className="dl">
      {groups.map((g) => (
        <section key={g.key} aria-label={g.name}>
          <h3 className="dl-head">
            {g.name}
            {g.limit !== null && (
              <span className="dl-pips" role="img" aria-label={`${g.used} of ${g.limit} used`}>
                {Array.from({ length: g.limit }, (_, i) => <span key={i} className="dl-pip" data-on={i < g.used ? '' : undefined} />)}
              </span>
            )}
            {g.full && <span className="dl-full">Full</span>}
            <span className="dl-count">{g.limit !== null ? `${g.used}/${g.limit}` : g.used}</span>
          </h3>
          {g.tasks.length === 0 && <div className="dl-empty">Nothing here yet.</div>}
          {g.tasks.map((t) => {
            const mark = priorityMark(scoreOf(t));
            const pi = projects.findIndex((p) => Number(p.id) === Number(t.project_id));
            return (
              <div key={t.id} className="dl-row" onClick={() => onEditTask?.(t)}>
                <label className="dl-tap" onClick={(e) => e.stopPropagation()}>
                  <input className="dl-check" type="checkbox" aria-label={`Complete ${t.title}`} onChange={() => onComplete?.(t)} />
                </label>
                <span className="dl-title">{t.title}</span>
                {t.id === nextId && <span className="dl-next">Next</span>}
                {mark && <span className="dl-mark" role="img" aria-label={mark.label}>{mark.text}</span>}
                {pi >= 0 && <span className="dl-chip"><span className="dl-dot" style={{ background: projectColor(pi) }} />{projects[pi].name}</span>}
              </div>
            );
          })}
        </section>
      ))}
    </div>
  );
}
