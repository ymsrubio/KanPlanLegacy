// src/App.jsx
import React, { useState } from 'react';
import KanbanBoard from './components/KanbanBoard.jsx';
import CalendarGrid from './components/CalendarGrid.jsx';

export default function App() {
  const [layoutMode, setLayoutMode] = useState('split'); // 'split', 'kanban', 'calendar'

  // Shared state for demo
  const [tasks] = useState([
    {
      id: 101,
      column_id: 1,
      title: 'Explore Cloudflare D1',
      description: 'Setup local wrangler DB',
      is_urgent: 0,
      is_important: 1,
      schedule_start: '2026-08-07T09:00:00Z',
      schedule_end: '2026-08-07T10:00:00Z'
    },
    {
      id: 102,
      column_id: 2,
      title: 'Fix Express Endpoint',
      description: 'Resolve WIP limit bug',
      is_urgent: 1,
      is_important: 1,
      schedule_start: '2026-08-07T10:00:00Z',
      schedule_end: '2026-08-07T11:00:00Z'
    },
    {
      id: 103,
      column_id: 2,
      title: 'Time-block Calendar',
      description: 'Add drag and drop grid',
      is_urgent: 0,
      is_important: 1,
      schedule_start: '2026-08-07T10:30:00Z', // Overlaps with 102 to demonstrate visual warning!
      schedule_end: '2026-08-07T11:30:00Z'
    }
  ]);

  return (
    <div style={{ padding: '20px', fontFamily: 'Inter, system-ui, sans-serif', background: '#f1f5f9', minHeight: '100vh' }}>
      {/* Navbar Header */}
      <header
        style={{
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          background: '#ffffff',
          padding: '16px 24px',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          border: '1px solid #e2e8f0'
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: '1.4em', color: '#0f172a', fontWeight: '800' }}>🎯 KanPlan</h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.85em', color: '#64748b' }}>
            Agile Kanban WIP Limits + Calendar Time Blocking
          </p>
        </div>

        {/* Workspace Layout Selector */}
        <div style={{ display: 'flex', gap: '4px', background: '#f8fafc', padding: '4px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <button
            onClick={() => setLayoutMode('split')}
            style={{
              border: 'none',
              background: layoutMode === 'split' ? '#2563eb' : 'transparent',
              color: layoutMode === 'split' ? '#ffffff' : '#64748b',
              fontWeight: '600',
              padding: '6px 14px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.85em'
            }}
          >
            📊 Split View
          </button>
          <button
            onClick={() => setLayoutMode('kanban')}
            style={{
              border: 'none',
              background: layoutMode === 'kanban' ? '#2563eb' : 'transparent',
              color: layoutMode === 'kanban' ? '#ffffff' : '#64748b',
              fontWeight: '600',
              padding: '6px 14px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.85em'
            }}
          >
            📋 Kanban Only
          </button>
          <button
            onClick={() => setLayoutMode('calendar')}
            style={{
              border: 'none',
              background: layoutMode === 'calendar' ? '#2563eb' : 'transparent',
              color: layoutMode === 'calendar' ? '#ffffff' : '#64748b',
              fontWeight: '600',
              padding: '6px 14px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.85em'
            }}
          >
            📅 Calendar Only
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <main style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
        {(layoutMode === 'split' || layoutMode === 'kanban') && (
          <div style={{ flex: layoutMode === 'split' ? 1.4 : 1 }}>
            <KanbanBoard />
          </div>
        )}

        {(layoutMode === 'split' || layoutMode === 'calendar') && (
          <div style={{ flex: layoutMode === 'split' ? 1 : 1 }}>
            <CalendarGrid tasks={tasks} />
          </div>
        )}
      </main>
    </div>
  );
}
