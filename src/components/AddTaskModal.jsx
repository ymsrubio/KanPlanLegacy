import React, { useState, useEffect } from 'react';

export default function AddTaskModal({ isOpen, onClose, onSubmit, columns = [], projects = [], defaultProjectId = null }) {
  const defaultColId = columns?.[0]?.id;
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [columnId, setColumnId] = useState(defaultColId);
  const [projectId, setProjectId] = useState(defaultProjectId ? String(defaultProjectId) : '');
  const [urgencyLevel, setUrgencyLevel] = useState(3);
  const [importanceLevel, setImportanceLevel] = useState(3);

  useEffect(() => {
    if (columns && columns.length > 0) {
      setColumnId((prev) => (prev && columns.some(c => c.id === prev) ? prev : columns[0].id));
    }
    if (isOpen) {
      setProjectId(defaultProjectId ? String(defaultProjectId) : '');
    }
  }, [columns, isOpen, defaultProjectId]);

  if (!isOpen) return null;

  const priorityScore = urgencyLevel * importanceLevel;

  const handleSubmit = (e) => {
    e.preventDefault();
    const targetColId = Number(columnId) || columns?.[0]?.id;
    onSubmit({
      title,
      description,
      deadline,
      column_id: targetColId,
      project_id: projectId ? Number(projectId) : null,
      is_urgent: urgencyLevel >= 4 ? 1 : 0,
      is_important: importanceLevel >= 4 ? 1 : 0,
      urgency_level: urgencyLevel,
      importance_level: importanceLevel,
      priority_score: priorityScore
    });

    setTitle('');
    setDescription('');
    setDeadline('');
    setColumnId(columns?.[0]?.id);
    setProjectId('');
    setUrgencyLevel(3);
    setImportanceLevel(3);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        background: 'rgba(32, 21, 21, 0.4)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fffefb',
          border: '1px solid #c5c0b1',
          borderRadius: '16px',
          padding: '28px',
          width: '100%',
          maxWidth: '480px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)',
          color: '#201515'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '1.3em', fontWeight: '700', color: '#201515' }}>
            ✨ Create New Task
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.2em',
              color: '#939084',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85em', fontWeight: '600', marginBottom: '6px', color: '#36342e' }}>
              Task Title *
            </label>
            <input
              type="text"
              placeholder="e.g. Design Landing Page"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #c5c0b1',
                outline: 'none',
                fontSize: '0.95em',
                background: '#fffefb',
                color: '#201515',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85em', fontWeight: '600', marginBottom: '6px', color: '#36342e' }}>
              Description (Optional)
            </label>
            <textarea
              placeholder="Add details or notes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #c5c0b1',
                outline: 'none',
                fontSize: '0.95em',
                background: '#fffefb',
                color: '#201515',
                boxSizing: 'border-box',
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85em', fontWeight: '600', marginBottom: '6px', color: '#36342e' }}>
              Due Date (Optional)
            </label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #c5c0b1',
                outline: 'none',
                fontSize: '0.95em',
                background: '#fffefb',
                color: '#201515',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85em', fontWeight: '600', marginBottom: '6px', color: '#36342e' }}>
              Destination Column
            </label>
            <select
              value={columnId}
              onChange={(e) => setColumnId(Number(e.target.value))}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #c5c0b1',
                background: '#fffefb',
                color: '#201515',
                fontSize: '0.95em',
                boxSizing: 'border-box'
              }}
            >
              {columns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.wip_limit ? `(Max WIP: ${c.wip_limit})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85em', fontWeight: '600', marginBottom: '6px', color: '#36342e' }}>
              📁 Project / Category (Optional)
            </label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #c5c0b1',
                background: '#fffefb',
                color: '#201515',
                fontSize: '0.95em',
                boxSizing: 'border-box'
              }}
            >
              <option value="">No Project (General)</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  ● {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* 1-5 Scale Eisenhower Matrix Ratings */}
          <div style={{ background: '#f8f4f0', padding: '14px', borderRadius: '12px', border: '1px solid #c5c0b1' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.85em', fontWeight: '700', color: '#201515' }}>
                Eisenhower Priority Matrix (1–5 Scale)
              </span>
              <span style={{ fontSize: '0.8em', fontWeight: '700', color: '#ff4f00', background: '#fffefb', padding: '2px 8px', borderRadius: '6px', border: '1px solid #c5c0b1' }}>
                Score: {priorityScore}/25
              </span>
            </div>

            {/* Urgency Rating */}
            <div style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8em', marginBottom: '4px', fontWeight: '600', color: '#36342e' }}>
                <span>🔥 Urgency Level</span>
                <span>{urgencyLevel}/5</span>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                {[1, 2, 3, 4, 5].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setUrgencyLevel(level)}
                    style={{
                      flex: 1,
                      padding: '6px 0',
                      borderRadius: '6px',
                      border: '1px solid #c5c0b1',
                      background: urgencyLevel === level ? '#ff4f00' : '#fffefb',
                      color: urgencyLevel === level ? '#fffefb' : '#201515',
                      fontWeight: '700',
                      fontSize: '0.85em',
                      cursor: 'pointer',
                      transition: 'background 0.2s'
                    }}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Importance Rating */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8em', marginBottom: '4px', fontWeight: '600', color: '#36342e' }}>
                <span>⚡ Importance Level</span>
                <span>{importanceLevel}/5</span>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                {[1, 2, 3, 4, 5].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setImportanceLevel(level)}
                    style={{
                      flex: 1,
                      padding: '6px 0',
                      borderRadius: '6px',
                      border: '1px solid #c5c0b1',
                      background: importanceLevel === level ? '#201515' : '#fffefb',
                      color: importanceLevel === level ? '#fffefb' : '#201515',
                      fontWeight: '700',
                      fontSize: '0.85em',
                      cursor: 'pointer',
                      transition: 'background 0.2s'
                    }}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'none',
                border: '1px solid #c5c0b1',
                color: '#36342e',
                padding: '10px 18px',
                borderRadius: '10px',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '0.9em'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                background: '#ff4f00',
                color: '#fffefb',
                border: 'none',
                padding: '10px 22px',
                borderRadius: '10px',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '0.9em',
                boxShadow: '0 2px 4px rgba(255, 79, 0, 0.2)'
              }}
            >
              + Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
