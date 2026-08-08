// src/components/prototype/TaskEditPrototype.jsx
// Prototype exploring 3 radically different UI designs for Editing a Task:
// - Variant A: Centered Floating Modal with Live Card Preview
// - Variant B: Right-Side Slide-Over Drawer with Section Accordions
// - Variant C: Inline Card Quick-Edit (in-place replacement)

import React, { useState } from 'react';

// ==========================================
// VARIANT A: Centered Floating Modal + Preview
// ==========================================
export function VariantAModal({ isOpen, onClose, onSave, task }) {
  const [activeTab, setActiveTab] = useState('details');
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [urgencyLevel, setUrgencyLevel] = useState(task?.urgency_level || 3);
  const [importanceLevel, setImportanceLevel] = useState(task?.importance_level || 3);
  const [deadline, setDeadline] = useState(task?.deadline || '');

  if (!isOpen || !task) return null;

  const score = urgencyLevel * importanceLevel;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(32, 21, 21, 0.4)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: '#fffefb', border: '1px solid #c5c0b1', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '640px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15)', color: '#201515' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ margin: 0, fontSize: '1.25em', fontWeight: '800' }}>✏️ Variant A: Centered Modal + Live Card Preview</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.2em', cursor: 'pointer', color: '#939084' }}>✕</button>
        </div>

        {/* Tab Header */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #c5c0b1', marginBottom: '20px' }}>
          <button onClick={() => setActiveTab('details')} style={{ padding: '8px 16px', border: 'none', background: 'none', fontWeight: '700', borderBottom: activeTab === 'details' ? '3px solid #ff4f00' : 'none', color: activeTab === 'details' ? '#ff4f00' : '#605d52', cursor: 'pointer' }}>
            📝 Task Details
          </button>
          <button onClick={() => setActiveTab('priority')} style={{ padding: '8px 16px', border: 'none', background: 'none', fontWeight: '700', borderBottom: activeTab === 'priority' ? '3px solid #ff4f00' : 'none', color: activeTab === 'priority' ? '#ff4f00' : '#605d52', cursor: 'pointer' }}>
            🔥 Priority & Deadline
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px', gap: '20px' }}>
          {/* Left Form */}
          <div>
            {activeTab === 'details' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8em', fontWeight: '700', marginBottom: '4px' }}>Task Title</label>
                  <input value={title} onChange={(e) => setTitle(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #c5c0b1', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8em', fontWeight: '700', marginBottom: '4px' }}>Description</label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #c5c0b1', boxSizing: 'border-box' }} />
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8em', fontWeight: '700', marginBottom: '4px' }}>Urgency Level ({urgencyLevel}/5)</label>
                  <input type="range" min="1" max="5" value={urgencyLevel} onChange={(e) => setUrgencyLevel(Number(e.target.value))} style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8em', fontWeight: '700', marginBottom: '4px' }}>Importance Level ({importanceLevel}/5)</label>
                  <input type="range" min="1" max="5" value={importanceLevel} onChange={(e) => setImportanceLevel(Number(e.target.value))} style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8em', fontWeight: '700', marginBottom: '4px' }}>Due Date</label>
                  <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #c5c0b1', boxSizing: 'border-box' }} />
                </div>
              </div>
            )}
          </div>

          {/* Right Live Preview */}
          <div style={{ background: '#f8f4f0', border: '1px solid #c5c0b1', borderRadius: '12px', padding: '12px' }}>
            <div style={{ fontSize: '0.75em', fontWeight: '800', color: '#605d52', marginBottom: '8px', textTransform: 'uppercase' }}>Live Card Preview</div>
            <div style={{ background: '#fff', borderLeft: score >= 20 ? '4px solid #e11d48' : score >= 15 ? '4px solid #f97316' : score >= 10 ? '4px solid #eab308' : '4px solid #94a3b8', borderRadius: '8px', padding: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
              <div style={{ fontWeight: '700', fontSize: '0.9em', marginBottom: '4px' }}>{title || 'Task Title'}</div>
              <div style={{ fontSize: '0.75em', color: '#605d52', marginBottom: '6px' }}>{description || 'No description'}</div>
              <div style={{ fontSize: '0.7em', fontWeight: '800', color: '#ff4f00' }}>Priority Score: {score}</div>
              {deadline && <div style={{ fontSize: '0.7em', color: '#475569' }}>📅 Due: {deadline}</div>}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #c5c0b1', background: 'none', cursor: 'pointer' }}>Cancel</button>
          <button onClick={() => onSave({ ...task, title, description, urgency_level: urgencyLevel, importance_level: importanceLevel, deadline })} style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: '#ff4f00', color: '#fff', fontWeight: '700', cursor: 'pointer' }}>Save Changes</button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// VARIANT B: Right-Side Slide-Over Drawer
// ==========================================
export function VariantBDrawer({ isOpen, onClose, onSave, task }) {
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [urgencyLevel, setUrgencyLevel] = useState(task?.urgency_level || 3);
  const [importanceLevel, setImportanceLevel] = useState(task?.importance_level || 3);
  const [deadline, setDeadline] = useState(task?.deadline || '');

  if (!isOpen || !task) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(32, 21, 21, 0.3)', display: 'flex', justifyContent: 'flex-end' }} onClick={onClose}>
      <div style={{ background: '#fffefb', width: '420px', height: '100%', borderLeft: '2px solid #201515', padding: '24px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', boxShadow: '-10px 0 30px rgba(0,0,0,0.15)' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #c5c0b1', paddingBottom: '12px' }}>
          <h2 style={{ margin: 0, fontSize: '1.2em', fontWeight: '800' }}>📐 Variant B: Right Slide-Over Drawer</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.2em', cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ background: '#f8f4f0', padding: '12px', borderRadius: '10px', border: '1px solid #c5c0b1' }}>
            <label style={{ display: 'block', fontSize: '0.8em', fontWeight: '800', marginBottom: '4px' }}>TITLE</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #c5c0b1', fontSize: '1em', fontWeight: '700' }} />
          </div>

          <div style={{ background: '#f8f4f0', padding: '12px', borderRadius: '10px', border: '1px solid #c5c0b1' }}>
            <label style={{ display: 'block', fontSize: '0.8em', fontWeight: '800', marginBottom: '4px' }}>DESCRIPTION</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #c5c0b1' }} />
          </div>

          <div style={{ background: '#f8f4f0', padding: '12px', borderRadius: '10px', border: '1px solid #c5c0b1' }}>
            <label style={{ display: 'block', fontSize: '0.8em', fontWeight: '800', marginBottom: '6px' }}>EISENHOWER PRIORITY (1-5)</label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '0.75em' }}>Urgency: {urgencyLevel}</span>
                <input type="range" min="1" max="5" value={urgencyLevel} onChange={(e) => setUrgencyLevel(Number(e.target.value))} style={{ width: '100%' }} />
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '0.75em' }}>Importance: {importanceLevel}</span>
                <input type="range" min="1" max="5" value={importanceLevel} onChange={(e) => setImportanceLevel(Number(e.target.value))} style={{ width: '100%' }} />
              </div>
            </div>
          </div>

          <div style={{ background: '#f8f4f0', padding: '12px', borderRadius: '10px', border: '1px solid #c5c0b1' }}>
            <label style={{ display: 'block', fontSize: '0.8em', fontWeight: '800', marginBottom: '4px' }}>DUE DATE</label>
            <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #c5c0b1' }} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', paddingTop: '16px', borderTop: '1px solid #c5c0b1' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #c5c0b1', background: 'none', cursor: 'pointer' }}>Cancel</button>
          <button onClick={() => onSave({ ...task, title, description, urgency_level: urgencyLevel, importance_level: importanceLevel, deadline })} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: '#201515', color: '#fff', fontWeight: '700', cursor: 'pointer' }}>Save Task</button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// VARIANT C: Inline In-Place Card Expansion
