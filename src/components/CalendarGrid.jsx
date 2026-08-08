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

export default function CalendarGrid({ tasks, columns = [], onScheduleChange, onExternalDrop }) {
  const doneCol = columns.find((c) => c.name === 'Done');

  // Convert tasks → FullCalendar events
  const events = useMemo(() => {
    return tasks
      .filter((t) => t.schedule_start)
      .map((t) => {
        const isDone = doneCol ? Number(t.column_id) === Number(doneCol.id) : false;
        const priorityClass = getPriorityClass(t);
        return {
          id: String(t.id),
          title: t.title,
          start: t.schedule_start,
          end: t.schedule_end || undefined,
          classNames: [priorityClass, isDone ? 'event-done' : ''],
          extendedProps: {
            taskId: t.id,
            description: t.description,
            column_id: t.column_id,
            priority_score: t.priority_score
          }
        };
      });
  }, [tasks, doneCol]);

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
        padding: '8px',
        flex: 1,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        minWidth: '320px',
        overflow: 'hidden'
      }}
    >
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
        snapDuration="00:30:00"
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
