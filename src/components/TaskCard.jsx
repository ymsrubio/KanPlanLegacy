// src/components/TaskCard.jsx
import React from 'react';
import { Draggable } from '@hello-pangea/dnd';

export default function TaskCard({ task, index }) {
  const urgency = task.urgency_level || (task.is_urgent ? 4 : 2);
  const importance = task.importance_level || (task.is_important ? 4 : 2);
  const priorityScore = task.priority_score || (urgency * importance);

  const getBadge = () => {
    if (priorityScore >= 16) return { label: `🔥 Priority: ${priorityScore}`, bg: '#ffe4e6', color: '#9f1239' };
    if (priorityScore >= 10) return { label: `⚡ Priority: ${priorityScore}`, bg: '#e0e7ff', color: '#3730a3' };
    return { label: `📥 Priority: ${priorityScore}`, bg: '#f1f5f9', color: '#334155' };
  };

  const formatSchedule = () => {
    if (!task.schedule_start) return null;
    const startHour = Number(task.schedule_start.split('T')[1]?.split(':')[0]);
    const startMin = task.schedule_start.split('T')[1]?.split(':')[1] || '00';
    const startLabel = `${startHour > 12 ? startHour - 12 : startHour || 12}:${startMin} ${startHour >= 12 ? 'PM' : 'AM'}`;

    if (!task.schedule_end) return `⏱️ ${startLabel}`;

    const endHour = Number(task.schedule_end.split('T')[1]?.split(':')[0]);
    const endMin = task.schedule_end.split('T')[1]?.split(':')[1] || '00';
    const endLabel = `${endHour > 12 ? endHour - 12 : endHour || 12}:${endMin} ${endHour >= 12 ? 'PM' : 'AM'}`;

    return `⏱️ ${startLabel} - ${endLabel}`;
  };

  const badge = getBadge();
  const scheduleTimeLabel = formatSchedule();

  // FullCalendar external drag data — encoded as data-event JSON
  const fcEventData = JSON.stringify({
    id: String(task.id),
    title: task.title,
    duration: '01:00',
    extendedProps: {
      taskId: task.id,
      description: task.description,
      column_id: task.column_id
    }
  });

  return (
    <Draggable draggableId={String(task.id)} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className="kanban-task-card"
          data-event={fcEventData}
          data-task-id={task.id}
          style={{
            background: snapshot.isDragging ? '#f3ede6' : '#ffffff',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '10px',
            boxShadow: snapshot.isDragging
              ? '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
              : '0 1px 3px rgba(0,0,0,0.08)',
            border: snapshot.isDragging ? '2px solid #ff4f00' : '1px solid #c5c0b1',
            cursor: 'grab',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            transition: 'background 0.2s, border 0.2s',
            ...provided.draggableProps.style
          }}
        >
          <div style={{ fontWeight: '600', marginBottom: '4px', color: '#201515', fontSize: '0.9em' }}>{task.title}</div>
          {task.description && (
            <div style={{ fontSize: '0.82em', color: '#605d52', marginBottom: '8px' }}>
              {task.description}
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px' }}>
            <span
              style={{
                display: 'inline-block',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '0.75em',
                fontWeight: '700',
                background: badge.bg,
                color: badge.color
              }}
            >
              {badge.label}
            </span>
            {scheduleTimeLabel && (
              <span style={{ fontSize: '0.75em', color: '#ff4f00', fontWeight: '700', background: '#fff1f2', padding: '2px 6px', borderRadius: '6px', border: '1px solid #fecdd3' }}>
                {scheduleTimeLabel}
              </span>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
}
