// src/components/TaskEditDrawer.jsx
// Right-side drawer for editing task details, priority, due date and schedule block.
// Not drawn in the design: built from the Components artboard (3) fields and buttons plus workspace.css.

import React, { useState, useEffect } from 'react';
import { getTodayDateString, getCurrentRoundedTime, generate5MinTimeOptions } from '../lib/time-utils.js';
import { formatRange } from '../lib/schedule.js';
import { QUADRANT_ORDER, QUADRANT_LABEL, QUADRANT_HINT, QUADRANT_LEVELS, quadrantOf, scoreOf } from '../lib/priority.js';

// Shared by the edit and archive drawers.
export const drawerCss = `
.drw-scrim { position: fixed; inset: 0; z-index: 1000; background: var(--scrim); display: flex; justify-content: flex-end; }
.drw { width: 100%; max-width: 440px; height: 100%; box-sizing: border-box; background: var(--surface); border-left: 1px solid var(--rule); box-shadow: var(--shadow-pop); display: flex; flex-direction: column; color: var(--text); }
.drw-head { flex: none; display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); padding: var(--space-5) var(--space-6); border-bottom: 1px solid var(--rule); }
.drw-head h2 { font-size: var(--t-18); font-weight: 600; letter-spacing: -.01em; display: flex; align-items: center; gap: var(--space-2); }
.drw-body { flex: 1; min-height: 0; overflow-y: auto; padding: var(--space-6); display: flex; flex-direction: column; gap: var(--space-4); }
.drw-foot { flex: none; display: flex; flex-direction: column; gap: var(--space-2); padding: var(--space-4) var(--space-6) var(--space-6); border-top: 1px solid var(--rule); }
.drw-field { height: var(--h-ctl); box-sizing: border-box; width: 100%; border: 1px solid var(--control); border-radius: var(--r-md); padding: 0 var(--space-3); font: inherit; font-size: var(--t-15); color: var(--text); background: var(--surface); outline: 2px solid transparent; outline-offset: 1px; }
.drw-field::placeholder { color: var(--text-3); opacity: 1; }
@media (hover: hover) { .drw-field:hover { background: var(--page); } }
.drw-field:focus-visible { outline-color: var(--focus); border-color: var(--text); }
.drw-field[aria-invalid="true"] { border-color: var(--error); }
textarea.drw-field { height: auto; padding: var(--space-3); line-height: 1.45; resize: vertical; }
.drw-label { font-size: var(--t-14); font-weight: 600; }
.drw-group { display: flex; flex-direction: column; gap: var(--space-2); min-width: 0; }
.drw-help { font-size: var(--t-12); color: var(--text-3); line-height: 1.4; display: flex; align-items: center; gap: var(--space-1); }
.drw-help.err { color: var(--error); }
`;

