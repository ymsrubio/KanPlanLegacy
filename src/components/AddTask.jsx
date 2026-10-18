// src/components/AddTask.jsx
// Title plus three chips (Project, Priority, When). Options live only in popovers.
import React, { useRef, useState } from 'react';
import Chip from './Chip.jsx';
import Icon from './Icon.jsx';
import { projectColor, projectSlot, priorityMark } from '../lib/day-list.js';
import { QUADRANT_ORDER, QUADRANT_LABEL, QUADRANT_HINT, QUADRANT_LEVELS, scoreOf } from '../lib/priority.js';
import { DEFAULT_CHOICES, LENGTHS, buildTask, lengthLabel, nameTaken, slotStart } from '../lib/add-task.js';
import { blocksOf, findOverlap, formatRange, formatTime, nextFreeSlot, toIso } from '../lib/schedule.js';
import { readyPlan } from '../lib/wip-swap.js';
import '../add-task.css';

const MIN = 60000;
const DAYS = [['today', 'Today'], ['tomorrow', 'Tomorrow']];

const Svg = ({ children }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);
const CalendarIcon = () => <Svg><rect x="2.5" y="3.5" width="11" height="10" rx="2" /><path d="M2.5 6.5h11M5.5 2v3M10.5 2v3" /></Svg>;
const AlertIcon = () => <Svg><circle cx="8" cy="8" r="5.5" /><path d="M8 5v3.5M8 10.8v.2" /></Svg>;

// "2:00 PM", "2pm", "14:00" -> minutes since midnight, or null.
function parseClock(text) {
  const m = /^(\d{1,2})(?::(\d{2}))?\s*([ap])?m?$/i.exec(text.trim());
  if (!m) return null;
  let h = Number(m[1]);
  const min = Number(m[2] ?? 0);
  if (min > 59 || h > 23) return null;
  if (m[3]) {
    if (h < 1 || h > 12) return null;
    h = (h % 12) + (m[3].toLowerCase() === 'p' ? 12 : 0);
  }
  return h * 60 + min;
}

const Opt = ({ on, onClick, className = '', children, ...rest }) => (
  <button type="button" data-opt="" role="radio" aria-checked={on} className={className} onClick={onClick} {...rest}>{children}</button>
);

export default function AddTask({ tasks, columns, projects, defaultProjectId = null, onAdd, onSwap, onCreateProject, onDone }) {
  const fresh = () => ({ ...DEFAULT_CHOICES, projectId: defaultProjectId });
  const [title, setTitle] = useState('');
  const [c, setC] = useState(fresh);
  const [startText, setStartText] = useState(null); // null: next free slot
  const [date, setDate] = useState(null); // 'YYYY-MM-DD' from the date picker, else Today/Tomorrow
  const picker = useRef(null);
  const [newName, setNewName] = useState('');
  const [nameError, setNameError] = useState('');
  const [more, setMore] = useState(false);
  const set = (patch) => setC((prev) => ({ ...prev, ...patch }));

  const ctx = { tasks, columns };
  const auto = date && c.day !== 'none' ? nextFreeSlot(blocksOf(tasks, columns), new Date(`${date}T09:00:00`), c.minutes) : slotStart(c.day, c.minutes, ctx);
  const clock = startText == null ? null : parseClock(startText);
  let start = auto;
  if (auto && clock != null) {
    start = new Date(auto);
    start.setHours(Math.floor(clock / 60), clock % 60, 0, 0);
  }
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
    setStartText(null);
    setDate(null);
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

  const dayName = date ? start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : c.day === 'tomorrow' ? 'Tomorrow' : 'Today';
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
                <>
                  <div className="at-top">
                    <div className="at-pills" role="radiogroup" aria-label="Day" style={{ flex: 1 }}>
                      {DAYS.map(([k, name]) => <Opt key={k} className="at-pill" on={!date && c.day === k} onClick={() => { setStartText(null); setDate(null); set({ day: k }); }}>{name}</Opt>)}
                    </div>
                    <button type="button" data-opt="" className="at-ibtn" aria-label="Pick a date" onClick={() => picker.current?.showPicker?.()}><CalendarIcon /></button>
                    <input ref={picker} className="at-date" type="date" tabIndex={-1} aria-label="Date" value={date ?? ''} onChange={(e) => { setStartText(null); setDate(e.target.value || null); }} />
                  </div>
                  <div className="at-time">
                    <input
                      data-opt=""
                      className="at-input"
                      aria-label="Starts"
                      aria-invalid={startText != null && clock == null}
                      value={startText ?? (start ? formatTime(start) : '')}
                      onChange={(e) => setStartText(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); close(); } }}
                    />
                    <button type="button" data-opt="" className="at-next" onClick={() => setStartText(null)}>Next free</button>
                  </div>
                  <div className="at-pills" role="radiogroup" aria-label="Length">
                    {LENGTHS.map((m) => <Opt key={m} className="at-pill" on={c.minutes === m && !more} onClick={() => { setMore(false); set({ minutes: m }); }}>{lengthLabel(m)}</Opt>)}
                    <Opt className="at-pill" on={more} onClick={() => setMore(true)}>More…</Opt>
                  </div>
                  {more && (
                    <label className="at-minutes">
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
              ) : (
                <Opt className="at-pill" on={false} onClick={() => set({ day: 'today' })}>Add a time</Opt>
              )}
              <div className="at-when-foot">
                {c.day !== 'none' ? <button type="button" data-opt="" className="btn quiet" onClick={() => { setStartText(null); set({ day: 'none' }); }}>Clear time</button> : <span />}
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
          <button type="button" className="btn secondary" onClick={() => setStartText(formatTime(free))}>Use {formatTime(free)}</button>
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
