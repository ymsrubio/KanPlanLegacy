// src/components/prototype/TaskDrawerPrototype.jsx
// Exploring 3 new variations based on Variant A (Card extending without background blur/dim overlay):
// - Variant A1: Un-Blurred Floating Right Card Panel (No backdrop blur, clean floating card)
// - Variant A2: Column Card Extension (Expands directly from the column div header)
// - Variant A3: Floating Top-Right Inspector Card (Elevated floating inspector card offset from screen)

import React, { useState } from 'react';

// ==========================================
// VARIANT A1: Un-Blurred Floating Right Card Panel
// ==========================================
export function VariantA1Unblurred({ isOpen, onClose, onSave, columns = [] }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [columnId, setColumnId] = useState(columns[0]?.id || 1);
  const [urgencyLevel, setUrgencyLevel] = useState(3);
  const [importanceLevel, setImportanceLevel] = useState(3);
  const [deadline, setDeadline] = useState('');
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
        top: '16px',
        right: '16px',
        bottom: '80px',
        width: '420px',
        zIndex: 10000,
        background: '#fffefb',
        border: '2px solid #201515',
        borderRadius: '20px',
        padding: '24px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 40px rgba(32, 21, 21, 0.25)',
        color: '#201515',
        animation: 'slideInRight 0.25s ease-out'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #c5c0b1', paddingBottom: '12px' }}>
        <div>
          <span style={{ fontSize: '0.7em', fontWeight: '800', color: '#ff4f00', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            VARIANT A1: UN-BLURRED FLOATING CARD
          </span>
          <h2 style={{ margin: '2px 0 0 0', fontSize: '1.2em', fontWeight: '800' }}>➕ Add New Task</h2>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.2em', color: '#939084', cursor: 'pointer' }}>✕</button>
      </div>

      <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.8em', fontWeight: '700', marginBottom: '4px' }}>Task Title *</label>
          <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title..." style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #c5c0b1', fontWeight: '600', boxSizing: 'border-box' }} />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8em', fontWeight: '700', marginBottom: '4px' }}>Target Column</label>
          <select value={columnId} onChange={(e) => setColumnId(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #c5c0b1', background: '#fffefb', fontWeight: '600', boxSizing: 'border-box' }}>
            {columns.map(c => (
              <option key={c.id} value={c.id}>{c.name} {c.wip_limit ? `(Limit: ${c.wip_limit})` : ''}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8em', fontWeight: '700', marginBottom: '4px' }}>Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Add context..." style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #c5c0b1', boxSizing: 'border-box', fontFamily: 'inherit' }} />
        </div>

        <div style={{ background: '#f8f4f0', padding: '12px', borderRadius: '10px', border: '1px solid #c5c0b1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.8em', fontWeight: '700' }}>
            <span>Priority Matrix</span>
            <span style={{ color: '#ff4f00' }}>Score: {score}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <span style={{ fontSize: '0.7em' }}>Urgency ({urgencyLevel})</span>
              <input type="range" min="1" max="5" value={urgencyLevel} onChange={(e) => setUrgencyLevel(Number(e.target.value))} style={{ width: '100%', accentColor: '#ff4f00' }} />
            </div>
            <div>
              <span style={{ fontSize: '0.7em' }}>Importance ({importanceLevel})</span>
              <input type="range" min="1" max="5" value={importanceLevel} onChange={(e) => setImportanceLevel(Number(e.target.value))} style={{ width: '100%', accentColor: '#ff4f00' }} />
            </div>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8em', fontWeight: '700', marginBottom: '4px' }}>Due Date</label>
          <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #c5c0b1', boxSizing: 'border-box' }} />
        </div>

        <div style={{ background: '#fff8f5', padding: '10px', borderRadius: '8px', border: '1px solid #ff4f00' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8em', fontWeight: '700', cursor: 'pointer' }}>
            <input type="checkbox" checked={shouldSchedule} onChange={(e) => setShouldSchedule(e.target.checked)} />
            ⏱️ Schedule Calendar Time Block
          </label>
          {shouldSchedule && (
            <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} style={{ width: '100%', marginTop: '6px', padding: '6px', borderRadius: '6px', border: '1px solid #c5c0b1' }} />
          )}
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid #c5c0b1' }}>
          <button type="button" onClick={onClose} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #c5c0b1', background: 'none', cursor: 'pointer' }}>Cancel</button>
          <button type="submit" style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: '#ff4f00', color: '#fff', fontWeight: '700', cursor: 'pointer' }}>Create Task</button>
        </div>
      </form>
    </div>
  );
}

// ==========================================
// VARIANT A2: Column Extension Card (Expands from Column Header)
// ==========================================
export function VariantA2ColumnExtension({ isOpen, onClose, onSave, columns = [] }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [columnId, setColumnId] = useState(columns[0]?.id || 1);

  if (!isOpen) return null;

  return (
    <div style={{ background: '#fff8f5', border: '2px solid #ff4f00', borderRadius: '14px', padding: '16px', marginBottom: '16px', boxShadow: '0 8px 20px rgba(255, 79, 0, 0.15)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <span style={{ fontSize: '0.75em', fontWeight: '800', color: '#ff4f00', textTransform: 'uppercase' }}>VARIANT A2: EXTEND CARD FROM COLUMN</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title..." style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #c5c0b1', fontWeight: '700' }} />
        <select value={columnId} onChange={(e) => setColumnId(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #c5c0b1', background: '#fff' }}>
          {columns.map(c => <option key={c.id} value={c.id}>Column: {c.name}</option>)}
        </select>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description..." rows={2} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #c5c0b1' }} />
      </div>

      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
        <button onClick={onClose} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #c5c0b1', background: 'none' }}>Cancel</button>
        <button onClick={() => onSave({ title, description, column_id: Number(columnId) })} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: 'none', background: '#ff4f00', color: '#fff', fontWeight: '700' }}>Save to Column</button>
      </div>
    </div>
  );
}

// ==========================================
// VARIANT A3: Elevated Inspector Pill Card
// ==========================================
export function VariantA3ElevatedPill({ isOpen, onClose, onSave, columns = [] }) {
  const [title, setTitle] = useState('');
  const [columnId, setColumnId] = useState(columns[0]?.id || 1);

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', top: '20px', right: '20px', width: '380px', zIndex: 10000, background: '#201515', color: '#fffefb', borderRadius: '16px', padding: '16px 20px', boxShadow: '0 12px 30px rgba(0,0,0,0.35)', border: '1px solid #443535' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <span style={{ fontSize: '0.7em', fontWeight: '800', color: '#ff4f00' }}>VARIANT A3: ELEVATED INSPECTOR PILL</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fffefb', cursor: 'pointer' }}>✕</button>
      </div>

      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="New Task Title..." style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: 'none', background: 'rgba(255,255,255,0.1)', color: '#fff', fontWeight: '700', marginBottom: '10px', boxSizing: 'border-box' }} />

      <select value={columnId} onChange={(e) => setColumnId(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: 'none', background: 'rgba(255,255,255,0.15)', color: '#fff', marginBottom: '12px', boxSizing: 'border-box' }}>
        {columns.map(c => <option key={c.id} value={c.id} style={{ color: '#000' }}>{c.name}</option>)}
      </select>

      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={onClose} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)', background: 'none', color: '#fff' }}>Cancel</button>
        <button onClick={() => onSave({ title, column_id: Number(columnId) })} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: 'none', background: '#ff4f00', color: '#fff', fontWeight: '700' }}>Create</button>
      </div>
    </div>
  );
}
