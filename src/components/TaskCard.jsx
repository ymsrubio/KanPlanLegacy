// src/components/TaskCard.jsx
import React from 'react';

export default function TaskCard({ task }) {
    // Helper to determine Eisenhower Quadrant badge
    const getBadge = () => {
        if (task.is_urgent && task.is_important) return { label: '🔥 Do First', bg: '#fee2e2', color: '#991b1b' };
        if (!task.is_urgent && task.is_important) return { label: '📅 Schedule', bg: '#dbeafe', color: '#1e40af' };
        if (task.is_urgent && !task.is_important) return { label: '⚡ Delegate', bg: '#fef3c7', color: '#92400e' };
        return { label: '📥 Backlog', bg: '#f3f4f6', color: '#374151' };
    };

    const badge = getBadge();

    return (
        <div
            style={{
                background: '#ffffff',
                borderRadius: '6px',
                padding: '12px',
                marginBottom: '10px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                border: '1px solid #e5e7eb'
            }}
        >
            <div style={{ fontWeight: '600', marginBottom: '4px' }}>{task.title}</div>
            {task.description && (
                <div style={{ fontSize: '0.85em', color: '#6b7280', marginBottom: '8px' }}>
                    {task.description}
                </div>
            )}
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
        </div>
    );
}
