// src/components/ArchiveDrawer.jsx
// Not drawn in the design: built from the Components artboard (3) fields, chips and buttons plus workspace.css.
import React, { useState, useMemo, useEffect } from 'react';
import { drawerCss } from './TaskEditDrawer.jsx';
import { projectSlot } from '../lib/day-list.js';

export default function ArchiveDrawer({
  isOpen,
  onClose,
  archivedTasks = [],
  projects = [],
  onRestoreTask,
  onPermanentDelete
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState(null);

  const filteredTasks = useMemo(() => {
    return archivedTasks.filter((t) => {
      // Search filter
      const matchesSearch =
        !searchQuery.trim() ||
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()));

      // Project filter
      const matchesProject =
        selectedProjectId === null || Number(t.project_id) === Number(selectedProjectId);

      return matchesSearch && matchesProject;
    });
  }, [archivedTasks, searchQuery, selectedProjectId]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const formatDate = (isoStr) => {
    if (!isoStr) return '';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="drw-scrim" onClick={onClose}>
      <style>{drawerCss + archiveCss}</style>
      <div className="drw" role="dialog" aria-modal="true" aria-labelledby="ar-title" onClick={(e) => e.stopPropagation()}>
        <div className="drw-head">
          <h2 id="ar-title">Archive<span className="count">{archivedTasks.length}</span></h2>
          <button type="button" className="btn quiet icon" aria-label="Close" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" /></svg>
          </button>
        </div>

        <div className="drw-body">
          <input
            className="drw-field"
            type="search"
            placeholder="Search archived tasks"
            aria-label="Search archived tasks"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          {projects.length > 0 && (
            <div className="ar-pills" role="group" aria-label="Filter by project">
              <button type="button" aria-pressed={selectedProjectId === null} onClick={() => setSelectedProjectId(null)}>All</button>
              {projects.map((p, i) => {
                const on = Number(selectedProjectId) === Number(p.id);
                return (
                  <button key={p.id} type="button" aria-pressed={on} onClick={() => setSelectedProjectId(on ? null : p.id)}>
                    <span className={`dot d${projectSlot(i)}`} />{p.name}
                  </button>
                );
              })}
            </div>
          )}

          {filteredTasks.length === 0 ? (
            <div className="empty">
              <h2>{archivedTasks.length === 0 ? 'Nothing archived' : 'No matches'}</h2>
              <p>
                {archivedTasks.length === 0
                  ? 'Done tasks move here after 24 hours, or archive one from its edit drawer.'
                  : 'Try a different search or project.'}
              </p>
            </div>
          ) : (
            <ul className="ar-list">
              {filteredTasks.map((task) => {
                const pi = task.project_id ? projects.findIndex((p) => Number(p.id) === Number(task.project_id)) : -1;
                const project = pi >= 0 ? projects[pi] : null;
                return (
                  <li key={task.id} className="ar-item">
                    <div className="ar-title">{task.title}</div>
                    {task.description && <p className="ar-desc">{task.description}</p>}
                    <div className="ar-meta">
                      {project && <span className={`chip c-${projectSlot(pi)}`}>{project.name}</span>}
                      {task.archived_at && <span className="drw-help">Archived {formatDate(task.archived_at)}</span>}
                      <span className="ar-acts">
                        {onRestoreTask && <button type="button" className="btn secondary" style={{ height: 'var(--h-ctl-sm)' }} onClick={() => onRestoreTask(task.id)}>Restore</button>}
                        {onPermanentDelete && <button type="button" className="btn quiet" style={{ height: 'var(--h-ctl-sm)' }} onClick={() => onPermanentDelete(task.id)}>Delete</button>}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

const archiveCss = `
.ar-pills { display: flex; flex-wrap: wrap; gap: var(--space-2); }
.ar-pills button { display: inline-flex; align-items: center; gap: var(--space-2); height: var(--h-ctl-sm); padding: 0 var(--space-3); border-radius: var(--r-pill); border: 1px solid var(--control); background: var(--surface); font: inherit; font-size: var(--t-14); font-weight: 500; color: var(--text); cursor: pointer; }
.ar-pills button[aria-pressed="true"] { background: var(--text); border-color: var(--text); color: var(--surface); }
@media (hover: hover) { .ar-pills button:hover { background: var(--page); } .ar-pills button[aria-pressed="true"]:hover { background: var(--primary-hover); } }
.ar-pills button:active { background: var(--press); }
.ar-pills button:focus-visible { outline: 2px solid var(--focus); outline-offset: 2px; }
.ar-list { display: flex; flex-direction: column; gap: var(--space-2); }
.ar-item { display: flex; flex-direction: column; gap: var(--space-2); padding: var(--space-3) var(--space-4); border: 1px solid var(--rule); border-radius: var(--r-lg); background: var(--surface); }
.ar-title { font-size: var(--t-15); font-weight: 600; }
.ar-desc { font-size: var(--t-14); color: var(--text-2); line-height: 1.45; }
.ar-meta { display: flex; align-items: center; flex-wrap: wrap; gap: var(--space-2); }
.ar-acts { margin-left: auto; display: flex; gap: var(--space-1); }
`;
