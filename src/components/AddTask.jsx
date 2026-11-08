// src/components/AddTask.jsx
// Title plus three chips (Project, Priority, When). Options live only in popovers.
import React, { useState } from 'react';
import Chip from './Chip.jsx';
import Icon from './Icon.jsx';
import WhenFields, { AlertIcon, CalendarIcon, Opt } from './WhenFields.jsx';
import { projectColor, projectSlot, priorityMark } from '../lib/day-list.js';
import { QUADRANT_ORDER, QUADRANT_LABEL, QUADRANT_HINT, QUADRANT_LEVELS, scoreOf } from '../lib/priority.js';
import { DEFAULT_CHOICES, buildTask, lengthLabel, nameTaken, resolveStart } from '../lib/add-task.js';
import { blocksOf, findOverlap, formatRange, formatTime, nextFreeSlot, toIso } from '../lib/schedule.js';
import { readyPlan } from '../lib/wip-swap.js';
import '../add-task.css';

const MIN = 60000;

export default function AddTask({ tasks, columns, projects, defaultProjectId = null, onAdd, onSwap, onCreateProject, onDone }) {
  // Day, date, typed start and length live together; buildTask ignores the picker-only keys.
  const fresh = () => ({ ...DEFAULT_CHOICES, projectId: defaultProjectId, date: null, startText: null, more: false });
  const [title, setTitle] = useState('');
  const [c, setC] = useState(fresh);
  const [newName, setNewName] = useState('');
  const [nameError, setNameError] = useState('');
  const set = (patch) => setC((prev) => ({ ...prev, ...patch }));

  const ctx = { tasks, columns };
  const start = resolveStart(c, ctx);
  const end = start && new Date(start.getTime() + c.minutes * MIN);
  const project = projects.find((p) => Number(p.id) === Number(c.projectId));
  const projectIndex = projects.indexOf(project);

  const blocks = blocksOf(tasks, columns);
  const hit = start ? findOverlap(blocks, null, start, end) : null;
  const hitTask = hit && tasks.find((t) => Number(t.id) === Number(hit.id));
  const free = hit && nextFreeSlot(blocks, start, c.minutes);
  const backlog = columns.find((col) => col.name === 'Backlog') ?? columns[0];
  const full = Boolean(start) && readyPlan(tasks, columns, { column_id: backlog?.id }).full;

  const submit = (swap = false) => {
    if (!title.trim()) return;
    const payload = buildTask({ title, ...c }, ctx);
    if (start) {
      payload.schedule_start = toIso(start);
      payload.schedule_end = toIso(end);
    }
    if (swap && onSwap) onSwap(payload); else onAdd(payload); // without onSwap, a full Ready still adds as before
    setTitle('');
    setC(fresh());
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

  const dayName = c.date && start ? start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : c.day === 'tomorrow' ? 'Tomorrow' : 'Today';
  // The free slot can fall on a later day than the start; keep its day, not just its clock.
  const useFree = () => {
    set({ startText: formatTime(free), ...(free.toDateString() !== start.toDateString() && { date: toIso(free).slice(0, 10) }) });
  };
  const mark = priorityMark(scoreOf(QUADRANT_LEVELS[c.quadrant]))?.level;
  const canSwap = full;
  const label = !title.trim() || start ? 'Schedule task' : 'Add to Backlog';

  return (
    <div className="at">
      <input
        className="at-title"
        value={title}
        placeholder="What needs doing?"
        aria-label="Task title"
        autoFocus
        autoComplete="off"
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit(canSwap)}
      />
      <div className="at-chips">
        <Chip ariaLabel="Project" popup="listbox" role="radiogroup" label={<><span className={`dot ${project ? `d${projectSlot(projectIndex)}` : 'd0'}`} />{project ? project.name : 'No project'}</>}>
          {(close) => (
            <>
              <Opt className={`row${c.projectId == null ? ' is-selected' : ''}`} on={c.projectId == null} onClick={() => { set({ projectId: null }); close(); }}>
                <span className="dot d0" />No project{c.projectId == null && <span className="at-ck"><Icon name="check" /></span>}
              </Opt>
              {projects.map((p, i) => {
                const on = Number(c.projectId) === Number(p.id);
                return (
                  <Opt key={p.id} className={`row${on ? ' is-selected' : ''}`} on={on} onClick={() => { set({ projectId: p.id }); close(); }}>
                    <span className={`dot d${projectSlot(i)}`} />{p.name}{on && <span className="at-ck"><Icon name="check" /></span>}
                  </Opt>
                );
              })}
              <hr />
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
                <button type="button" data-opt="" className="btn secondary" onClick={() => createProject(close)}>Create</button>
              </div>
              {nameError && <div className="at-error" role="alert"><AlertIcon />{nameError}</div>}
            </>
          )}
        </Chip>

        <Chip ariaLabel="Priority" role="radiogroup" width={420} label={<>{mark && <span className="at-mark" aria-hidden="true"><Icon name={mark} /></span>}{QUADRANT_LABEL[c.quadrant]}</>}>
          {(close) => (
            <div className="at-quads">
              {QUADRANT_ORDER.map((q) => (
                <Opt key={q} className="at-pt" on={c.quadrant === q} onClick={() => { set({ quadrant: q }); close(); }}>
                  <b>{QUADRANT_LABEL[q]}</b><span>{QUADRANT_HINT[q]}</span>
                </Opt>
              ))}
            </div>
          )}
        </Chip>

        <Chip
          ariaLabel="When"
          width={360}
          tone={hit ? 'warn' : start ? undefined : 'unset'}
          label={<>{hit ? <AlertIcon /> : <CalendarIcon />}{start ? `${dayName} · ${formatTime(start)} · ${lengthLabel(c.minutes)}` : 'No time'}</>}
        >
          {(close) => (
            <div className="at-when">
              {c.day !== 'none' ? (
                <WhenFields value={c} start={start} onChange={set} onEnter={close} />
              ) : (
                <Opt className="at-pill" on={false} onClick={() => set({ day: 'today' })}>Add a time</Opt>
              )}
              <div className="at-when-foot">
                {c.day !== 'none' ? <button type="button" data-opt="" className="btn quiet" onClick={() => set({ day: 'none', date: null, startText: null })}>Clear time</button> : <span />}
                <button type="button" data-opt="" className="btn primary" onClick={close}>Done</button>
              </div>
            </div>
          )}
        </Chip>
      </div>

      {hit && (
        <div className="at-banner" role="status">
          <span className="tile"><AlertIcon /></span>
          <p>{formatTime(start)} overlaps {hitTask?.title ?? 'another task'} ({formatRange(toIso(hit.start), toIso(hit.end))}).</p>
          <button type="button" className="btn secondary" onClick={() => useFree()}>Use {formatTime(free)}</button>
        </div>
      )}
      {full && (
        <div className="at-banner" role="status">
          <span className="tile"><AlertIcon /></span>
          <p>Ready to start is full. Swap a task to make room.</p>
          <button type="button" className="btn secondary" onClick={() => submit(true)}>Swap a task</button>
        </div>
      )}

      <div className="at-foot">
        <button type="button" className="btn quiet" onClick={() => onDone?.()}>Cancel</button>
        <button type="button" className="btn primary" disabled={!title.trim()} onClick={() => submit(canSwap)}>{canSwap ? 'Swap and schedule' : label}</button>
      </div>
    </div>
  );
}
