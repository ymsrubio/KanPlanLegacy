// src/components/TaskCard.jsx
import React, { useState } from 'react';
import { Draggable } from '@hello-pangea/dnd';

export default function TaskCard({ task, index, onDelete, onEdit }) {
  const [hovered, setHovered] = useState(false);
  const urgency = task.urgency_level || (task.is_urgent ? 4 : 2);
  const importance = task.importance_level || (task.is_important ? 4 : 2);
  const priorityScore = task.priority_score || (urgency * importance);

  const getBadge = () => {
    if (priorityScore >= 20) return { label: `🔥 Critical: ${priorityScore}`, bg: '#ffe4e6', color: '#9f1239', border: '#e11d48', tint: '#fff1f2' };
    if (priorityScore >= 15) return { label: `🔶 High: ${priorityScore}`, bg: '#fff7ed', color: '#c2410c', border: '#f97316', tint: '#fff7ed' };
    if (priorityScore >= 10) return { label: `⚡ Medium: ${priorityScore}`, bg: '#fefce8', color: '#a16207', border: '#eab308', tint: '#fefce8' };
    return { label: `📥 Low: ${priorityScore}`, bg: '#f1f5f9', color: '#334155', border: '#94a3b8', tint: '#ffffff' };
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

  const handleDragStart = (e) => {
    if (e.dataTransfer) {
      const img = new Image();
      img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
      e.dataTransfer.setDragImage(img, 0, 0);
    }
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    if (onDelete) onDelete(task.id, task.title);
  };

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
          onDragStart={handleDragStart}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            background: snapshot.isDragging ? '#ffffff' : badge.tint,
            opacity: 1,
            borderRadius: '8px',
            padding: '12px',
            paddingLeft: '16px',
            marginBottom: '10px',
            boxShadow: snapshot.isDragging
              ? '0 14px 28px rgba(32, 21, 21, 0.22), 0 6px 10px rgba(32, 21, 21, 0.14)'
              : '0 1px 3px rgba(0,0,0,0.08)',
            borderLeft: `4px solid ${badge.border}`,
            borderTop: snapshot.isDragging ? '2px solid #ff4f00' : '1px solid #c5c0b1',
            borderRight: snapshot.isDragging ? '2px solid #ff4f00' : '1px solid #c5c0b1',
            borderBottom: snapshot.isDragging ? '2px solid #ff4f00' : '1px solid #c5c0b1',
            cursor: 'grab',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            zIndex: snapshot.isDragging ? 99999 : 'auto',
            transition: 'box-shadow 0.2s, border 0.2s, background 0.2s',
            position: 'relative',
            ...provided.draggableProps.style
          }}
        >
          {/* Hover Action Buttons */}
          {hovered && (
            <div style={{ position: 'absolute', top: '6px', right: '6px', display: 'flex', gap: '4px' }}>
              {onEdit && (
                <button
                  onClick={(e) => { e.stopPropagation(); onEdit(task); }}
                  title="Edit task"
                  style={{
                    background: '#e0e7ff',
                    border: '1px solid #c7d2fe',
                    borderRadius: '6px',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: '0.75em',
                    color: '#3730a3',
                    padding: 0,
                    lineHeight: 1
                  }}
                >
                  ✏️
                </button>
              )}
              {onDelete && (
                <button
                  onClick={handleDeleteClick}
                  title="Delete task"
                  style={{
                    background: '#fee2e2',
                    border: '1px solid #fecaca',
                    borderRadius: '6px',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: '0.75em',
                    color: '#dc2626',
                    padding: 0,
                    lineHeight: 1
                  }}
                >
                  🗑️
                </button>
              )}
            </div>
          )}

          <div style={{ fontWeight: '600', marginBottom: '4px', color: '#201515', fontSize: '0.9em', paddingRight: hovered ? '28px' : '0' }}>{task.title}</div>
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

            {task.deadline && (
              <span
                style={{
                  display: 'inline-block',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '0.75em',
                  fontWeight: '600',
                  background: '#f1f5f9',
                  color: '#475569',
                  border: '1px solid #cbd5e1'
                }}
              >
                📅 Due: {task.deadline}
              </span>
            )}

            {/* Dedicated handle for dragging directly onto FullCalendar */}
            <span
              className="fc-drag-handle"
              data-event={fcEventData}
              title="Drag onto Calendar to time-block"
              style={{
                fontSize: '0.75em',
                color: '#ff4f00',
                fontWeight: '700',
                background: scheduleTimeLabel ? '#fff1f2' : '#fff8f5',
                padding: '2px 8px',
                borderRadius: '6px',
                border: '1px solid #fecdd3',
                cursor: 'grab'
              }}
            >
              {scheduleTimeLabel || '⏱️ Schedule'}
            </span>
          </div>
        </div>
      )}
    </Draggable>
  );
}