export default function TaskEditDrawer({ isOpen, onClose, onSave, task, projects = [], columns = [], tasks = [], onArchive }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState('');
  const [columnId, setColumnId] = useState('');
  const [urgencyLevel, setUrgencyLevel] = useState(3);
  const [importanceLevel, setImportanceLevel] = useState(3);
  const [deadline, setDeadline] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);

  // Schedule state
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduleDate, setScheduleDate] = useState(getTodayDateString());
  const [startTime, setStartTime] = useState(getCurrentRoundedTime());
  const [durationMinutes, setDurationMinutes] = useState('60');

  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setProjectId(task.project_id ? String(task.project_id) : '');
      setColumnId(task.column_id ? String(task.column_id) : '');
      setUrgencyLevel(task.urgency_level || (task.is_urgent ? 4 : 2));
      setImportanceLevel(task.importance_level || (task.is_important ? 4 : 2));
      setDeadline(task.deadline || '');
      setErrorMsg(null);

      const hasStart = Boolean(task.schedule_start);
      setIsScheduled(hasStart);

      if (hasStart) {
        setScheduleDate(task.schedule_start.split('T')[0] || getTodayDateString());
        setStartTime(task.schedule_start.split('T')[1]?.substring(0, 5) || getCurrentRoundedTime());

        if (task.schedule_end) {
          const startMs = new Date(task.schedule_start).getTime();
          const endMs = new Date(task.schedule_end).getTime();
          const diffMins = Math.round((endMs - startMs) / (60 * 1000));
          if (diffMins > 0) {
            setDurationMinutes(String(diffMins));
          }
        }
      } else {
        setScheduleDate(getTodayDateString());
        setStartTime(getCurrentRoundedTime());
        setDurationMinutes('60');
      }
    }
  }, [task]);

  if (!isOpen || !task) return null;

  const priorityScore = scoreOf({ urgency_level: urgencyLevel, importance_level: importanceLevel });
  const timeOptions = generate5MinTimeOptions();

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate WIP limit if changing column
    const targetColId = Number(columnId);
    if (targetColId && targetColId !== Number(task.column_id)) {
      const targetCol = columns.find((c) => Number(c.id) === targetColId);
      if (targetCol && targetCol.name !== 'Ready to Start' && targetCol.wip_limit !== null) { // Ready to Start offers a swap instead
        const destCount = tasks.filter((t) => Number(t.column_id) === targetColId && !t.is_archived).length;
        if (destCount >= targetCol.wip_limit) {
          setErrorMsg(`Cannot move to "${targetCol.name}": WIP limit reached (${targetCol.wip_limit}/${targetCol.wip_limit}).`);
          return;
        }
      }
    }

    let computedStart = null;
    let computedEnd = null;

    if (isScheduled && scheduleDate && startTime) {
      computedStart = `${scheduleDate}T${startTime}:00`;
      const [startH, startM] = startTime.split(':').map(Number);
      const startObj = new Date(scheduleDate);
      startObj.setHours(startH, startM, 0, 0);

      const endObj = new Date(startObj.getTime() + Number(durationMinutes) * 60 * 1000);
      const endY = endObj.getFullYear();
      const endM = String(endObj.getMonth() + 1).padStart(2, '0');
      const endD = String(endObj.getDate()).padStart(2, '0');
      const endHStr = String(endObj.getHours()).padStart(2, '0');
      const endMinStr = String(endObj.getMinutes()).padStart(2, '0');
      computedEnd = `${endY}-${endM}-${endD}T${endHStr}:${endMinStr}:00`;
    }

    onSave({
      ...task,
      column_id: targetColId || task.column_id,
      title: title.trim(),
      description,
      project_id: projectId ? Number(projectId) : null,
      urgency_level: urgencyLevel,
      importance_level: importanceLevel,
      is_urgent: urgencyLevel >= 4 ? 1 : 0,
      is_important: importanceLevel >= 4 ? 1 : 0,
      priority_score: priorityScore,
      deadline: deadline || null,
      schedule_start: computedStart,
      schedule_end: computedEnd
    });
  };

  const quadrant = quadrantOf({ urgency_level: urgencyLevel, importance_level: importanceLevel });
  const pickQuadrant = (q) => {
    if (q === quadrant) return;
    setUrgencyLevel(QUADRANT_LEVELS[q].urgency_level);
    setImportanceLevel(QUADRANT_LEVELS[q].importance_level);
  };

  const range = isScheduled && scheduleDate && startTime
    ? formatRange(`${scheduleDate}T${startTime}:00`, new Date(new Date(`${scheduleDate}T${startTime}:00`).getTime() + Number(durationMinutes) * 60000))
    : null;

  return (
    <div className="drw-scrim" onClick={onClose}>
      <style>{drawerCss + editCss}</style>
      <form className="drw" role="dialog" aria-modal="true" aria-labelledby="ed-title" onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()}>
        <div className="drw-head">
          <h2 id="ed-title">Edit task</h2>
          <button type="button" className="btn quiet icon" aria-label="Close" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" /></svg>
          </button>
        </div>

        <div className="drw-body">
          <div className="drw-group">
            <label className="drw-label" htmlFor="ed-name">Title</label>
            <input id="ed-name" className="drw-field" type="text" required value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          {columns.length > 0 && (
            <div className="drw-group">
              <label className="drw-label" htmlFor="ed-col">Stage</label>
              <select
                id="ed-col"
                className="drw-field"
                value={columnId}
                aria-invalid={errorMsg ? 'true' : undefined}
                onChange={(e) => { setColumnId(e.target.value); setErrorMsg(null); }}
              >
                {columns.map((c) => {
                  const count = tasks.filter((t) => Number(t.column_id) === Number(c.id) && !t.is_archived).length;
                  return <option key={c.id} value={c.id}>{c.wip_limit !== null ? `${c.name} (${count}/${c.wip_limit})` : c.name}</option>;
                })}
              </select>
              {errorMsg && <div className="drw-help err" role="alert">{errorMsg}</div>}
            </div>
          )}

          <div className="drw-group">
            <label className="drw-label" htmlFor="ed-proj">Project</label>
            <select id="ed-proj" className="drw-field" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
              <option value="">No project</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div className="drw-group">
            <label className="drw-label" htmlFor="ed-desc">Description</label>
            <textarea id="ed-desc" className="drw-field" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div className="drw-group" role="radiogroup" aria-label="Priority">
            <span className="drw-label">Priority</span>
            <div className="ed-quads">
              {QUADRANT_ORDER.map((q) => (
                <button key={q} type="button" role="radio" aria-checked={q === quadrant} className="ed-pt" onClick={() => pickQuadrant(q)}>
                  <b>{QUADRANT_LABEL[q]}</b>
                  <span>{QUADRANT_HINT[q]}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="drw-group">
            <label className="drw-label" htmlFor="ed-due">Due date</label>
            <input id="ed-due" className="drw-field" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </div>

          <div className="drw-group">
            <div className="ed-sched-head">
              <span className="drw-label">Time block</span>
              {isScheduled && <button type="button" className="btn quiet" style={{ height: 'var(--h-ctl-sm)' }} onClick={() => setIsScheduled(false)}>Clear</button>}
            </div>
            {isScheduled ? (
              <>
                <div className="drw-group">
                  <label className="drw-help" htmlFor="ed-sdate">Date</label>
                  <input id="ed-sdate" className="drw-field" type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} />
                </div>
                <div className="ed-two">
                  <div className="drw-group">
                    <label className="drw-help" htmlFor="ed-start">Start</label>
                    <select id="ed-start" className="drw-field" value={startTime} onChange={(e) => setStartTime(e.target.value)}>
                      {timeOptions.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div className="drw-group">
                    <label className="drw-help" htmlFor="ed-dur">Length</label>
                    <select id="ed-dur" className="drw-field" value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)}>
                      <option value="15">15 minutes</option>
                      <option value="30">30 minutes</option>
                      <option value="45">45 minutes</option>
                      <option value="60">1 hour</option>
                      <option value="120">2 hours</option>
                      <option value="180">3 hours</option>
                    </select>
                  </div>
                </div>
                {range && <p className="drw-help">{range}</p>}
              </>
            ) : (
              <>
                <p className="drw-help">Not on the calendar.</p>
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => { setIsScheduled(true); setScheduleDate(getTodayDateString()); setStartTime(getCurrentRoundedTime()); }}
                >
                  Add a time block
                </button>
              </>
            )}
          </div>
        </div>

        <div className="drw-foot">
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <button type="button" className="btn secondary" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
            <button type="submit" className="btn primary" style={{ flex: 1 }}>Save changes</button>
          </div>
          {onArchive && (
            <button type="button" className="btn quiet" onClick={() => { onArchive(task.id); onClose(); }}>Archive task</button>
          )}
        </div>
      </form>
    </div>
  );
}

const editCss = `
.ed-quads { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-2); }
.ed-pt { display: flex; flex-direction: column; align-items: flex-start; justify-content: center; gap: 2px; min-height: 56px; min-width: 0; box-sizing: border-box; padding: var(--space-2) var(--space-3); border: 1px solid var(--control); border-radius: var(--r-md); background: var(--surface); color: var(--text); font: inherit; text-align: left; cursor: pointer; }
.ed-pt b { font-size: var(--t-14); font-weight: 600; }
.ed-pt span { font-size: var(--t-12); color: var(--text-2); }
.ed-pt[aria-checked="true"] { background: var(--selected); border-color: var(--text); }
@media (hover: hover) { .ed-pt:hover { border-color: var(--text); } }
.ed-pt:focus-visible { outline: 2px solid var(--focus); outline-offset: 2px; }
.ed-sched-head { display: flex; align-items: center; justify-content: space-between; }
.ed-two { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3); }
`;
