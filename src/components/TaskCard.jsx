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

  const badge = getBadge();

  return (
    <Draggable draggableId={String(task.id)} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
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
            {task.schedule_start && (
              <span style={{ fontSize: '0.75em', color: '#ff4f00', fontWeight: '600' }}>
                ⏱️ Scheduled
              </span>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
}
