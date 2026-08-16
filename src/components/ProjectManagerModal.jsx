// src/components/ProjectManagerModal.jsx
import React, { useState } from 'react';

const PRESET_COLORS = [
  '#ff4f00', // KanPlan Orange
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#8b5cf6', // Violet
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#64748b', // Slate
  '#06b6d4'  // Cyan
];

export default function ProjectManagerModal({ isOpen, onClose, projects, onAddProject, onDeleteProject }) {
  const [newProjectName, setNewProjectName] = useState('');
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newProjectName.trim()) {
      setError('Please enter a project name');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onAddProject({
        name: newProjectName.trim(),
        color: selectedColor
      });
      setNewProjectName('');
      setSelectedColor(PRESET_COLORS[0]);
    } catch (err) {
      setError(err.message || 'Failed to create project');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(32, 21, 21, 0.55)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fffefb',
          borderRadius: '16px',
          padding: '24px',
          width: '100%',
          maxWidth: '460px',
          boxShadow: '0 20px 40px rgba(32, 21, 21, 0.25)',
          border: '1px solid #c5c0b1',
          color: '#201515'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.2em' }}>📁</span>
            <h2 style={{ margin: 0, fontSize: '1.2em', fontWeight: '800' }}>Manage Projects & Categories</h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.2em',
              cursor: 'pointer',
              color: '#605d52',
              padding: '4px'
            }}
          >
            ✕
          </button>
        </div>

        {/* Existing Projects List */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ fontSize: '0.8em', fontWeight: '700', color: '#605d52', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Existing Projects ({projects.length})
          </label>
          <div
            style={{
              marginTop: '8px',
              maxHeight: '180px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              border: '1px solid #e8e4de',
              borderRadius: '10px',
              padding: '8px',
              background: '#f8f4f0'
            }}
          >
            {projects.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '12px', color: '#939084', fontSize: '0.85em' }}>
                No custom projects yet. Create your first one below!
              </div>
            ) : (
              projects.map((proj) => (
                <div
                  key={proj.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: '#fffefb',
                    border: '1px solid #c5c0b1'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span
                      style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        background: proj.color || '#ff4f00'
                      }}
                    />
                    <span style={{ fontWeight: '700', fontSize: '0.9em' }}>{proj.name}</span>
                  </div>
                  {onDeleteProject && (
                    <button
                      onClick={() => onDeleteProject(proj.id)}
                      title={`Delete ${proj.name}`}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#dc2626',
                        cursor: 'pointer',
                        fontSize: '0.85em',
                        padding: '2px 6px',
                        borderRadius: '4px'
                      }}
                    >
                      🗑️
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Add New Project Form */}
        <form onSubmit={handleSubmit}>
          <label style={{ fontSize: '0.8em', fontWeight: '700', color: '#605d52', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Create New Project
          </label>

          <div style={{ marginTop: '8px', marginBottom: '12px' }}>
            <input
              type="text"
              placeholder="e.g. Client Alpha, Marketing, Personal"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid #c5c0b1',
                fontSize: '0.9em',
                background: '#fffefb',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Color Picker */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '0.75em', fontWeight: '700', color: '#605d52', marginBottom: '8px' }}>
              Color Tag
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {PRESET_COLORS.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setSelectedColor(c)}
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: c,
                    border: selectedColor === c ? '3px solid #201515' : '1px solid rgba(0,0,0,0.1)',
                    cursor: 'pointer',
                    transform: selectedColor === c ? 'scale(1.15)' : 'scale(1)',
                    transition: 'all 0.15s ease'
                  }}
                />
              ))}
            </div>
          </div>

          {error && (
            <div style={{ color: '#dc2626', fontSize: '0.8em', marginBottom: '12px', fontWeight: '600' }}>
              ⚠️ {error}
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 18px',
                borderRadius: '10px',
                border: '1px solid #c5c0b1',
                background: '#f8f4f0',
                color: '#605d52',
                fontWeight: '700',
                fontSize: '0.85em',
                cursor: 'pointer'
              }}
            >
              Close
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !newProjectName.trim()}
              style={{
                padding: '10px 20px',
                borderRadius: '10px',
                border: 'none',
                background: '#ff4f00',
                color: '#fffefb',
                fontWeight: '700',
                fontSize: '0.85em',
                cursor: newProjectName.trim() ? 'pointer' : 'not-allowed',
                opacity: newProjectName.trim() ? 1 : 0.6,
                boxShadow: '0 2px 8px rgba(255, 79, 0, 0.3)'
              }}
            >
              {isSubmitting ? 'Creating...' : '+ Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
