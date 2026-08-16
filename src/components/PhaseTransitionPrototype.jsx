// src/components/PhaseTransitionPrototype.jsx
// Interactive UI Prototype for Issue #53: One-Click Phase Transition Buttons

import React, { useState } from 'react';

const INITIAL_COLUMNS = [
  { id: 1, name: 'Backlog', wip_limit: null, color: '#64748b' },
  { id: 2, name: 'Ready to Start', wip_limit: 2, color: '#f59e0b' },
  { id: 3, name: 'In Progress', wip_limit: 2, color: '#3b82f6' },
  { id: 4, name: 'Done', wip_limit: null, color: '#10b981' }
];

const INITIAL_TASKS = [
  { id: 1, title: 'Design Landing Page Hero', column_id: 1, priority: '🔥 Critical', score: 20 },
  { id: 2, title: 'Build Stripe Webhook Handler', column_id: 1, priority: '🔶 High', score: 16 },
  { id: 3, title: 'Setup Google OAuth 2.0', column_id: 2, priority: '🔶 High', score: 15 },
  { id: 4, title: 'Fix CSS Grid Collisions', column_id: 3, priority: '⚡ Medium', score: 12 },
  { id: 5, title: 'Refactor Column Service', column_id: 4, priority: '📥 Low', score: 6 }
];

