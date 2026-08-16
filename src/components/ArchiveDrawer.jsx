// src/components/ArchiveDrawer.jsx
import React, { useState, useMemo } from 'react';

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

  if (!isOpen) return null;

  const formatDate = (isoStr) => {
    if (!isoStr) return '';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return isoStr;
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        background: 'rgba(32, 21, 21, 0.45)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        justifyContent: 'flex-end',
        transition: 'opacity 0.2s ease'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fffefb',
          width: '100%',
          maxWidth: '480px',
          height: '100%',
          borderLeft: '2px solid #201515',
          padding: '24px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-10px 0 30px rgba(32, 21, 21, 0.25)',
          color: '#201515'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.3em' }}>📦</span>
            <h2 style={{ margin: 0, fontSize: '1.25em', fontWeight: '800', color: '#201515' }}>
              Archived Tasks
            </h2>
            <span
              style={{
                fontSize: '0.8em',
                fontWeight: '700',
                background: '#f8f4f0',
                color: '#605d52',
                padding: '2px 8px',
                borderRadius: '10px',
                border: '1px solid #c5c0b1'
              }}
            >
              {archivedTasks.length}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.2em',
              color: '#605d52',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            ✕
          </button>
        </div>

        {/* Search Bar */}
        <div style={{ marginBottom: '12px' }}>
          <input
            type="text"
            placeholder="🔍 Search archived tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '10px',
              border: '1px solid #c5c0b1',
              background: '#fffefb',
              fontSize: '0.88em',
              boxSizing: 'border-box',
              outline: 'none'
            }}
          />
        </div>

        {/* Project Filter Pills */}
        {projects.length > 0 && (
          <div
            style={{
              display: 'flex',
              gap: '6px',
              overflowX: 'auto',
              paddingBottom: '8px',
              marginBottom: '12px'
            }}
          >
            <button
              onClick={() => setSelectedProjectId(null)}
              style={{
                padding: '4px 10px',
                borderRadius: '10px',
                border: selectedProjectId === null ? '1px solid #ff4f00' : '1px solid #c5c0b1',
                background: selectedProjectId === null ? '#ff4f00' : '#f8f4f0',
                color: selectedProjectId === null ? '#fffefb' : '#201515',
                fontSize: '0.75em',
                fontWeight: '700',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              All
            </button>
            {projects.map((p) => {
              const isSelected = Number(selectedProjectId) === Number(p.id);
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedProjectId(isSelected ? null : p.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 10px',
                    borderRadius: '10px',
                    border: isSelected ? `2px solid ${p.color || '#ff4f00'}` : '1px solid #c5c0b1',
                    background: isSelected ? (p.color || '#ff4f00') : '#f8f4f0',
                    color: isSelected ? '#fffefb' : '#201515',
                    fontSize: '0.75em',
                    fontWeight: '700',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isSelected ? '#fffefb' : (p.color || '#ff4f00') }} />
                  {p.name}
                </button>
              );
            })}
          </div>
        )}

        {/* Tasks List */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '2px' }}>
          {filteredTasks.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '40px 16px',
                color: '#939084',
                fontSize: '0.9em',
                background: '#f8f4f0',
                borderRadius: '12px',
                border: '1px dashed #c5c0b1',
                marginTop: '10px'
              }}
            >
              <div style={{ fontSize: '2em', marginBottom: '8px' }}>📦</div>
              <div style={{ fontWeight: '700', marginBottom: '4px' }}>No Archived Tasks</div>
              <div style={{ fontSize: '0.85em' }}>
                Completed tasks are automatically archived after 24 hours, or you can click the 📦 Archive button on any task.
              </div>
            </div>
          ) : (
            filteredTasks.map((task) => {
              const project = task.project_id ? projects.find((p) => Number(p.id) === Number(task.project_id)) : null;
              const priorityScore = task.priority_score || (task.urgency_level || 3) * (task.importance_level || 3);

              return (
                <div
                  key={task.id}
                  style={{
                    background: '#fffefb',
                    border: '1px solid #c5c0b1',
                    borderRadius: '12px',
                    padding: '14px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                    <div style={{ fontWeight: '700', fontSize: '0.95em', color: '#201515', flex: 1 }}>
                      {task.title}
                    </div>
                    <span
                      style={{
                        fontSize: '0.75em',
                        fontWeight: '700',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        background: '#f1f5f9',
                        color: '#475569',
                        border: '1px solid #cbd5e1'
                      }}
                    >
                      Priority: {priorityScore}
                    </span>
                  </div>

                  {task.description && (
                    <div style={{ fontSize: '0.82em', color: '#605d52', lineHeight: '1.4' }}>
                      {task.description}
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px', paddingTop: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      {project && (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '2px 8px',
                            borderRadius: '10px',
                            fontSize: '0.72em',
                            fontWeight: '700',
                            background: (project.color || '#ff4f00') + '18',
                            color: project.color || '#ff4f00',
                            border: `1px solid ${(project.color || '#ff4f00')}40`
                          }}
                        >
                          <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: project.color || '#ff4f00' }} />
                          {project.name}
                        </span>
                      )}
                      {task.archived_at && (
                        <span style={{ fontSize: '0.72em', color: '#939084' }}>
                          Archived: {formatDate(task.archived_at)}
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      {onRestoreTask && (
                        <button
                          onClick={() => onRestoreTask(task.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '5px 10px',
                            borderRadius: '8px',
                            border: '1px solid #ff4f00',
                            background: '#fffefb',
                            color: '#ff4f00',
                            fontSize: '0.78em',
                            fontWeight: '700',
                            cursor: 'pointer'
                          }}
                        >
                          ↩️ Restore
                        </button>
                      )}
                      {onPermanentDelete && (
                        <button
                          onClick={() => onPermanentDelete(task.id)}
                          title="Delete permanently"
                          style={{
                            padding: '5px 8px',
                            borderRadius: '8px',
                            border: '1px solid #fecaca',
                            background: '#fee2e2',
                            color: '#dc2626',
                            fontSize: '0.78em',
                            cursor: 'pointer'
                          }}
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
