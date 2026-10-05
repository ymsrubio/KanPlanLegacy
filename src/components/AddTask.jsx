// src/components/AddTask.jsx
// Title plus three chips (Project, Priority, When). Options live only in popovers.
import React, { useState } from 'react';
import Chip from './Chip.jsx';
import { projectColor } from '../lib/day-list.js';
import { QUADRANT_ORDER, QUADRANT_LABEL, QUADRANT_HINT } from '../lib/priority.js';
import { DEFAULT_CHOICES, LENGTHS, buildTask, lengthLabel, nameTaken, slotStart, whenLabel } from '../lib/add-task.js';
import { formatTime } from '../lib/schedule.js';
import '../add-task.css';

const DAYS = [['today', 'Today'], ['tomorrow', 'Tomorrow'], ['none', 'No time']];
const Opt = ({ on, onClick, children, ...rest }) => (
  <button type="button" data-opt="" role="menuitemradio" aria-checked={on} className="at-opt" onClick={onClick} {...rest}>
    <span className="at-check" aria-hidden="true">{on ? '✓' : ''}</span>{children}
  </button>
);

export default function AddTask({ tasks, columns, projects, defaultProjectId = null, onAdd, onCreateProject, onDone }) {
  const fresh = () => ({ ...DEFAULT_CHOICES, projectId: defaultProjectId });
  const [title, setTitle] = useState('');
  const [c, setC] = useState(fresh);
  const [newName, setNewName] = useState('');
  const [nameError, setNameError] = useState('');
  const [more, setMore] = useState(false);
  const set = (patch) => setC((prev) => ({ ...prev, ...patch }));

  const ctx = { tasks, columns };
  const start = slotStart(c.day, c.minutes, ctx);
  const project = projects.find((p) => Number(p.id) === Number(c.projectId));

  const submit = () => {
    if (!title.trim()) return;
    onAdd(buildTask({ title, ...c }, ctx));
    setTitle('');
    setC(fresh());
    setMore(false);
    onDone?.();
  };

  const createProject = async (close) => {
    const name = newName.trim();
    if (!name) return;
    if (nameTaken(projects, name)) return setNameError('That name is taken.');
    try {
      const p = await onCreateProject(name, projectColor(projects.length));
      set({ projectId: p.id });
      setNewName('');
      setNameError('');
      close();
    } catch (e) {
      setNameError(e.message);
    }
  };

  return (
    <div className="at">
      <input
        className="at-title"
        value={title}
        placeholder="What needs doing?"
        aria-label="Task title"
        autoFocus
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
      />
      <div className="at-chips">
        <Chip ariaLabel="Project" label={project ? <><span className="at-dot" style={{ background: projectColor(projects.indexOf(project)) }} />{project.name}</> : 'No project'}>
          {(close) => (
            <>
              <Opt on={c.projectId == null} onClick={() => { set({ projectId: null }); close(); }}>No project</Opt>
              {projects.map((p, i) => (
                <Opt key={p.id} on={Number(c.projectId) === Number(p.id)} onClick={() => { set({ projectId: p.id }); close(); }}>
                  <span className="at-dot" style={{ background: projectColor(i) }} />{p.name}
                </Opt>
              ))}
              <div className="at-new">
                <input
                  data-opt=""
                  className="at-input"
                  placeholder="New project"
                  aria-label="New project name"
                  aria-invalid={Boolean(nameError)}
                  value={newName}
                  onChange={(e) => { setNewName(e.target.value); setNameError(''); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); createProject(close); } }}
                />
                <button type="button" data-opt="" className="at-opt at-create" onClick={() => createProject(close)}>Create</button>
              </div>
              {nameError && <div className="at-error" role="alert">{nameError}</div>}
            </>
          )}
        </Chip>

        <Chip ariaLabel="Priority" label={QUADRANT_LABEL[c.quadrant]}>
          {(close) => (
            <div className="at-quads">
              {QUADRANT_ORDER.map((q) => (
                <Opt key={q} on={c.quadrant === q} onClick={() => { set({ quadrant: q }); close(); }}>
                  <b>{QUADRANT_LABEL[q]}</b><small>{QUADRANT_HINT[q]}</small>
                </Opt>
              ))}
            </div>
          )}
        </Chip>

        <Chip ariaLabel="When" label={whenLabel(c.day, c.minutes, start)}>
          {(close) => (
            <>
              <div className="at-row">
                {DAYS.map(([k, name]) => <Opt key={k} on={c.day === k} onClick={() => set({ day: k })}>{name}</Opt>)}
              </div>
              {c.day !== 'none' && (
                <div className="at-row">
                  {LENGTHS.map((m) => <Opt key={m} on={c.minutes === m && !more} onClick={() => { setMore(false); set({ minutes: m }); close(); }}>{lengthLabel(m)}</Opt>)}
                  <Opt on={more} onClick={() => setMore(true)}>More</Opt>
                </div>
              )}
              {more && c.day !== 'none' && (
                <label className="at-more">
                  Minutes
                  <input
                    data-opt=""
                    className="at-input"
                    type="number"
                    min="5"
                    step="5"
                    value={c.minutes}
                    onChange={(e) => set({ minutes: Math.max(5, Math.round(Number(e.target.value) / 5) * 5 || 5) })}
                  />
                </label>
              )}
            </>
          )}
        </Chip>
      </div>
      <button type="button" className="at-primary" disabled={!title.trim()} onClick={submit}>
        {!title.trim() ? 'Add task' : c.day === 'none' ? 'Add to Backlog' : `Add for ${c.day === 'tomorrow' ? 'tomorrow ' : ''}${formatTime(start)}`}
      </button>
    </div>
  );
}