export default function PhaseTransitionPrototype({ onClose }) {
  const [variant, setVariant] = useState(1); // 1: Corner Arrow Chips | 2: Bottom Ribbon | 3: Mini Stepper Bar
  const [columns] = useState(INITIAL_COLUMNS);
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [wipAlert, setWipAlert] = useState(null);
  const [hoveredCardId, setHoveredCardId] = useState(null);

  const moveTask = (taskId, direction) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const currentIdx = columns.findIndex(c => c.id === task.column_id);
    const targetIdx = currentIdx + direction;

    if (targetIdx < 0 || targetIdx >= columns.length) return;

    const targetColumn = columns[targetIdx];

    // Check WIP limit
    if (direction > 0 && targetColumn.wip_limit) {
      const targetCount = tasks.filter(t => t.column_id === targetColumn.id).length;
      if (targetCount >= targetColumn.wip_limit) {
        setWipAlert(`⚠️ WIP Limit reached for "${targetColumn.name}" (Max: ${targetColumn.wip_limit}). Cannot advance task.`);
        setTimeout(() => setWipAlert(null), 3000);
        return;
      }
    }

    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, column_id: targetColumn.id } : t));
    setWipAlert(`✅ Moved "${task.title}" to ${targetColumn.name}!`);
    setTimeout(() => setWipAlert(null), 2500);
  };

  const jumpToColumn = (taskId, targetColId) => {
    const task = tasks.find(t => t.id === taskId);
    const targetCol = columns.find(c => c.id === targetColId);
    if (!task || !targetCol) return;

    if (targetCol.wip_limit) {
      const targetCount = tasks.filter(t => t.column_id === targetCol.id).length;
      if (targetCount >= targetCol.wip_limit && task.column_id !== targetCol.id) {
        setWipAlert(`⚠️ WIP Limit reached for "${targetCol.name}" (Max: ${targetCol.wip_limit}).`);
        setTimeout(() => setWipAlert(null), 3000);
        return;
      }
    }

    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, column_id: targetCol.id } : t));
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 20000,
        background: '#fffefb',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'Inter, system-ui, sans-serif',
        color: '#201515'
      }}
    >
      {/* Top Banner */}
      <div
        style={{
          background: '#201515',
          color: '#fffefb',
          padding: '14px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '2px solid #ff4f00'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ background: '#ff4f00', color: '#fffefb', fontSize: '0.75em', fontWeight: '800', padding: '4px 8px', borderRadius: '6px' }}>
            PROTOTYPE #53
          </span>
          <span style={{ fontWeight: '700', fontSize: '1.05em' }}>
            One-Click Phase Transition ("Move to Next Phase") Exploration
          </span>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'rgba(255,255,255,0.15)',
            color: '#fffefb',
            border: 'none',
            borderRadius: '8px',
            padding: '6px 14px',
            fontWeight: '700',
            cursor: 'pointer'
          }}
        >
          ✕ Exit Prototype
        </button>
      </div>

      {/* WIP Alert Toast */}
      {wipAlert && (
        <div
          style={{
            background: wipAlert.startsWith('⚠️') ? '#fef3c7' : '#ecfdf5',
            color: wipAlert.startsWith('⚠️') ? '#92400e' : '#065f46',
            borderBottom: `2px solid ${wipAlert.startsWith('⚠️') ? '#f59e0b' : '#10b981'}`,
            padding: '10px 24px',
            fontWeight: '700',
            fontSize: '0.9em',
            textAlign: 'center'
          }}
        >
          {wipAlert}
        </div>
      )}

      {/* Main Kanban Board representation */}
      <div style={{ flex: 1, padding: '24px', display: 'flex', gap: '16px', overflowX: 'auto', minHeight: 0, background: '#f8f4f0' }}>
        {columns.map((col, colIdx) => {
          const colTasks = tasks.filter(t => t.column_id === col.id);
          const isAtLimit = col.wip_limit && colTasks.length >= col.wip_limit;

          return (
            <div
              key={col.id}
              style={{
                flex: '1 1 260px',
                background: '#fffefb',
                borderRadius: '12px',
                border: isAtLimit ? '2px solid #ef4444' : '1px solid #c5c0b1',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                overflow: 'hidden'
              }}
            >
              {/* Column Header */}
              <div
                style={{
                  padding: '12px 16px',
                  background: col.color + '12',
                  borderBottom: '1px solid #c5c0b1',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: col.color }} />
                  <strong style={{ fontSize: '0.9em' }}>{col.name}</strong>
                </div>
                <span
                  style={{
                    fontSize: '0.75em',
                    fontWeight: '800',
                    color: isAtLimit ? '#ef4444' : '#605d52',
                    background: '#fffefb',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    border: '1px solid #c5c0b1'
                  }}
                >
                  {colTasks.length} {col.wip_limit ? `/ ${col.wip_limit}` : ''}
                </span>
              </div>

              {/* Task List */}
              <div style={{ flex: 1, padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto' }}>
                {colTasks.map((t) => {
                  const isHovered = hoveredCardId === t.id;

                  return (
                    <div
                      key={t.id}
                      onMouseEnter={() => setHoveredCardId(t.id)}
                      onMouseLeave={() => setHoveredCardId(null)}
                      style={{
                        background: '#fffefb',
                        border: '1px solid #c5c0b1',
                        borderRadius: '10px',
                        padding: '12px',
                        position: 'relative',
                        boxShadow: isHovered ? '0 6px 16px rgba(0,0,0,0.1)' : '0 1px 3px rgba(0,0,0,0.04)',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {/* VARIANT 1: Corner Arrow Chips */}
                      {variant === 1 && (
                        <div style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', gap: '4px' }}>
                          {colIdx > 0 && (
                            <button
                              onClick={() => moveTask(t.id, -1)}
                              title={`Move back to ${columns[colIdx - 1]?.name}`}
                              style={{
                                background: '#f1f5f9',
                                border: '1px solid #cbd5e1',
                                borderRadius: '6px',
                                width: '24px',
                                height: '24px',
                                cursor: 'pointer',
                                fontWeight: '800',
                                color: '#201515',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.8em'
                              }}
                            >
                              ◀
                            </button>
                          )}
                          {colIdx < columns.length - 1 && (
                            <button
                              onClick={() => moveTask(t.id, 1)}
                              title={`Advance to ${columns[colIdx + 1]?.name}`}
                              style={{
                                background: '#ff4f00',
                                border: 'none',
                                color: '#fffefb',
                                borderRadius: '6px',
                                width: '24px',
                                height: '24px',
                                cursor: 'pointer',
                                fontWeight: '800',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.8em',
                                boxShadow: '0 2px 4px rgba(255, 79, 0, 0.3)'
                              }}
                            >
                              ▶
                            </button>
                          )}
                        </div>
                      )}

                      <div style={{ fontWeight: '700', fontSize: '0.9em', marginBottom: '6px', paddingRight: variant === 1 ? '56px' : '0' }}>
                        {t.title}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                        <span style={{ fontSize: '0.75em', fontWeight: '700', color: '#ff4f00', background: '#fff1f2', padding: '2px 8px', borderRadius: '10px' }}>
                          {t.priority}
                        </span>
                        <span style={{ fontSize: '0.75em', color: '#605d52' }}>
                          Score: {t.score}
                        </span>
                      </div>

                      {/* VARIANT 2: Bottom Labeled Action Ribbon */}
                      {variant === 2 && (
                        <div style={{ marginTop: '12px', paddingTop: '8px', borderTop: '1px dashed #c5c0b1', display: 'flex', gap: '6px' }}>
                          {colIdx > 0 && (
                            <button
                              onClick={() => moveTask(t.id, -1)}
                              style={{
                                flex: 1,
                                background: '#f8f4f0',
                                border: '1px solid #c5c0b1',
                                borderRadius: '6px',
                                padding: '4px 6px',
                                fontSize: '0.75em',
                                fontWeight: '700',
                                cursor: 'pointer',
                                color: '#201515'
                              }}
                            >
                              ◀ {columns[colIdx - 1]?.name}
                            </button>
                          )}
                          {colIdx < columns.length - 1 && (
                            <button
                              onClick={() => moveTask(t.id, 1)}
                              style={{
                                flex: 1,
                                background: '#ff4f00',
                                color: '#fffefb',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '4px 6px',
                                fontSize: '0.75em',
                                fontWeight: '700',
                                cursor: 'pointer'
                              }}
                            >
                              {columns[colIdx + 1]?.name} ▶
                            </button>
                          )}
                        </div>
                      )}

                      {/* VARIANT 3: Mini Stepper Bar */}
                      {variant === 3 && (
                        <div style={{ marginTop: '12px', paddingTop: '8px', borderTop: '1px solid #e8e4de', display: 'flex', gap: '4px' }}>
                          {columns.map((c, idx) => {
                            const isCurrent = c.id === t.column_id;
                            const isPast = idx < colIdx;

                            return (
                              <button
                                key={c.id}
                                onClick={() => jumpToColumn(t.id, c.id)}
                                title={`Move to ${c.name}`}
                                style={{
                                  flex: 1,
                                  height: '6px',
                                  borderRadius: '3px',
                                  border: 'none',
                                  background: isCurrent ? '#ff4f00' : isPast ? '#201515' : '#e2e8f0',
                                  cursor: 'pointer',
                                  transition: 'background 0.2s ease'
                                }}
                              />
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}

                {colTasks.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '24px 8px', color: '#939084', fontSize: '0.8em' }}>
                    No tasks in {col.name}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Bottom Variation Switcher */}
      <div
        style={{
          background: '#201515',
          color: '#fffefb',
          padding: '12px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: '2px solid #ff4f00'
        }}
      >
        <div style={{ fontSize: '0.85em', fontWeight: '700' }}>
          Select "Move to Next Phase" Button Design:
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setVariant(1)}
            style={{
              background: variant === 1 ? '#ff4f00' : 'rgba(255,255,255,0.15)',
              color: '#fffefb',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 16px',
              fontWeight: '700',
              cursor: 'pointer',
              fontSize: '0.85em'
            }}
          >
            Variant 1: Top Corner Arrow Chips (◀ / ▶)
          </button>
          <button
            onClick={() => setVariant(2)}
            style={{
              background: variant === 2 ? '#ff4f00' : 'rgba(255,255,255,0.15)',
              color: '#fffefb',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 16px',
              fontWeight: '700',
              cursor: 'pointer',
              fontSize: '0.85em'
            }}
          >
            Variant 2: Bottom Labeled Action Ribbon
          </button>
          <button
            onClick={() => setVariant(3)}
            style={{
              background: variant === 3 ? '#ff4f00' : 'rgba(255,255,255,0.15)',
              color: '#fffefb',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 16px',
              fontWeight: '700',
              cursor: 'pointer',
              fontSize: '0.85em'
            }}
          >
            Variant 3: Mini Phase Stepper Bar
          </button>
        </div>
      </div>
    </div>
  );
}
