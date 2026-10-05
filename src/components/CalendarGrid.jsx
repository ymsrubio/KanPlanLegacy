// src/components/CalendarGrid.jsx
import React, { useMemo, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { blocksOf, overlapSuggestion, formatRange } from '../lib/schedule.js';
import '../fullcalendar-theme.css';

function getPriorityClass(task) {
  const urgency = task.urgency_level || (task.is_urgent ? 4 : 2);
  const importance = task.importance_level || (task.is_important ? 4 : 2);
  const score = task.priority_score || (urgency * importance);
  if (score >= 20) return 'priority-critical';
  if (score >= 12) return 'priority-high';
  if (score >= 8) return 'priority-medium';
  return 'priority-low';
}

// Block content: title plus an explicit range badge, e.g. 09:00 AM - 10:00 AM
const renderEvent = (arg) => (
  <div className="kp-ev">
    <span className="kp-ev-title">{arg.event.title}</span>
    <span className="kp-ev-range">{formatRange(arg.event.start, arg.event.end)}</span>
  </div>
);

export default function CalendarGrid({
  tasks,
  columns = [],
  projects = [],
  selectedProjectId = null,
  onSelectProject,
  onScheduleChange,
  onExternalDrop,
  onEditTask
}) {
  const doneCol = columns.find((c) => c.name === 'Done');
  // Open an hour before now so the now-line is on screen
  const [scrollTime] = useState(() => `${String(Math.max(0, new Date().getHours() - 1)).padStart(2, '0')}:00:00`);

  // Filter tasks based on selected project
  const filteredTasks = useMemo(() => {
    if (!selectedProjectId) return tasks;
    return tasks.filter((t) => Number(t.project_id) === Number(selectedProjectId));
  }, [tasks, selectedProjectId]);

  // Convert tasks → FullCalendar events
  const events = useMemo(() => {
    return filteredTasks
      .filter((t) => t.schedule_start)
      .map((t) => {
        const isDone = doneCol ? Number(t.column_id) === Number(doneCol.id) : false;
        const priorityClass = getPriorityClass(t);
        const project = t.project_id ? projects.find((p) => Number(p.id) === Number(t.project_id)) : null;

        return {
          id: String(t.id),
          title: t.title,
          start: t.schedule_start,
          end: t.schedule_end || undefined,
          backgroundColor: project?.color ? `${project.color}30` : undefined,
          borderColor: project?.color || undefined,
          classNames: [priorityClass, isDone ? 'event-done' : ''],
          extendedProps: {
            taskId: t.id,
            description: t.description,
            column_id: t.column_id,
            project_id: t.project_id,
            priority_score: t.priority_score
          }
        };
      });
  }, [filteredTasks, doneCol, projects]);

  // Overlap: offer the next free slot instead of blocking. `prompt` holds the pending choice.
  const [prompt, setPrompt] = useState(null);
  const apply = (kind, taskId, startIso, endIso) =>
    kind === 'drop' ? onExternalDrop?.(taskId, startIso, endIso) : onScheduleChange?.(taskId, startIso, endIso);

  const settle = (kind, taskId, startIso, endIso, revert) => {
    const hit = overlapSuggestion(blocksOf(tasks, columns), taskId, startIso, endIso);
    if (!hit) { setPrompt(null); apply(kind, taskId, startIso, endIso); return; }
    revert();
    const other = tasks.find((t) => Number(t.id) === Number(hit.with.id));
    const mine = tasks.find((t) => Number(t.id) === Number(taskId));
    setPrompt({ kind, taskId, hit, title: mine?.title, other: other?.title, requested: [startIso, endIso] });
  };

  const fromInfo = (info) => {
    const taskId = Number(info.event.extendedProps.taskId || info.event.id);
    return [taskId, formatLocalIso(info.event.start), info.event.end ? formatLocalIso(info.event.end) : null];
  };

  // On-calendar drag to reschedule, or resize to change duration
  const handleEventChange = (info) => settle('move', ...fromInfo(info), info.revert);

  // External drop from Kanban board
  const handleEventReceive = (info) => {
    const [taskId, startIso, endIso] = fromInfo(info);
    info.revert(); // the task event comes back from state once the drop is accepted
    settle('drop', taskId, startIso, endIso, () => {});
  };

  // Double-click and double-tap to inspect / edit event
  const handleEventDidMount = (info) => {
    let lastTap = 0;
    info.el.style.cursor = 'pointer';
    info.el.setAttribute('title', 'Double-click or double-tap to edit task');

    info.el.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      const taskId = Number(info.event.extendedProps.taskId || info.event.id);
      const task = tasks.find((t) => Number(t.id) === taskId);
      if (task && onEditTask) {
        onEditTask(task);
      }
    });

    info.el.addEventListener('touchend', (e) => {
      const currentTime = new Date().getTime();
      const tapLength = currentTime - lastTap;
      if (tapLength < 350 && tapLength > 0) {
        e.preventDefault();
        e.stopPropagation();
        const taskId = Number(info.event.extendedProps.taskId || info.event.id);
        const task = tasks.find((t) => Number(t.id) === taskId);
        if (task && onEditTask) {
          onEditTask(task);
        }
      }
      lastTap = currentTime;
    });
  };

  return (
    <div
      style={{
        background: '#f8f4f0',
        borderRadius: '12px',
        border: '1px solid #c5c0b1',
        padding: '12px',
        flex: 1,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        minWidth: '320px',
        overflow: 'hidden'
      }}
    >
      {/* Project Filter Chip Bar */}
      {projects.length > 0 && onSelectProject && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            overflowX: 'auto',
            paddingBottom: '8px',
            marginBottom: '8px',
            borderBottom: '1px solid #e8e4de',
            minHeight: '36px'
          }}
        >
          <span style={{ fontSize: '0.75em', fontWeight: '800', color: '#605d52', textTransform: 'uppercase', letterSpacing: '0.5px', marginRight: '4px' }}>
            Filter:
          </span>
          <button
            onClick={() => onSelectProject(null)}
            style={{
              padding: '4px 10px',
              borderRadius: '12px',
              border: selectedProjectId === null ? '1px solid #ff4f00' : '1px solid #c5c0b1',
              background: selectedProjectId === null ? '#ff4f00' : '#fffefb',
              color: selectedProjectId === null ? '#fffefb' : '#201515',
              fontSize: '0.75em',
              fontWeight: '700',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease'
            }}
          >
            All Projects ({tasks.filter((t) => t.schedule_start).length})
          </button>
          {projects.map((p) => {
            const count = tasks.filter((t) => t.schedule_start && Number(t.project_id) === Number(p.id)).length;
            const isSelected = Number(selectedProjectId) === Number(p.id);

            return (
              <button
                key={p.id}
                onClick={() => onSelectProject(isSelected ? null : p.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  borderRadius: '12px',
                  border: isSelected ? `2px solid ${p.color || '#ff4f00'}` : '1px solid #c5c0b1',
                  background: isSelected ? (p.color || '#ff4f00') : '#fffefb',
                  color: isSelected ? '#fffefb' : '#201515',
                  fontSize: '0.75em',
                  fontWeight: '700',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease'
                }}
              >
                <span
                  style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    background: isSelected ? '#fffefb' : (p.color || '#ff4f00')
                  }}
                />
                {p.name} ({count})
              </button>
            );
          })}
        </div>
      )}
      {prompt && (
        <div className="kp-overlap" role="alert">
          <span>"{prompt.title}" overlaps "{prompt.other}".</span>
          <button type="button" className="kp-overlap-use" onClick={() => { apply(prompt.kind, prompt.taskId, prompt.hit.start, prompt.hit.end); setPrompt(null); }}>{prompt.hit.label}</button>
          <button type="button" className="kp-overlap-alt" onClick={() => { apply(prompt.kind, prompt.taskId, ...prompt.requested); setPrompt(null); }}>Keep both</button>
          <button type="button" className="kp-overlap-alt" aria-label="Dismiss" onClick={() => setPrompt(null)}>Cancel</button>
        </div>
      )}
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridDay"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'timeGridDay,timeGridWeek'
        }}
        buttonText={{
          today: 'Today',
          day: 'Day',
          week: 'Week'
        }}
        slotDuration="00:30:00"
        slotLabelInterval="01:00:00"
        slotMinTime="00:00:00"
        slotMaxTime="24:00:00"
        scrollTime={scrollTime}
        snapDuration="00:05:00"
        allDaySlot={false}
        height="100%"
        expandRows={true}
        nowIndicator={true}
        editable={true}
        droppable={true}
        eventOverlap={true}
        eventDurationEditable={true}
        eventStartEditable={true}
        dayMaxEvents={true}
        events={events}
        eventDrop={handleEventChange}
        eventResize={handleEventChange}
        eventContent={renderEvent}
        eventReceive={handleEventReceive}
        eventDidMount={handleEventDidMount}
      />
    </div>
  );
}

/** Format a Date object to local wall-clock ISO string (no Z offset) */
function formatLocalIso(date) {
  if (!date) return null;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  return `${y}-${m}-${d}T${h}:${min}:${s}`;
}
