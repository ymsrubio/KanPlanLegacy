// src/components/DayList.jsx
// The compact list panel: In progress, Ready to start, Backlog, Done. Tap a title to edit.
import React, { useState } from 'react';
import { buildDayList, priorityMark, projectSlot, chipLabel, BACKLOG_ROWS } from '../lib/day-list.js';
import { scoreOf } from '../lib/priority.js';
import Icon from './Icon.jsx';
import '../workspace.css';

const GROUP_ICON = { inProgress: 'running', ready: 'clock', backlog: 'lines', done: 'done' };

const EMPTY = {
  empty: ['Nothing planned yet', 'Add a task, then give it a time. It moves to Ready to start on its own.'],
  filtered: ['No tasks in this project', 'Choose another project to see more.']
};

function GroupHeader({ group, open, onToggle }) {
  return (
    <h3 className="dl-h">
      <button type="button" className={`gh${group.full ? ' full' : ''}`} aria-expanded={open} onClick={onToggle}>
        <span className="tile"><Icon name={GROUP_ICON[group.key]} /></span>
        <span className="gname">{group.name}</span>
        {group.limit !== null && (
          <span className="pips" aria-hidden="true">
            {Array.from({ length: group.limit }, (_, i) => <i key={i} className={`pip${i < group.used ? ' on' : ''}`} />)}
          </span>
        )}
        <span className="count">
          {group.limit !== null ? `${group.used}/${group.limit}` : group.used}
          <span className="sr"> tasks</span>
        </span>
        <span className="chev"><Icon name={open ? 'down' : 'right'} /></span>
      </button>
    </h3>
  );
}

function Row({ task, group, isNext, projects, onEditTask, onComplete }) {
  const mark = priorityMark(scoreOf(task));
  const pi = projects.findIndex((p) => Number(p.id) === Number(task.project_id));
  const chip = chipLabel(task, pi >= 0 ? projects[pi].name : null);
  const running = group === 'inProgress';
  const done = group === 'done';
  return (
    <li className="row">
      <label className="cbl">
        <input
          className={`cb${running ? ' run' : ''}`}
          type="checkbox"
          checked={done}
          disabled={done}
          aria-label={running ? `${task.title} (running now)` : task.title}
          onChange={() => onComplete?.(task)}
        />
      </label>
      <button type="button" className={`ttl${isNext ? ' nxt' : running ? ' run' : done ? ' done' : ''}`} onClick={() => onEditTask?.(task)}>
        {task.title}
      </button>
      {isNext && <span className="next">Next</span>}
      {mark && <span className={`pm ${mark.level}`} role="img" aria-label={mark.label}><Icon name={mark.level} /></span>}
      {chip && <span className={`chip${pi >= 0 ? ` c-${projectSlot(pi)}` : ''}`}>{chip}</span>}
    </li>
  );
}

export default function DayList({ tasks, columns, projects = [], selectedProjectId = null, onEditTask, onComplete, onAdd }) {
  const [closed, setClosed] = useState({ done: true });
  const [allBacklog, setAllBacklog] = useState(false);
  const { groups, nextId, state } = buildDayList(tasks, columns, selectedProjectId);

  return (
    <div className="dl">
      {groups.map((g) => {
        const open = !closed[g.key];
        const limit = g.key === 'backlog' && !allBacklog ? BACKLOG_ROWS : Infinity;
        const shown = g.tasks.slice(0, limit);
        const hidden = g.tasks.length - shown.length;
        return (
          <section key={g.key} aria-label={g.name}>
            <GroupHeader group={g} open={open} onToggle={() => setClosed((c) => ({ ...c, [g.key]: open }))} />
            {open && shown.length > 0 && (
              <ul>
                {shown.map((t) => (
                  <Row key={t.id} task={t} group={g.key} isNext={t.id === nextId} projects={projects} onEditTask={onEditTask} onComplete={onComplete} />
                ))}
              </ul>
            )}
            {open && g.key === 'backlog' && (
              <>
                {hidden > 0 && (
                  <button type="button" className="link" onClick={() => setAllBacklog(true)}><Icon name="down" />Show {hidden} more</button>
                )}
                {state === 'ok' && <button type="button" className="link" onClick={onAdd}><Icon name="plus" />Add task</button>}
              </>
            )}
            {g.key === 'backlog' && state !== 'ok' && (
              <div className="empty">
                <h2>{EMPTY[state][0]}</h2>
                <p>{EMPTY[state][1]}</p>
                {state === 'empty' && <button type="button" className="btn primary" onClick={onAdd}>Add task</button>}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
