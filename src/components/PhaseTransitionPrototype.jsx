// src/components/PhaseTransitionPrototype.jsx
// Interactive UI Prototype for Issue #53: One-Click Phase Transition Buttons with Split View Support

import React, { useState } from 'react';

const INITIAL_COLUMNS = [
  { id: 1, name: 'Backlog', wip_limit: null, color: '#64748b' },
  { id: 2, name: 'Ready to Start', wip_limit: 2, color: '#f59e0b' },
  { id: 3, name: 'In Progress', wip_limit: 2, color: '#3b82f6' },
  { id: 4, name: 'Done', wip_limit: null, color: '#10b981' }
];

const INITIAL_TASKS = [
  { id: 1, title: 'Design Landing Page Hero', column_id: 1, priority: '🔥 Critical', score: 20, time: '09:00 AM - 10:30 AM' },
  { id: 2, title: 'Build Stripe Webhook Handler', column_id: 1, priority: '🔶 High', score: 16, time: '02:00 PM - 03:30 PM' },
  { id: 3, title: 'Setup Google OAuth 2.0', column_id: 2, priority: '🔶 High', score: 15, time: '11:00 AM - 12:00 PM' },
  { id: 4, title: 'Fix CSS Grid Collisions', column_id: 3, priority: '⚡ Medium', score: 12, time: '04:00 PM - 05:00 PM' },
  { id: 5, title: 'Refactor Column Service', column_id: 4, priority: '📥 Low', score: 6, time: '08:00 AM - 09:00 AM' }
];

export default function PhaseTransitionPrototype({ onClose }) {
  const [layoutMode, setLayoutMode] = useState('split'); // 'split' | 'kanban'
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
            One-Click Arrow Chips (`◀` / `▶`) on Split View & Kanban
          </span>
        </div>

        {/* View Mode Switcher */}
        <div style={{ display: 'flex', gap: '6px', background: 'rgba(255,255,255,0.1)', padding: '4px', borderRadius: '10px' }}>
          <button
            onClick={() => setLayoutMode('split')}
            style={{
              background: layoutMode === 'split' ? '#ff4f00' : 'transparent',
              color: '#fffefb',
              border: 'none',
              borderRadius: '8px',
              padding: '6px 12px',
              fontWeight: '700',
              cursor: 'pointer',
              fontSize: '0.85em'
            }}
          >
            📊 Split View (Kanban + Calendar)
          </button>
          <button
            onClick={() => setLayoutMode('kanban')}
            style={{
              background: layoutMode === 'kanban' ? '#ff4f00' : 'transparent',
              color: '#fffefb',
              border: 'none',
              borderRadius: '8px',
              padding: '6px 12px',
              fontWeight: '700',
              cursor: 'pointer',
              fontSize: '0.85em'
            }}
          >
            📋 Full Kanban Board
          </button>
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

      {/* Main Workspace Area */}
      <div style={{ flex: 1, padding: '20px', display: 'flex', gap: '20px', minHeight: 0, background: '#f8f4f0', overflow: 'hidden' }}>
        {/* Left Kanban Panel */}
        <div
          style={{
            flex: layoutMode === 'split' ? '0 0 340px' : 1,
            display: 'flex',
            flexDirection: layoutMode === 'split' ? 'column' : 'row',
            gap: '14px',
            overflowY: layoutMode === 'split' ? 'auto' : 'hidden',
            overflowX: layoutMode === 'split' ? 'hidden' : 'auto',
            paddingRight: '4px'
          }}
        >
          {columns.map((col, colIdx) => {
            const colTasks = tasks.filter(t => t.column_id === col.id);
            const isAtLimit = col.wip_limit && colTasks.length >= col.wip_limit;

            return (
              <div
                key={col.id}
                style={{
                  flex: layoutMode === 'split' ? 'none' : '1 1 260px',
                  background: '#fffefb',
                  borderRadius: '12px',
                  border: isAtLimit ? '2px solid #ef4444' : '1px solid #c5c0b1',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                  marginBottom: layoutMode === 'split' ? '12px' : '0',
                  overflow: 'hidden'
                }}
              >
                {/* Column Header */}
                <div
                  style={{
                    padding: '10px 14px',
                    background: col.color + '12',
                    borderBottom: '1px solid #c5c0b1',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: col.color }} />
                    <strong style={{ fontSize: '0.85em' }}>{col.name}</strong>
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

                {/* Tasks List */}
                <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
                          padding: '10px 12px',
                          position: 'relative',
                          boxShadow: isHovered ? '0 6px 16px rgba(0,0,0,0.1)' : '0 1px 3px rgba(0,0,0,0.04)',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {/* Corner Arrow Chips */}
                        <div style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', gap: '4px' }}>
                          {colIdx > 0 && (
                            <button
                              onClick={() => moveTask(t.id, -1)}
                              title={`Move back to ${columns[colIdx - 1]?.name}`}
                              style={{
                                background: '#f1f5f9',
                                border: '1px solid #cbd5e1',
                                borderRadius: '6px',
                                width: '22px',
                                height: '22px',
                                cursor: 'pointer',
                                fontWeight: '800',
                                color: '#201515',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.75em'
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
                                width: '22px',
                                height: '22px',
                                cursor: 'pointer',
                                fontWeight: '800',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.75em',
                                boxShadow: '0 2px 4px rgba(255, 79, 0, 0.3)'
                              }}
                            >
                              ▶
                            </button>
                          )}
                        </div>

                        <div style={{ fontWeight: '700', fontSize: '0.85em', marginBottom: '4px', paddingRight: '54px' }}>
                          {t.title}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                          <span style={{ fontSize: '0.7em', fontWeight: '700', color: '#ff4f00', background: '#fff1f2', padding: '2px 6px', borderRadius: '8px' }}>
                            {t.priority}
                          </span>
                          <span style={{ fontSize: '0.7em', color: '#605d52' }}>
                            ⏱️ {t.time}
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {colTasks.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '16px 8px', color: '#939084', fontSize: '0.75em' }}>
                      Empty ({col.name})
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Calendar Grid (in Split View) */}
        {layoutMode === 'split' && (
          <div
            style={{
              flex: 1,
              background: '#fffefb',
              borderRadius: '16px',
              border: '1px solid #c5c0b1',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15em', fontWeight: '800', color: '#201515' }}>
                  📅 Today's Calendar Schedule
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.8em', color: '#605d52' }}>
                  Advancing tasks on the left sidebar reflects their phase progress here
                </p>
              </div>
              <span style={{ fontSize: '0.8em', fontWeight: '700', background: '#f8f4f0', padding: '6px 12px', borderRadius: '8px', border: '1px solid #c5c0b1' }}>
                ⚡ Auto-Sync Active
              </span>
            </div>

            {/* Time Grid slots */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {tasks.map((t) => {
                const col = columns.find(c => c.id === t.column_id);
                return (
                  <div
                    key={t.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      borderRadius: '10px',
                      background: col?.color + '12',
                      borderLeft: `5px solid ${col?.color || '#ff4f00'}`,
                      borderTop: '1px solid #e2e8f0',
                      borderRight: '1px solid #e2e8f0',
                      borderBottom: '1px solid #e2e8f0'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '800', fontSize: '0.9em' }}>{t.title}</div>
                      <div style={{ fontSize: '0.75em', color: '#605d52', marginTop: '2px' }}>
                        ⏱️ {t.time}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          fontSize: '0.75em',
                          fontWeight: '800',
                          background: col?.color,
                          color: '#fffefb',
                          padding: '4px 10px',
                          borderRadius: '12px'
                        }}
                      >
                        {col?.name}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
