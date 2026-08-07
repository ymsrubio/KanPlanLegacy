// src/components/AddTaskModal.jsx
import React, { useState } from 'react';

export default function AddTaskModal({ isOpen, onClose, onSubmit, columns }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [columnId, setColumnId] = useState(1);
  const [isUrgent, setIsUrgent] = useState(0);
  const [isImportant, setIsImportant] = useState(1);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      title,
      description,
      column_id: Number(columnId),
      is_urgent: isUrgent,
      is_important: isImportant
    });

    // Reset form fields
    setTitle('');
    setDescription('');
    setColumnId(1);
    setIsUrgent(0);
    setIsImportant(1);
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
          maxWidth: '460px',
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
              rows={3}
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
            <label style={{ display: 'block', fontSize: '0.85em', fontWeight: '600', marginBottom: '8px', color: '#36342e' }}>
              Eisenhower Priority Flags
            </label>
            <div style={{ display: 'flex', gap: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.9em' }}>
                <input
                  type="checkbox"
                  checked={isUrgent === 1}
                  onChange={(e) => setIsUrgent(e.target.checked ? 1 : 0)}
                />
                🔥 Urgent
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.9em' }}>
                <input
                  type="checkbox"
                  checked={isImportant === 1}
                  onChange={(e) => setIsImportant(e.target.checked ? 1 : 0)}
                />
                ⚡ Important
              </label>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
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
