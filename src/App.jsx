// src/App.jsx
import React, { useState, useEffect } from 'react';
import KanbanBoard from './components/KanbanBoard.jsx';
import CalendarGrid from './components/CalendarGrid.jsx';
import WipSwapModal from './components/WipSwapModal.jsx';
import Toast from './components/Toast.jsx';

export default function App() {
  const [layoutMode, setLayoutMode] = useState('split');

  const [columns, setColumns] = useState([
    { id: 1, name: 'Backlog', wip_limit: null },
    { id: 2, name: 'Ready to Start', wip_limit: 3 },
    { id: 3, name: 'In Progress', wip_limit: 2 },
    { id: 4, name: 'Done', wip_limit: null }
  ]);

  const [tasks, setTasks] = useState([
    {
      id: 101,
      column_id: 1,
      title: 'Explore Cloudflare D1',
      description: 'Setup local wrangler DB',
      is_urgent: 0,
      is_important: 1,
      schedule_start: '2026-08-07T09:00:00',
      schedule_end: '2026-08-07T10:00:00'
    },
    {
      id: 102,
      column_id: 2,
      title: 'Fix Express Endpoint',
      description: 'Resolve WIP limit bug',
      is_urgent: 1,
      is_important: 1,
      schedule_start: '2026-08-07T10:00:00',
      schedule_end: '2026-08-07T11:00:00'
    },
    {
      id: 103,
      column_id: 2,
      title: 'Time-block Calendar',
      description: 'Add drag and drop grid',
      is_urgent: 0,
      is_important: 1,
      schedule_start: '2026-08-07T10:00:00',
      schedule_end: '2026-08-07T12:00:00'
    }
  ]);

  // WIP swap modal state
  const [wipSwapState, setWipSwapState] = useState(null);
  const [calendarAlert, setCalendarAlert] = useState(null);

  const showCalendarAlert = (msg) => {
    setCalendarAlert(msg);
    setTimeout(() => setCalendarAlert(null), 4000);
  };

  useEffect(() => {
    fetch('/api/columns')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data && setColumns(data))
      .catch(() => console.log('Using local columns fallback'));

    fetch('/api/tasks')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data && data.length > 0 && setTasks(data))
      .catch(() => console.log('Using local tasks fallback'));
  }, []);

  // Calendar: on-calendar drag-to-reschedule or resize
  const handleScheduleChange = async (taskId, startIso, endIso) => {
    setTasks((prev) =>
      prev.map((t) =>
        Number(t.id) === taskId
          ? { ...t, schedule_start: startIso, schedule_end: endIso }
          : t
      )
    );

    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schedule_start: startIso, schedule_end: endIso })
      });
    } catch (err) {
      console.log('Failed to persist reschedule to server');
    }
  };

  // Calendar: external drop from Kanban
  const handleExternalDrop = (taskId, startIso, endIso) => {
    const readyToStartCol = columns.find((c) => c.id === 2);
    const readyTasks = tasks.filter((t) => Number(t.column_id) === 2);
    const task = tasks.find((t) => Number(t.id) === taskId);

    if (!task) return;

    // Check WIP limit
    if (
      readyToStartCol &&
      readyToStartCol.wip_limit !== null &&
      Number(task.column_id) !== 2 &&
      readyTasks.length >= readyToStartCol.wip_limit
    ) {
      // WIP full — open swap modal
      setWipSwapState({
        pendingTask: task,
        startIso,
        endIso,
        readyTasks
      });
      return;
    }

    // Move task to Ready to Start + schedule it
    completeExternalDrop(task, startIso, endIso);
  };

  const completeExternalDrop = async (task, startIso, endIso) => {
    setTasks((prev) =>
      prev.map((t) =>
        Number(t.id) === Number(task.id)
          ? { ...t, column_id: 2, schedule_start: startIso, schedule_end: endIso }
          : t
      )
    );

    try {
      await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          column_id: 2,
          schedule_start: startIso,
          schedule_end: endIso
        })
      });
    } catch (err) {
      console.log('Failed to persist calendar drop to server');
    }

    showCalendarAlert(`✅ "${task.title}" scheduled & moved to Ready to Start!`);
  };

  // WIP swap: move selected task back to Backlog, then complete the pending drop
  const handleWipSwap = async (swapTaskId) => {
    if (!wipSwapState) return;

    // Move the swapped task back to Backlog (column 1) and clear its schedule
    setTasks((prev) =>
      prev.map((t) =>
        Number(t.id) === swapTaskId
          ? { ...t, column_id: 1, schedule_start: null, schedule_end: null }
          : t
      )
    );

    try {
      await fetch(`/api/tasks/${swapTaskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ column_id: 1, schedule_start: null, schedule_end: null })
      });
    } catch (err) {
      console.log('Failed to persist swap to server');
    }

    const swappedTask = tasks.find((t) => Number(t.id) === swapTaskId);
    showCalendarAlert(`↩️ "${swappedTask?.title}" moved back to Backlog.`);

    // Now complete the pending external drop
    await completeExternalDrop(wipSwapState.pendingTask, wipSwapState.startIso, wipSwapState.endIso);
    setWipSwapState(null);
  };

  return (
    <div
      style={{
        padding: '20px 24px',
        fontFamily: 'Inter, system-ui, sans-serif',
        background: '#fffefb',
        height: '100vh',
        maxHeight: '100vh',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        color: '#201515'
      }}
    >
      {/* Calendar-level toast */}
      {calendarAlert && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: '#201515',
            color: '#fffefb',
            padding: '12px 20px',
            borderRadius: '12px',
            fontSize: '0.9em',
            fontWeight: '600',
            zIndex: 9999,
            boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
            animation: 'fadeIn 0.3s ease'
          }}
        >
          {calendarAlert}
        </div>
      )}

      {/* WIP Swap Modal */}
      <WipSwapModal
        isOpen={Boolean(wipSwapState)}
        onClose={() => setWipSwapState(null)}
        onSwap={handleWipSwap}
        readyTasks={wipSwapState?.readyTasks || []}
        pendingTask={wipSwapState?.pendingTask}
      />

      {/* Fixed Header */}
      <header
        style={{
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '16px',
          background: '#f8f4f0',
          padding: '14px 24px',
          borderRadius: '12px',
          border: '1px solid #c5c0b1',
          flexShrink: 0
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: '1.4em', color: '#201515', fontWeight: '700', letterSpacing: '-0.5px' }}>
            🎯 KanPlan
          </h1>
          <p style={{ margin: '2px 0 0 0', fontSize: '0.85em', color: '#605d52' }}>
            Agile Kanban WIP Limits + Calendar Time Blocking
          </p>
        </div>

        {/* View Mode Toggle */}
        <div style={{ display: 'flex', gap: '4px', background: '#fffefb', padding: '4px', borderRadius: '12px', border: '1px solid #c5c0b1' }}>
          <button
            onClick={() => setLayoutMode('split')}
            style={{
              border: 'none',
              background: layoutMode === 'split' ? '#ff4f00' : 'transparent',
              color: layoutMode === 'split' ? '#fffefb' : '#201515',
              fontWeight: '600',
              padding: '6px 14px',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '0.85em',
              transition: 'background 0.2s'
            }}
          >
            📊 Split View
          </button>
          <button
            onClick={() => setLayoutMode('kanban')}
            style={{
              border: 'none',
              background: layoutMode === 'kanban' ? '#ff4f00' : 'transparent',
              color: layoutMode === 'kanban' ? '#fffefb' : '#201515',
              fontWeight: '600',
              padding: '6px 14px',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '0.85em',
              transition: 'background 0.2s'
            }}
          >
            📋 Kanban Only
          </button>
          <button
            onClick={() => setLayoutMode('calendar')}
            style={{
              border: 'none',
              background: layoutMode === 'calendar' ? '#ff4f00' : 'transparent',
              color: layoutMode === 'calendar' ? '#fffefb' : '#201515',
              fontWeight: '600',
              padding: '6px 14px',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '0.85em',
              transition: 'background 0.2s'
            }}
          >
            📅 Calendar Only
          </button>
        </div>
      </header>

      {/* Main Workspace (Full Viewport Flex Container) */}
      <main style={{ flex: 1, minHeight: 0, display: 'flex', gap: '20px', alignItems: 'stretch', overflow: 'hidden' }}>
        {(layoutMode === 'split' || layoutMode === 'kanban') && (
          <div
            style={{
              flex: layoutMode === 'split' ? '0 0 320px' : 1,
              height: '100%',
              overflowY: 'auto',
              paddingRight: '4px'
            }}
          >
            <KanbanBoard tasks={tasks} setTasks={setTasks} columns={columns} setColumns={setColumns} />
          </div>
        )}

        {(layoutMode === 'split' || layoutMode === 'calendar') && (
          <div
            style={{
              flex: 1,
              height: '100%',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <CalendarGrid
              tasks={tasks}
              onScheduleChange={handleScheduleChange}
              onExternalDrop={handleExternalDrop}
            />
          </div>
        )}
      </main>
    </div>
  );
}
