// src/components/CalendarGrid.jsx
import React, { useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
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

export default function CalendarGrid({
  tasks,
  columns = [],
  projects = [],
  selectedProjectId = null,
  onSelectProject,
  onScheduleChange,
  onExternalDrop
}) {
  const doneCol = columns.find((c) => c.name === 'Done');

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

  // On-calendar drag to reschedule
  const handleEventDrop = (info) => {
    if (!onScheduleChange) return;
    const taskId = Number(info.event.extendedProps.taskId);
    const startIso = formatLocalIso(info.event.start);
    const endIso = info.event.end ? formatLocalIso(info.event.end) : null;
    onScheduleChange(taskId, startIso, endIso);
  };

  // On-calendar drag to resize duration
  const handleEventResize = (info) => {
    if (!onScheduleChange) return;
    const taskId = Number(info.event.extendedProps.taskId);
    const startIso = formatLocalIso(info.event.start);
    const endIso = info.event.end ? formatLocalIso(info.event.end) : null;
    onScheduleChange(taskId, startIso, endIso);
  };

  // External drop from Kanban board
  const handleEventReceive = (info) => {
    if (!onExternalDrop) return;

    // Parse data-event JSON from the dragged element
    const rawData = info.event.extendedProps;
    const taskId = rawData.taskId || Number(info.event.id);
    const startIso = formatLocalIso(info.event.start);
    const endIso = info.event.end ? formatLocalIso(info.event.end) : null;

    // Remove the FullCalendar-rendered ghost — we manage state ourselves
    info.event.remove();

    onExternalDrop(taskId, startIso, endIso);
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
        scrollTime="08:00:00"
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
        eventDrop={handleEventDrop}
        eventResize={handleEventResize}
        eventReceive={handleEventReceive}
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
