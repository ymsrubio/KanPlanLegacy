import React, { useState, useEffect } from 'react';
import CalendarGrid from './components/CalendarGrid.jsx';
import WipSwapModal from './components/WipSwapModal.jsx';
import LoginPage from './components/LoginPage.jsx';
import ProjectManagerModal from './components/ProjectManagerModal.jsx';
import ArchiveDrawer from './components/ArchiveDrawer.jsx';
import DayList from './components/DayList.jsx';
import AddTask from './components/AddTask.jsx';
import MatrixView from './components/MatrixView.jsx';
import BottomSheet from './components/BottomSheet.jsx';
import Menu from './components/Menu.jsx';
import Icon from './components/Icon.jsx';
import { projectSlot } from './lib/day-list.js';
import './workspace.css';
import { useMedia } from './lib/use-media.js';
import TaskEditDrawer from './components/TaskEditDrawer.jsx';
import { processAutoTransitions } from './lib/auto-scheduler.js';
import { processAutoArchiving } from './lib/auto-archiver.js';
import { getTodayDateString, hasDateChanged } from './lib/time-utils.js';
import { readyPlan, swapUpdates, applyUpdates } from './lib/wip-swap.js';

export default function App() {
  // Auth state
  const [authState, setAuthState] = useState('loading'); // 'loading' | 'authenticated' | 'unauthenticated'
  const [user, setUser] = useState(null);

  const [view, setView] = useState('list');
  const isPhone = useMedia('(max-width: 640px)');
  const [addOpen, setAddOpen] = useState(false);
  const [columns, setColumns] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [archivedTasks, setArchivedTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isArchiveDrawerOpen, setIsArchiveDrawerOpen] = useState(false);
  const [autoScheduleEnabled, setAutoScheduleEnabled] = useState(true);
  const [currentDateStr, setCurrentDateStr] = useState(getTodayDateString());

  // WIP swap modal state
  const [wipSwapState, setWipSwapState] = useState(null);
  const [calendarAlert, setCalendarAlert] = useState(null);

  const showCalendarAlert = (msg) => {
    setCalendarAlert(msg);
    setTimeout(() => setCalendarAlert(null), 4000);
  };

  // The calendar stays mounted (hidden) to keep its state; let it re-measure when shown.
  useEffect(() => {
    window.dispatchEvent(new Event('resize'));
  }, [isPhone, view]);

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

    fetch('/api/projects')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data && setProjects(data))
      .catch(() => console.log('Failed to fetch projects'));

    fetch('/api/tasks')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data && setTasks(data))
      .catch(() => console.log('Failed to fetch tasks'));

    fetch('/api/tasks/archived')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data && setArchivedTasks(data))
      .catch(() => console.log('Failed to fetch archived tasks'));
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
        showCalendarAlert(`New day started (${newDate})! Calendar & schedule updated.`);
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

          showCalendarAlert(`"${task.title}" auto-started! Moved "${demotedTask?.title || 'lowest priority'}" to Backlog (WIP Limit).`);
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
          showCalendarAlert(`"${task.title}" automatically moved to ${actionText}!`);
        }
      });

      // 3. 24-hour completed task auto-archiving check
      if (tasks.length > 0 && columns.length > 0) {
        const toArchive = processAutoArchiving(tasks, columns, now);
        if (toArchive.length > 0) {
          toArchive.forEach(async ({ taskId, task }) => {
            const archivedItem = { ...task, is_archived: 1, archived_at: now.toISOString() };
            setTasks((prev) => prev.filter((t) => Number(t.id) !== taskId));
            setArchivedTasks((prev) => [archivedItem, ...prev]);

            try {
              await fetch(`/api/tasks/${taskId}/archive`, { method: 'POST' });
            } catch (err) {
              console.log('Failed to persist auto-archive to server');
            }

            showCalendarAlert(`Auto-archived "${task.title}" (completed > 24h ago).`);
          });
        }
      }
    };

    runTicker();
    const interval = setInterval(runTicker, 10000);
    return () => clearInterval(interval);
  }, [tasks, columns, autoScheduleEnabled, authState, currentDateStr]);

  // Task Archiving Handlers
  const handleArchiveTask = async (taskId) => {
    const taskToArchive = tasks.find((t) => Number(t.id) === Number(taskId));
    if (!taskToArchive) return;

    const archivedItem = { ...taskToArchive, is_archived: 1, archived_at: new Date().toISOString() };
    setTasks((prev) => prev.filter((t) => Number(t.id) !== Number(taskId)));
    setArchivedTasks((prev) => [archivedItem, ...prev]);
    showCalendarAlert(`"${taskToArchive.title}" moved to Archives.`);

    try {
      await fetch(`/api/tasks/${taskId}/archive`, { method: 'POST' });
    } catch (err) {
      showCalendarAlert('Failed to archive task');
    }
  };

  const handleRestoreTask = async (taskId) => {
    const taskToRestore = archivedTasks.find((t) => Number(t.id) === Number(taskId));
    if (!taskToRestore) return;

    const restoredItem = { ...taskToRestore, is_archived: 0, archived_at: null };
    setArchivedTasks((prev) => prev.filter((t) => Number(t.id) !== Number(taskId)));
    setTasks((prev) => [...prev, restoredItem]);
    showCalendarAlert(`"${taskToRestore.title}" restored to board!`);

    try {
      await fetch(`/api/tasks/${taskId}/restore`, { method: 'POST' });
    } catch (err) {
      showCalendarAlert('Failed to restore task');
    }
  };

  const handlePermanentDeleteArchivedTask = async (taskId) => {
    setArchivedTasks((prev) => prev.filter((t) => Number(t.id) !== Number(taskId)));
    showCalendarAlert('Archived task permanently deleted');

    try {
      await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
    } catch (err) {
      showCalendarAlert('Failed to delete archived task');
    }
  };

  const handleAddTask = async (payload) => {
    const temp = { id: `tmp-${Date.now()}`, ...payload };
    setTasks((prev) => [...prev, temp]);
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('POST failed');
      const saved = await res.json();
      setTasks((prev) => prev.map((t) => (t.id === temp.id ? saved : t)));
    } catch {
      setTasks((prev) => prev.filter((t) => t.id !== temp.id));
      showCalendarAlert('Failed to add task');
    }
  };

  const handleCompleteTask = async (task) => {
    const done = columns.find((c) => c.name === 'Done');
    if (!done) return;
    const completed_at = new Date().toISOString();
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, column_id: done.id, completed_at } : t)));
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ column_id: done.id, completed_at })
      });
      if (!res.ok) throw new Error('PATCH failed');
    } catch {
      setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
      showCalendarAlert('Failed to complete task');
    }
  };

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

  // Task Edit Handler
  const handleSaveEdit = async (updatedTask) => {
    const original = tasks.find((t) => t.id === updatedTask.id);
    const plan = original && readyPlan(tasks, columns, original);
    if (plan?.full && Number(updatedTask.column_id) === Number(plan.ready.id)) {
      const { id, column_id, ...patch } = updatedTask;
      setEditingTask(null);
      setWipSwapState({ pendingTask: original, patch, readyTasks: plan.candidates });
      return;
    }
    setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
    setEditingTask(null);
    showCalendarAlert(`Task "${updatedTask.title}" updated!`);

    try {
      await fetch(`/api/tasks/${updatedTask.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedTask)
      });
    } catch {
      // Best-effort
    }
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

  // Optimistic ordered updates [{ id, patch }]. On failure, restore the UI and any updates the server already took.
  const persistUpdates = async (updates) => {
    const before = tasks;
    setTasks((prev) => applyUpdates(prev, updates));
    const saved = [];
    try {
      for (const u of updates) {
        const res = await fetch(`/api/tasks/${u.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(u.patch)
        });
        if (!res.ok) throw new Error('PATCH failed');
        saved.push(u);
      }
      return true;
    } catch {
      const originals = (u) => before.find((t) => Number(t.id) === Number(u.id));
      setTasks((prev) => prev.map((t) => (updates.some((u) => Number(u.id) === Number(t.id)) ? originals({ id: t.id }) ?? t : t)));
      saved.forEach((u) => {
        const o = originals(u);
        fetch(`/api/tasks/${u.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ column_id: o.column_id, schedule_start: o.schedule_start ?? null, schedule_end: o.schedule_end ?? null })
        }).catch(() => {});
      });
      showCalendarAlert('Could not save that change. Nothing was moved.');
      return false;
    }
  };

  // Move a task into Ready to start; offer a swap instead of an error when it is full.
  const requestReady = async (task, patch = {}) => {
    const plan = readyPlan(tasks, columns, task);
    if (!plan.ready) return;
    if (plan.full) {
      setWipSwapState({ pendingTask: task, patch, readyTasks: plan.candidates });
      return;
    }
    const ok = await persistUpdates([{ id: task.id, patch: { column_id: plan.ready.id, ...patch } }]);
    if (ok) showCalendarAlert(patch.schedule_start ? `"${task.title}" scheduled & moved to Ready to start!` : `"${task.title}" is ready to start.`);
  };

  // Swap: return the chosen task to Backlog, then move the pending one in.
  const handleWipSwap = async (outId) => {
    if (!wipSwapState) return;
    const { pendingTask, patch } = wipSwapState;
    const out = tasks.find((t) => Number(t.id) === Number(outId));
    const ok = await persistUpdates(swapUpdates(columns, pendingTask.id, outId, patch));
    setWipSwapState(null);
    if (ok) showCalendarAlert(`"${out?.title}" went back to Backlog. "${pendingTask.title}" is ready to start.`);
  };

  const handleAddProject = async (projectData) => {
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData)
      });
      if (res.ok) {
        const newProject = await res.json();
        setProjects((prev) => [...prev, newProject]);
        showCalendarAlert(`Project "${newProject.name}" created!`);
        return newProject;
      } else {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create project');
      }
    } catch (err) {
      showCalendarAlert(`${err.message}`);
      throw err;
    }
  };

  const handleDeleteProject = async (projectId) => {
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setProjects((prev) => prev.filter((p) => p.id !== projectId));
        setTasks((prev) =>
          prev.map((t) => (Number(t.project_id) === Number(projectId) ? { ...t, project_id: null } : t))
        );
        if (Number(selectedProjectId) === Number(projectId)) {
          setSelectedProjectId(null);
        }
        showCalendarAlert('Project deleted');
      }
    } catch (err) {
      showCalendarAlert('Failed to delete project');
    }
  };

  // --- Render ---

  if (authState === 'loading') {
    return (
      <div className="app-root ws" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <p className="sub">Loading KanPlan…</p>
      </div>
    );
  }

  if (authState === 'unauthenticated') {
    return <LoginPage />;
  }

  // Desktop shows Day (list + calendar) or Matrix; phones show one of List, Calendar, Matrix.
  const tabs = isPhone ? [['list', 'List'], ['calendar', 'Calendar'], ['matrix', 'Matrix']] : [['list', 'Day'], ['matrix', 'Matrix']];
  const tab = !isPhone && view === 'calendar' ? 'list' : view;
  const show = { list: tab === 'list', calendar: isPhone ? tab === 'calendar' : tab === 'list', matrix: tab === 'matrix' };
  const projectIndex = projects.findIndex((p) => Number(p.id) === Number(selectedProjectId));
  const countFor = (id) => tasks.filter((t) => !t.is_archived && (id == null || Number(t.project_id) === Number(id))).length;
  const today = new Date(`${currentDateStr}T00:00:00`);

  const addTask = (
    <AddTask
      tasks={tasks}
      columns={columns}
      projects={projects}
      defaultProjectId={selectedProjectId}
      onAdd={handleAddTask}
      onCreateProject={(name, color) => handleAddProject({ name, color })}
      onDone={() => setAddOpen(false)}
    />
  );

  return (
    <div className="app-root ws">
      {calendarAlert && <div className="toast" role="status">{calendarAlert}</div>}

      <WipSwapModal
        isOpen={Boolean(wipSwapState)}
        onClose={() => setWipSwapState(null)}
        onSwap={handleWipSwap}
        readyTasks={wipSwapState?.readyTasks || []}
        pendingTask={wipSwapState?.pendingTask}
        projects={projects}
      />
      <ProjectManagerModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        projects={projects}
        onAddProject={handleAddProject}
        onDeleteProject={handleDeleteProject}
      />
      <ArchiveDrawer
        isOpen={isArchiveDrawerOpen}
        onClose={() => setIsArchiveDrawerOpen(false)}
        archivedTasks={archivedTasks}
        projects={projects}
        onRestoreTask={handleRestoreTask}
        onPermanentDelete={handlePermanentDeleteArchivedTask}
      />
      <TaskEditDrawer
        isOpen={Boolean(editingTask)}
        onClose={() => setEditingTask(null)}
        onSave={handleSaveEdit}
        task={editingTask}
        projects={projects}
        columns={columns}
        tasks={tasks}
        onArchive={handleArchiveTask}
      />

      <header className="bar">
        <div>
          <h1 className="display">Today</h1>
          <p className="sub">{today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>
        <div className="seg" role="tablist" aria-label="View">
          {tabs.map(([key, name]) => (
            <button key={key} type="button" role="tab" aria-selected={tab === key} onClick={() => setView(key)}>{name}</button>
          ))}
        </div>
        <div className="acts">
          <Menu
            button={<><span className={`dot ${projectIndex >= 0 ? `d${projectSlot(projectIndex)}` : 'd0'}`} />{projectIndex >= 0 ? projects[projectIndex].name : 'All projects'}<Icon name="down" /></>}
          >
            {(close) => (
              <>
                {[{ id: null, name: 'All projects' }, ...projects].map((p, i) => {
                  const on = p.id == null ? selectedProjectId == null : Number(p.id) === Number(selectedProjectId);
                  return (
                    <button key={p.id ?? 'all'} type="button" className={`row${on ? ' is-selected' : ''}`} role="menuitemradio" aria-checked={on} onClick={() => { setSelectedProjectId(p.id); close(); }}>
                      <span className={`dot ${p.id == null ? 'd0' : `d${projectSlot(i - 1)}`}`} />{p.name}<span className="n">{countFor(p.id)}</span>
                    </button>
                  );
                })}
                <hr />
                <button type="button" className="row" role="menuitem" onClick={() => { close(); setIsProjectModalOpen(true); }}>Manage projects</button>
              </>
            )}
          </Menu>
          {!isPhone && <button type="button" className="btn primary" onClick={() => setAddOpen(true)}><Icon name="plus" />Add task</button>}
          <Menu buttonClass="btn secondary icon" ariaLabel="More" button={<Icon name="more" />}>
            {(close) => (
              <>
                <button type="button" className="row" role="menuitem" onClick={() => { close(); setIsProjectModalOpen(true); }}>Projects</button>
                <button type="button" className="row" role="menuitem" onClick={() => { close(); setIsArchiveDrawerOpen(true); }}>Archive<span className="n">{archivedTasks.length}</span></button>
                <button type="button" className="row" role="menuitemcheckbox" aria-checked={autoScheduleEnabled} onClick={() => setAutoScheduleEnabled((on) => !on)}>
                  Auto-sync<span className="n">{autoScheduleEnabled ? 'On' : 'Off'}</span>
                </button>
                {user && (
                  <>
                    <hr />
                    <p className="who">{user.email || user.name}</p>
                    <button type="button" className="row" role="menuitem" onClick={handleLogout}>Sign out</button>
                  </>
                )}
              </>
            )}
          </Menu>
        </div>
      </header>

      <div className="main">
        {/* Views stay mounted (hidden) so switching keeps their state */}
        <section className="panel list" aria-label="Tasks" hidden={!show.list}>
          <DayList
            tasks={tasks}
            columns={columns}
            projects={projects}
            selectedProjectId={selectedProjectId}
            onEditTask={setEditingTask}
            onComplete={handleCompleteTask}
            onAdd={() => setAddOpen(true)}
          />
        </section>
        <div className="mxp" hidden={!show.matrix}>
          <MatrixView
            tasks={tasks}
            columns={columns}
            projects={projects}
            selectedProjectId={selectedProjectId}
            onReady={requestReady}
            onEditTask={setEditingTask}
          />
        </div>
        <CalendarGrid
            tasks={tasks}
            columns={columns}
            projects={projects}
            selectedProjectId={selectedProjectId}
            onScheduleChange={handleScheduleChange}
            onEditTask={setEditingTask}
            hidden={!show.calendar}
          />
      </div>

      {isPhone && !addOpen && (
        <button type="button" className="btn primary phone-add" onClick={() => setAddOpen(true)}><Icon name="plus" />Add task</button>
      )}
      {isPhone ? (
        <BottomSheet open={addOpen} onClose={() => setAddOpen(false)} title="Add task">{addTask}</BottomSheet>
      ) : addOpen && (
        <div className="scrim" onClick={() => setAddOpen(false)}>
          <div className="dlg" role="dialog" aria-modal="true" aria-labelledby="add-title" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.key === 'Escape' && setAddOpen(false)}>
            <h2 id="add-title">Add task</h2>
            {addTask}
          </div>
        </div>
      )}
    </div>
  );
}
