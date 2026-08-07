// src/components/TaskCard.jsx
import React from 'react';
import { Draggable } from '@hello-pangea/dnd';

export default function TaskCard({ task, index }) {
  const getBadge = () => {
    if (task.is_urgent && task.is_important) return { label: '🔥 Do First', bg: '#fee2e2', color: '#991b1b' };
    if (!task.is_urgent && task.is_important) return { label: '📅 Schedule', bg: '#dbeafe', color: '#1e40af' };
    if (task.is_urgent && !task.is_important) return { label: '⚡ Delegate', bg: '#fef3c7', color: '#92400e' };
    return { label: '📥 Backlog', bg: '#f3f4f6', color: '#374151' };
  };

  const badge = getBadge();

  return (
    <Draggable draggableId={String(task.id)} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{
            background: snapshot.isDragging ? '#f0f9ff' : '#ffffff',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '10px',
            boxShadow: snapshot.isDragging
              ? '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
              : '0 1px 3px rgba(0,0,0,0.1)',
            border: snapshot.isDragging ? '2px solid #3b82f6' : '1px solid #e2e8f0',
            cursor: 'grab',
            transition: 'background 0.2s, border 0.2s',
            ...provided.draggableProps.style
          }}
        >
          <div style={{ fontWeight: '600', marginBottom: '4px', color: '#0f172a' }}>{task.title}</div>
          {task.description && (
            <div style={{ fontSize: '0.85em', color: '#64748b', marginBottom: '8px' }}>
              {task.description}
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span
              style={{
                display: 'inline-block',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '0.75em',
                fontWeight: '600',
                background: badge.bg,
                color: badge.color
              }}
            >
              {badge.label}
            </span>
            {task.schedule_start && (
              <span style={{ fontSize: '0.75em', color: '#3b82f6', fontWeight: '500' }}>
                ⏱️ Scheduled
              </span>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
}
