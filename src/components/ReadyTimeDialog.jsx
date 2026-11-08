// src/components/ReadyTimeDialog.jsx
// Tasks are added without a time; moving one into Ready to start asks when (issue 99).
// Defaults to the next free slot today. "Move without a time" never blocks the move.
import React, { useEffect, useState } from 'react';
import WhenFields, { AlertIcon } from './WhenFields.jsx';
import { resolveStart } from '../lib/add-task.js';
import { blocksOf, formatRange, formatTime, overlapSuggestion, toIso } from '../lib/schedule.js';
import { timePatch } from '../lib/ready-time.js';
import { useMedia } from '../lib/use-media.js';

const FRESH = { day: 'today', date: null, startText: null, minutes: 60, more: false };
const sheetStyle = {
  width: '100%',
  maxWidth: 'none',
  borderRadius: 'var(--r-xl) var(--r-xl) 0 0',
  borderBottom: 0,
  padding: 'var(--space-6) var(--space-4)'
};

export default function ReadyTimeDialog({ task, tasks, columns, onMove, onClose }) {
  const isPhone = useMedia('(max-width: 640px)');
  const [w, setW] = useState(FRESH);
  const set = (patch) => setW((prev) => ({ ...prev, ...patch }));

  useEffect(() => setW(FRESH), [task?.id]);
  useEffect(() => {
    if (!task) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [task, onClose]);

  if (!task) return null;

  const start = resolveStart(w, { tasks, columns });
  const patch = timePatch(start, w.minutes);
  const dayName = start.toDateString() === new Date().toDateString()
    ? 'Today'
    : start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const clash = overlapSuggestion(blocksOf(tasks, columns), task.id, patch.schedule_start, patch.schedule_end);
  const clashTitle = clash && tasks.find((t) => Number(t.id) === Number(clash.with.id))?.title;
  const useFree = () => {
    const free = new Date(clash.start);
    set({ startText: formatTime(free), ...(free.toDateString() !== start.toDateString() && { date: clash.start.slice(0, 10) }) });
  };
  const schedule = () => onMove(patch);

  const buttons = [
    <button key="skip" type="button" className="btn quiet" onClick={() => onMove({})}>Move without a time</button>,
    <button key="go" type="button" className="btn primary" onClick={schedule}>Schedule and move</button>
  ];

  return (
    <div className="scrim" style={isPhone ? { alignItems: 'flex-end' } : undefined} onClick={onClose}>
      <div
        className="dlg"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ready-time-title"
        style={isPhone ? sheetStyle : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="ready-time-title">When will you start?</h2>
        <p style={{ fontSize: 'var(--t-14)', lineHeight: 1.45, color: 'var(--text-2)', margin: 0 }}>
          {task.title} moves to Ready to start. Give it a time block.
        </p>
        <div className="at-when" style={{ padding: 0 }}>
          <WhenFields value={w} start={start} onChange={set} onEnter={schedule} />
        </div>
        <p role="status" style={{ fontSize: 'var(--t-14)', margin: 0 }}>
          {dayName} · <b>{formatRange(patch.schedule_start, patch.schedule_end)}</b>
        </p>
        {clash && (
          <div className="at-banner" role="status">
            <span className="tile"><AlertIcon /></span>
            <p>Overlaps {clashTitle ?? 'another task'} ({formatRange(toIso(clash.with.start), toIso(clash.with.end))}).</p>
            <button type="button" className="btn secondary" onClick={useFree}>{clash.label}</button>
          </div>
        )}
        <div
          style={isPhone
            ? { display: 'flex', flexDirection: 'column-reverse', gap: 'var(--space-2)' }
            : { display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}
        >
          {isPhone ? buttons.map((b) => React.cloneElement(b, { style: { width: '100%' } })) : buttons}
        </div>
      </div>
    </div>
  );
}
