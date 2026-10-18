// src/components/CalendarGrid.jsx
import React, { useMemo, useRef, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { blocksOf, overlapSuggestion, formatRange } from '../lib/schedule.js';
import { projectSlot } from '../lib/day-list.js';
import Icon from './Icon.jsx';
import '../fullcalendar-theme.css';

// Block content: title plus "Project · 09:00 AM - 10:00 AM"
const renderEvent = (arg) => (
  <div className="kp-ev">
    <b>{arg.event.title}</b>
    <span>{[arg.event.extendedProps.projectName, formatRange(arg.event.start, arg.event.end)].filter(Boolean).join(' · ')}</span>
  </div>
);

const dayTitle = (date) => date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

export default function CalendarGrid({
  tasks,
  columns = [],
  projects = [],
  selectedProjectId = null,
  onScheduleChange,
  onEditTask,
  hidden = false
}) {
  const doneCol = columns.find((c) => c.name === 'Done');
  const runCol = columns.find((c) => c.name.toLowerCase() === 'in progress');
  const cal = useRef(null);
  const [title, setTitle] = useState(() => dayTitle(new Date()));
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
        const isRunning = runCol ? Number(t.column_id) === Number(runCol.id) : false;
        const pi = projects.findIndex((p) => Number(p.id) === Number(t.project_id));
        const slot = pi >= 0 ? projectSlot(pi) : 0;

        return {
          id: String(t.id),
          title: t.title,
          start: t.schedule_start,
          end: t.schedule_end || undefined,
          classNames: ['ev', isDone ? 'd' : `${isRunning ? 'r' : 's'}${slot}`],
          extendedProps: { taskId: t.id, projectName: pi >= 0 ? projects[pi].name : null }
        };
      });
  }, [filteredTasks, doneCol, runCol, projects]);

  // Overlap: offer the next free slot instead of blocking. `prompt` holds the pending choice.
  const [prompt, setPrompt] = useState(null);
  const apply = (taskId, startIso, endIso) => onScheduleChange?.(taskId, startIso, endIso);

  const settle = (taskId, startIso, endIso, revert) => {
    const hit = overlapSuggestion(blocksOf(tasks, columns), taskId, startIso, endIso);
    if (!hit) { setPrompt(null); apply(taskId, startIso, endIso); return; }
    revert();
    const other = tasks.find((t) => Number(t.id) === Number(hit.with.id));
    const mine = tasks.find((t) => Number(t.id) === Number(taskId));
    setPrompt({ taskId, hit, title: mine?.title, other: other?.title, requested: [startIso, endIso] });
  };

  const fromInfo = (info) => {
    const taskId = Number(info.event.extendedProps.taskId || info.event.id);
    return [taskId, formatLocalIso(info.event.start), info.event.end ? formatLocalIso(info.event.end) : null];
  };

  // On-calendar drag to reschedule, or resize to change duration
  const handleEventChange = (info) => settle(...fromInfo(info), info.revert);

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

  const api = () => cal.current?.getApi();

  return (
    <section className="panel cal" aria-label="Day calendar" hidden={hidden}>
      <div className="calh">
        <div className="acts">
          <button type="button" className="btn secondary icon" aria-label="Previous day" onClick={() => api()?.prev()}><Icon name="prev" /></button>
          <button type="button" className="btn secondary" onClick={() => api()?.today()}>Today</button>
          <button type="button" className="btn secondary icon" aria-label="Next day" onClick={() => api()?.next()}><Icon name="next" /></button>
        </div>
        <span className="t">{title}</span>
        <span className="calh-end" />
      </div>
      {prompt && (
        <div className="kp-overlap" role="alert">
          <span>"{prompt.title}" overlaps "{prompt.other}".</span>
          <button type="button" className="kp-overlap-use" onClick={() => { apply(prompt.taskId, prompt.hit.start, prompt.hit.end); setPrompt(null); }}>{prompt.hit.label}</button>
          <button type="button" className="kp-overlap-alt" onClick={() => { apply(prompt.taskId, ...prompt.requested); setPrompt(null); }}>Keep both</button>
          <button type="button" className="kp-overlap-alt" aria-label="Dismiss" onClick={() => setPrompt(null)}>Cancel</button>
        </div>
      )}
      <div className="calb">
      <FullCalendar
        ref={cal}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridDay"
        headerToolbar={false}
        dayHeaders={false}
        slotLabelContent={(arg) => arg.date.toLocaleTimeString('en-US', { hour: 'numeric' })}
        datesSet={(info) => setTitle(dayTitle(info.start))}
        slotDuration="01:00:00"
        slotLabelInterval="01:00:00"
        slotMinTime="00:00:00"
        slotMaxTime="24:00:00"
        scrollTime={scrollTime}
        snapDuration="00:05:00"
        allDaySlot={false}
        height="100%"
        nowIndicator={true}
        editable={true}
        eventOverlap={true}
        eventDurationEditable={true}
        eventStartEditable={true}
        dayMaxEvents={true}
        events={events}
        eventDrop={handleEventChange}
        eventResize={handleEventChange}
        eventContent={renderEvent}
        eventDidMount={handleEventDidMount}
      />
      </div>
    </section>
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