// ==========================================
export function VariantCInline({ task, onSave, onCancel }) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [urgencyLevel, setUrgencyLevel] = useState(task.urgency_level || 3);
  const [importanceLevel, setImportanceLevel] = useState(task.importance_level || 3);

  return (
    <div style={{ background: '#fff8f5', border: '2px solid #ff4f00', borderRadius: '10px', padding: '12px', marginBottom: '10px', boxShadow: '0 4px 12px rgba(255,79,0,0.15)' }}>
      <div style={{ fontSize: '0.7em', fontWeight: '800', color: '#ff4f00', marginBottom: '4px' }}>⚡ VARIANT C: INLINE QUICK-EDIT</div>
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #c5c0b1', fontWeight: '700', marginBottom: '6px', boxSizing: 'border-box' }} />
      <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" rows={2} style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #c5c0b1', fontSize: '0.85em', marginBottom: '6px', boxSizing: 'border-box' }} />
      
      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
        <select value={urgencyLevel} onChange={(e) => setUrgencyLevel(Number(e.target.value))} style={{ flex: 1, padding: '4px', fontSize: '0.75em' }}>
          <option value="1">Urg: 1 Low</option>
          <option value="3">Urg: 3 Med</option>
          <option value="5">Urg: 5 High</option>
        </select>
        <select value={importanceLevel} onChange={(e) => setImportanceLevel(Number(e.target.value))} style={{ flex: 1, padding: '4px', fontSize: '0.75em' }}>
          <option value="1">Imp: 1 Low</option>
          <option value="3">Imp: 3 Med</option>
          <option value="5">Imp: 5 High</option>
        </select>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
        <button onClick={onCancel} style={{ fontSize: '0.75em', padding: '4px 10px', background: 'none', border: '1px solid #c5c0b1', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
        <button onClick={() => onSave({ ...task, title, description, urgency_level: urgencyLevel, importance_level: importanceLevel })} style={{ fontSize: '0.75em', padding: '4px 12px', background: '#ff4f00', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: '700', cursor: 'pointer' }}>Save</button>
      </div>
    </div>
  );
}
