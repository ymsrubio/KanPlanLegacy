// src/components/WipSwapModal.jsx
// Ready to start is full: pick the task to send back to Backlog. Artboards 8 (desktop) and 5 (phone sheet).
import React, { useEffect, useState } from 'react';
import { chipLabel, projectSlot } from '../lib/day-list.js';
import { useMedia } from '../lib/use-media.js';

const sheetStyle = {
  width: '100%',
  maxWidth: 'none',
  borderRadius: 'var(--r-xl) var(--r-xl) 0 0',
  borderBottom: 0,
  padding: 'var(--space-6) var(--space-4)'
};

export default function WipSwapModal({ isOpen, onClose, onSwap, readyTasks, pendingTask, projects = [] }) {
  const isPhone = useMedia('(max-width: 640px)');
  const [pickedId, setPickedId] = useState(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  useEffect(() => setPickedId(null), [isOpen, pendingTask?.id]);

  if (!isOpen || !pendingTask) return null;

  const outId = readyTasks.some((t) => t.id === pickedId) ? pickedId : readyTasks[0]?.id;
  const swap = () => outId != null && onSwap(outId);

  return (
    <div className="scrim" style={isPhone ? { alignItems: 'flex-end' } : undefined} onClick={onClose}>
      <div
        className="dlg"
        role="dialog"
        aria-modal="true"
        aria-labelledby="wip-swap-title"
        style={isPhone ? sheetStyle : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <span className="tile" style={{ background: 'var(--warn)', borderColor: 'var(--warn-strong)', color: 'var(--warn-ink)' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
              <circle cx="8" cy="8" r="5.5" />
              <path d="M8 5v3.5M8 10.8v.2" />
            </svg>
          </span>
          <h2 id="wip-swap-title">Ready to start is full</h2>
        </div>
        <p style={{ fontSize: 'var(--t-14)', lineHeight: 1.45, color: 'var(--text-2)' }}>
          Send one task back to Backlog to make room for {pendingTask.title}.
        </p>
        <div role="radiogroup" aria-label="Task to send back" style={{ display: 'flex', flexDirection: 'column' }}>
          {readyTasks.map((task) => {
            const pi = projects.findIndex((p) => Number(p.id) === Number(task.project_id));
            const chip = chipLabel(task, pi >= 0 ? projects[pi].name : null);
            return (
              <label key={task.id} className="row" style={{ cursor: 'pointer', background: task.id === outId ? 'var(--selected)' : undefined }}>
                <input
                  type="radio"
                  name="wip-swap-out"
                  checked={task.id === outId}
                  onChange={() => setPickedId(task.id)}
                  style={{ margin: 0, width: 'var(--space-5)', height: 'var(--space-5)', accentColor: 'var(--text)', flex: 'none' }}
                />
                <span className="ttl" style={{ display: 'flex', alignItems: 'center' }}>{task.title}</span>
                {chip && <span className={`chip${pi >= 0 ? ` c-${projectSlot(pi)}` : ''}`}>{chip}</span>}
              </label>
            );
          })}
        </div>
        <div
          style={isPhone
            ? { display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }
            : { display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', flexDirection: 'row' }}
        >
          {isPhone ? (
            <>
              <button type="button" className="btn primary" style={{ width: '100%' }} onClick={swap}>Swap and schedule</button>
              <button type="button" className="btn quiet" style={{ width: '100%' }} onClick={onClose}>Not now</button>
            </>
          ) : (
            <>
              <button type="button" className="btn quiet" onClick={onClose}>Not now</button>
              <button type="button" className="btn primary" onClick={swap}>Swap and schedule</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
