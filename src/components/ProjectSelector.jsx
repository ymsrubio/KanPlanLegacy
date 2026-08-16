// src/components/ProjectSelector.jsx
import React from 'react';

export default function ProjectSelector({
  projects = [],
  selectedProjectId = null,
  onSelectProject,
  onOpenManager
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <select
          value={selectedProjectId || ''}
          onChange={(e) => {
            const val = e.target.value;
            if (val === '__manage__') {
              if (onOpenManager) onOpenManager();
            } else {
              onSelectProject(val ? Number(val) : null);
            }
          }}
          style={{
            appearance: 'none',
            WebkitAppearance: 'none',
            background: '#fffefb',
            color: '#201515',
            border: '1px solid #c5c0b1',
            borderRadius: '12px',
            padding: '6px 28px 6px 12px',
            fontSize: '0.85em',
            fontWeight: '700',
            cursor: 'pointer',
            outline: 'none',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}
        >
          <option value="">📁 All Projects ({projects.length})</option>
          {projects.map((proj) => (
            <option key={proj.id} value={proj.id}>
              ● {proj.name}
            </option>
          ))}
          <option value="__manage__">⚙️ + Manage / Add Projects...</option>
        </select>
        <span
          style={{
            position: 'absolute',
            right: '10px',
            pointerEvents: 'none',
            fontSize: '0.7em',
            color: '#605d52'
          }}
        >
          ▼
        </span>
      </div>

      {onOpenManager && (
        <button
          onClick={onOpenManager}
          title="Add / Manage Projects"
          style={{
            background: '#f8f4f0',
            border: '1px solid #c5c0b1',
            borderRadius: '10px',
            padding: '6px 10px',
            fontSize: '0.8em',
            fontWeight: '700',
            color: '#ff4f00',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          + Project
        </button>
      )}
    </div>
  );
}
