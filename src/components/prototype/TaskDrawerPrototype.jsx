// src/components/prototype/TaskDrawerPrototype.jsx
// Exploring 3 radically different UI variations for replacing Add Task Modal with a Side-Bar Drawer:
// - Variant A: Unified Slide-Over Overlay Drawer (with Backdrop)
// - Variant B: Split-Canvas Push Panel (resizes Kanban board live)
// - Variant C: Speed-Add Minimalist Narrow Drawer (compact with expandable details)

import React, { useState } from 'react';

// ==========================================
// VARIANT A: Unified Slide-Over Overlay Drawer
// ==========================================
export function VariantADrawer({ isOpen, onClose, onSave, mode = 'create', initialTask, columns = [] }) {
  const [title, setTitle] = useState(initialTask?.title || '');
  const [description, setDescription] = useState(initialTask?.description || '');
  const [columnId, setColumnId] = useState(initialTask?.column_id || (columns[0]?.id || 1));
  const [urgencyLevel, setUrgencyLevel] = useState(initialTask?.urgency_level || 3);
  const [importanceLevel, setImportanceLevel] = useState(initialTask?.importance_level || 3);
  const [deadline, setDeadline] = useState(initialTask?.deadline || '');
  const [shouldSchedule, setShouldSchedule] = useState(false);
  const [startTime, setStartTime] = useState(`${String(new Date().getHours()).padStart(2, '0')}:00`);

  if (!isOpen) return null;

  const score = urgencyLevel * importanceLevel;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      title: title.trim(),
      description,
      column_id: Number(columnId),
      urgency_level: urgencyLevel,
      importance_level: importanceLevel,
      deadline: deadline || null,
      shouldSchedule,
      startTime
    });
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
        justifyContent: 'flex-end'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fffefb',
          width: '100%',
          maxWidth: '460px',
          height: '100%',
          borderLeft: '2px solid #201515',
          padding: '28px 24px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-10px 0 30px rgba(32, 21, 21, 0.2)',
          color: '#201515'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #c5c0b1', paddingBottom: '12px' }}>
          <div>
            <span style={{ fontSize: '0.75em', fontWeight: '800', color: '#ff4f00', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              VARIANT A: SLIDE-OVER OVERLAY
            </span>
            <h2 style={{ margin: '2px 0 0 0', fontSize: '1.25em', fontWeight: '800' }}>
              {mode === 'create' ? '➕ Add New Task' : '✏️ Edit Task'}
            </h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.2em', color: '#939084', cursor: 'pointer' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85em', fontWeight: '700', marginBottom: '4px' }}>Task Title *</label>
            <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What needs to get done?" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #c5c0b1', fontWeight: '600', boxSizing: 'border-box' }} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85em', fontWeight: '700', marginBottom: '4px' }}>Target Column</label>
            <select value={columnId} onChange={(e) => setColumnId(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #c5c0b1', background: '#fffefb', fontWeight: '600', boxSizing: 'border-box' }}>
              {columns.map(c => (
                <option key={c.id} value={c.id}>{c.name} {c.wip_limit ? `(Limit: ${c.wip_limit})` : ''}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85em', fontWeight: '700', marginBottom: '4px' }}>Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Add context or subtasks..." style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #c5c0b1', boxSizing: 'border-box', fontFamily: 'inherit' }} />
          </div>

          <div style={{ background: '#f8f4f0', padding: '14px', borderRadius: '12px', border: '1px solid #c5c0b1' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85em', fontWeight: '700' }}>
              <span>Eisenhower Priority</span>
              <span style={{ color: '#ff4f00' }}>Score: {score}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <span style={{ fontSize: '0.75em' }}>Urgency ({urgencyLevel})</span>
                <input type="range" min="1" max="5" value={urgencyLevel} onChange={(e) => setUrgencyLevel(Number(e.target.value))} style={{ width: '100%', accentColor: '#ff4f00' }} />
              </div>
              <div>
                <span style={{ fontSize: '0.75em' }}>Importance ({importanceLevel})</span>
                <input type="range" min="1" max="5" value={importanceLevel} onChange={(e) => setImportanceLevel(Number(e.target.value))} style={{ width: '100%', accentColor: '#ff4f00' }} />
              </div>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85em', fontWeight: '700', marginBottom: '4px' }}>Due Date</label>
            <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #c5c0b1', boxSizing: 'border-box' }} />
          </div>

          <div style={{ background: '#fff8f5', padding: '12px', borderRadius: '10px', border: '1px solid #ff4f00' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85em', fontWeight: '700', cursor: 'pointer' }}>
              <input type="checkbox" checked={shouldSchedule} onChange={(e) => setShouldSchedule(e.target.checked)} />
              ⏱️ Schedule Calendar Time-Block Now
            </label>
            {shouldSchedule && (
              <div style={{ marginTop: '8px' }}>
                <span style={{ fontSize: '0.75em', color: '#605d52' }}>Start Time (Defaults to red bar):</span>
                <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} style={{ width: '100%', marginTop: '4px', padding: '6px', borderRadius: '6px', border: '1px solid #c5c0b1' }} />
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid #c5c0b1' }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #c5c0b1', background: 'none', cursor: 'pointer' }}>Cancel</button>
            <button type="submit" style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: '#ff4f00', color: '#fff', fontWeight: '700', cursor: 'pointer' }}>Create Task</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// VARIANT B: Split-Canvas Push Panel
// ==========================================
export function VariantBPushPanel({ isOpen, onClose, onSave, columns = [] }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [columnId, setColumnId] = useState(columns[0]?.id || 1);

  if (!isOpen) return null;

  return (
    <div style={{ width: '360px', minWidth: '360px', background: '#f8f4f0', borderLeft: '2px solid #201515', padding: '20px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, fontSize: '1.1em', fontWeight: '800' }}>📐 VARIANT B: PUSH PANEL</h3>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
      </div>
      <p style={{ fontSize: '0.8em', color: '#605d52', margin: '0 0 12px 0' }}>This panel pushes the Kanban board to the left so you can see your columns live while adding.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title..." style={{ padding: '8px', borderRadius: '6px', border: '1px solid #c5c0b1' }} />
        <select value={columnId} onChange={(e) => setColumnId(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #c5c0b1' }}>
          {columns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Details..." rows={4} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #c5c0b1' }} />
      </div>

      <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
        <button onClick={onClose} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #c5c0b1', background: 'none' }}>Close</button>
        <button onClick={() => onSave({ title, description, column_id: Number(columnId) })} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: 'none', background: '#ff4f00', color: '#fff', fontWeight: '700' }}>Add</button>
      </div>
    </div>
  );
}

// ==========================================
// VARIANT C: Speed-Add Minimalist Narrow Drawer
// ==========================================
export function VariantCCompact({ isOpen, onClose, onSave, columns = [] }) {
  const [title, setTitle] = useState('');
  const [showMore, setShowMore] = useState(false);
  const [columnId, setColumnId] = useState(columns[0]?.id || 1);

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(32, 21, 21, 0.2)', display: 'flex', justifyContent: 'flex-end' }} onClick={onClose}>
      <div style={{ background: '#fffefb', width: '300px', height: '100%', borderLeft: '3px solid #ff4f00', padding: '20px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ fontSize: '0.7em', fontWeight: '800', color: '#ff4f00', marginBottom: '8px' }}>⚡ VARIANT C: SPEED-ADD NARROW</div>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1em' }}>Quick Add Task</h3>

        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Type task title & press Enter..." autoFocus style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '2px solid #201515', fontWeight: '700', marginBottom: '12px', boxSizing: 'border-box' }} />

        <select value={columnId} onChange={(e) => setColumnId(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #c5c0b1', marginBottom: '12px' }}>
          {columns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <button type="button" onClick={() => setShowMore(!showMore)} style={{ background: 'none', border: 'none', color: '#ff4f00', fontSize: '0.8em', fontWeight: '700', cursor: 'pointer', textAlign: 'left', padding: 0, marginBottom: '12px' }}>
          {showMore ? '▲ Fewer options' : '▼ Advanced priority & due dates'}
        </button>

        {showMore && (
          <div style={{ background: '#f8f4f0', padding: '10px', borderRadius: '8px', fontSize: '0.8em', marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px' }}>Due Date:</label>
            <input type="date" style={{ width: '100%', padding: '4px', boxSizing: 'border-box' }} />
          </div>
        )}

        <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #c5c0b1', background: 'none' }}>Cancel</button>
          <button onClick={() => onSave({ title, column_id: Number(columnId) })} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: 'none', background: '#201515', color: '#fff', fontWeight: '700' }}>Save</button>
        </div>
      </div>
    </div>
  );
}
