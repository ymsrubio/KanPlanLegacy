import React, { useState, useEffect, useRef } from 'react';
import KanbanBoard from './components/KanbanBoard.jsx';
import CalendarGrid from './components/CalendarGrid.jsx';
import WipSwapModal from './components/WipSwapModal.jsx';
import LoginPage from './components/LoginPage.jsx';
import UserMenu from './components/UserMenu.jsx';
import { processAutoTransitions } from './lib/auto-scheduler.js';
import { getTodayDateString, hasDateChanged } from './lib/time-utils.js';
import PhaseTransitionPrototype from './components/PhaseTransitionPrototype.jsx';

export default function App() {
  // Auth state
  const [authState, setAuthState] = useState('loading'); // 'loading' | 'authenticated' | 'unauthenticated'
  const [user, setUser] = useState(null);

  const [layoutMode, setLayoutMode] = useState('split');
  const [columns, setColumns] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [autoScheduleEnabled, setAutoScheduleEnabled] = useState(true);
  const [currentDateStr, setCurrentDateStr] = useState(getTodayDateString());
  const [showPhasePrototype, setShowPhasePrototype] = useState(false);

  // WIP swap modal state
  const [wipSwapState, setWipSwapState] = useState(null);
  const [calendarAlert, setCalendarAlert] = useState(null);

  const showCalendarAlert = (msg) => {
    setCalendarAlert(msg);
    setTimeout(() => setCalendarAlert(null), 4000);
  };

  // Check auth on mount
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error('Unauthorized');
      })
      .then((data) => {
        setUser(data);
        setAuthState('authenticated');
      })
      .catch(() => {
        setAuthState('unauthenticated');
      });
  }, []);

  // Load data once authenticated
  useEffect(() => {
    if (authState !== 'authenticated') return;

    fetch('/api/columns')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data && setColumns(data))
      .catch(() => console.log('Failed to fetch columns'));

    fetch('/api/tasks')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data && setTasks(data))
      .catch(() => console.log('Failed to fetch tasks'));
  }, [authState]);

  // Auto-schedule & Midnight New-Day Ticker
  useEffect(() => {
    if (authState !== 'authenticated') return;

    const runTicker = () => {
      const now = new Date();

      // 1. Midnight date change check
      if (hasDateChanged(currentDateStr, now)) {
        const newDate = getTodayDateString(now);
        setCurrentDateStr(newDate);
        showCalendarAlert(`🗓️ New day started (${newDate})! Calendar & schedule updated.`);
      }

      // 2. Auto-schedule transitions check
      if (!autoScheduleEnabled || tasks.length === 0 || columns.length === 0) return;

      const transitions = processAutoTransitions(tasks, columns, now);
      if (transitions.length === 0) return;

      transitions.forEach(async ({ taskId, targetColumnId, task, reason, wipOverflow, demoteCandidateId }) => {
        // If WIP limit would overflow when auto-starting to In Progress, demote lowest priority task back to Backlog
        if (wipOverflow && demoteCandidateId) {
          const backlogCol = columns.find((c) => c.name === 'Backlog');
          const backlogId = backlogCol ? backlogCol.id : (columns[0] ? columns[0].id : 1);
          const demotedTask = tasks.find((t) => Number(t.id) === demoteCandidateId);

          setTasks((prev) =>
            prev.map((t) =>
              Number(t.id) === demoteCandidateId
                ? { ...t, column_id: backlogId }
                : Number(t.id) === taskId
                ? { ...t, column_id: targetColumnId }
                : t
            )
          );

          try {
            await fetch(`/api/tasks/${demoteCandidateId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ column_id: backlogId })
            });
            await fetch(`/api/tasks/${taskId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ column_id: targetColumnId })
            });
          } catch (err) {
            console.log('Failed to persist auto transition / demotion to server');
          }

          showCalendarAlert(`⚡ "${task.title}" auto-started! Moved "${demotedTask?.title || 'lowest priority'}" to Backlog (WIP Limit).`);
        } else {
          setTasks((prev) =>
            prev.map((t) => (Number(t.id) === taskId ? { ...t, column_id: targetColumnId } : t))
          );

          try {
            await fetch(`/api/tasks/${taskId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ column_id: targetColumnId })
            });
          } catch (err) {
            console.log('Failed to persist auto transition to server');
          }

          const actionText = reason === 'start' ? 'In Progress' : 'Done';
          showCalendarAlert(`⚡ "${task.title}" automatically moved to ${actionText}!`);
        }
      });
    };

    runTicker();
    const interval = setInterval(runTicker, 10000);
    return () => clearInterval(interval);
  }, [tasks, columns, autoScheduleEnabled, authState, currentDateStr]);

  // Logout handler
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      // Best-effort
    }
    setUser(null);
    setColumns([]);
    setTasks([]);
    setAuthState('unauthenticated');
  };

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
    const readyToStartCol = columns.find((c) => c.name === 'Ready to Start');
    const readyTasks = readyToStartCol ? tasks.filter((t) => Number(t.column_id) === readyToStartCol.id) : [];
    const task = tasks.find((t) => Number(t.id) === taskId);

    if (!task) return;

    // Check WIP limit
    if (
      readyToStartCol &&
      readyToStartCol.wip_limit !== null &&
      Number(task.column_id) !== readyToStartCol.id &&
      readyTasks.length >= readyToStartCol.wip_limit
    ) {
      setWipSwapState({
        pendingTask: task,
        startIso,
        endIso,
        readyTasks,
        readyToStartCol
      });
      return;
    }

    completeExternalDrop(task, startIso, endIso, readyToStartCol);
  };

  const completeExternalDrop = async (task, startIso, endIso, readyToStartCol) => {
    const targetColId = readyToStartCol ? readyToStartCol.id : task.column_id;
    setTasks((prev) =>
      prev.map((t) =>
        Number(t.id) === Number(task.id)
          ? { ...t, column_id: targetColId, schedule_start: startIso, schedule_end: endIso }
          : t
      )
    );

    try {
      await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          column_id: targetColId,
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

    const backlogCol = columns.find((c) => c.name === 'Backlog');
    const backlogId = backlogCol ? backlogCol.id : (columns[0] ? columns[0].id : 1);

    setTasks((prev) =>
      prev.map((t) =>
        Number(t.id) === swapTaskId
          ? { ...t, column_id: backlogId, schedule_start: null, schedule_end: null }
          : t
      )
    );

    try {
      await fetch(`/api/tasks/${swapTaskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ column_id: backlogId, schedule_start: null, schedule_end: null })
      });
    } catch (err) {
      console.log('Failed to persist swap to server');
    }

    const swappedTask = tasks.find((t) => Number(t.id) === swapTaskId);
    showCalendarAlert(`↩️ "${swappedTask?.title}" moved back to Backlog.`);

    await completeExternalDrop(wipSwapState.pendingTask, wipSwapState.startIso, wipSwapState.endIso, wipSwapState.readyToStartCol);
    setWipSwapState(null);
  };

  // --- Render ---

  // Loading state
  if (authState === 'loading') {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#fffefb',
          fontFamily: 'Inter, system-ui, sans-serif',
          color: '#605d52'
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2em', marginBottom: '12px' }}>🎯</div>
          <div style={{ fontWeight: '600' }}>Loading KanPlan...</div>
        </div>
      </div>
    );
  }

  // Unauthenticated — show login page
  if (authState === 'unauthenticated') {
    return <LoginPage />;
  }

  // Authenticated — show board
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
          justifyContent: 'space-between',
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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

          {/* Auto-Schedule Toggle Button */}
          <button
            onClick={() => {
              const nextState = !autoScheduleEnabled;
              setAutoScheduleEnabled(nextState);
              showCalendarAlert(
                nextState ? '⚡ Auto-Schedule sync enabled!' : '⏸️ Auto-Schedule sync paused.'
              );
            }}
            title={autoScheduleEnabled ? 'Auto-Schedule Active (Click to pause)' : 'Auto-Schedule Paused (Click to enable)'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              border: autoScheduleEnabled ? '1px solid #16a34a' : '1px solid #c5c0b1',
              background: autoScheduleEnabled ? '#f0fdf4' : '#fffefb',
              color: autoScheduleEnabled ? '#15803d' : '#605d52',
              fontWeight: '700',
              padding: '6px 14px',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '0.85em',
              transition: 'all 0.2s ease'
            }}
          >
            {autoScheduleEnabled ? '⚡ Auto-Sync: ON' : '⏸️ Auto-Sync: OFF'}
          </button>

          {/* Phase Transition Prototype Button */}
          <button
            onClick={() => setShowPhasePrototype(true)}
            style={{
              border: '1px solid #ff4f00',
              background: '#fffefb',
              color: '#ff4f00',
              fontWeight: '800',
              padding: '6px 14px',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '0.85em',
              transition: 'all 0.2s ease'
            }}
          >
            🧪 Test Phase Buttons
          </button>

          {/* User profile menu */}
          {user && <UserMenu user={user} onLogout={handleLogout} />}
        </div>
      </header>

      {/* Phase Transition Prototype Modal */}
      {showPhasePrototype && (
        <PhaseTransitionPrototype onClose={() => setShowPhasePrototype(false)} />
      )}

      {/* Main Workspace */}
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
              columns={columns}
              onScheduleChange={handleScheduleChange}
              onExternalDrop={handleExternalDrop}
            />
          </div>
        )}
      </main>
    </div>
  );
}
