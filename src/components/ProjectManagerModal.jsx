// src/components/ProjectManagerModal.jsx
// Projects dialog from the More menu. Artboards 10 (create row), 16 (name taken) and 13 (colors come from the project's position).
import React, { useEffect, useRef, useState } from 'react';
import Icon from './Icon.jsx';
import { projectColor, projectSlot } from '../lib/day-list.js';
import { nameTaken } from '../lib/add-task.js';

const inputStyle = {
  flex: 1,
  minWidth: 0,
  height: 'var(--h-ctl)',
  boxSizing: 'border-box',
  padding: '0 var(--space-3)',
  border: '1px solid var(--control)',
  borderRadius: 'var(--r-md)',
  background: 'var(--surface)',
  font: 'inherit',
  fontSize: 'var(--t-15)',
  color: 'var(--text)',
  outlineColor: 'var(--focus)'
};
const noteStyle = { fontSize: 'var(--t-12)', lineHeight: 1.4, color: 'var(--text-2)', padding: '0 var(--space-3)' };
const errorStyle = { ...noteStyle, display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--error)', fontWeight: 500 };

export default function ProjectManagerModal({ isOpen, onClose, projects, onAddProject, onDeleteProject }) {
  const [name, setName] = useState('');
  const [serverError, setServerError] = useState('');
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    setName('');
    setServerError('');
    inputRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const trimmed = name.trim();
  const error = trimmed && nameTaken(projects, trimmed) ? `${trimmed} already exists. Pick another name.` : serverError;
  const canCreate = Boolean(trimmed) && !error && !busy;

  const create = async (e) => {
    e.preventDefault();
    if (!canCreate) return;
    setBusy(true);
    try {
      await onAddProject({ name: trimmed, color: projectColor(projects.length) });
      setName('');
    } catch (err) {
      setServerError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="scrim" onClick={onClose}>
      <div className="dlg" role="dialog" aria-modal="true" aria-labelledby="projects-title" style={{ width: 440 }} onClick={(e) => e.stopPropagation()}>
        <h2 id="projects-title">Projects</h2>
        {projects.length > 0 && (
          <>
            <ul aria-label="Projects" style={{ maxHeight: 'calc(var(--h-row) * 6)', overflowY: 'auto' }}>
              {projects.map((p, i) => (
                <li key={p.id} className="row" style={{ paddingRight: 0 }}>
                  <span className={`dot d${projectSlot(i)}`} />
                  <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                  <button type="button" className="btn quiet icon" aria-label={`Delete ${p.name}`} onClick={() => onDeleteProject(p.id)}>
                    <Icon name="close" />
                  </button>
                </li>
              ))}
            </ul>
            <hr style={{ border: 0, borderTop: '1px solid var(--rule)', margin: 0 }} />
          </>
        )}
        <form onSubmit={create} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', paddingLeft: 'var(--space-3)' }}>
            <span className={`dot d${projectSlot(projects.length)}`} />
            <input
              ref={inputRef}
              style={error ? { ...inputStyle, borderColor: 'var(--error)', outlineColor: 'var(--error)' } : inputStyle}
              placeholder="New project"
              aria-label="New project name"
              aria-invalid={Boolean(error)}
              aria-describedby="projects-hint"
              autoComplete="off"
              value={name}
              onChange={(e) => { setName(e.target.value); setServerError(''); }}
            />
            <button type="submit" className="btn primary" disabled={!canCreate}>Create</button>
          </div>
          {error ? (
            <p id="projects-hint" role="alert" style={errorStyle}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
                <circle cx="8" cy="8" r="5.5" />
                <path d="M8 5v3.5M8 10.8v.2" />
              </svg>
              {error}
            </p>
          ) : (
            <p id="projects-hint" style={noteStyle}>Gets the next free color. After 5 they repeat, and the name always shows.</p>
          )}
        </form>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="button" className="btn secondary" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}
