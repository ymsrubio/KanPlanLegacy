// src/components/KanbanBoard.jsx
import React, { useState } from 'react';

export default function KanbanBoard() {
    // 1. Initial State: The 4 default columns with WIP limits
    const [columns] = useState([
        { id: 1, name: 'Backlog', wip_limit: null },
        { id: 2, name: 'Ready to Start', wip_limit: 3 },
        { id: 3, name: 'In Progress', wip_limit: 2 },
        { id: 4, name: 'Done', wip_limit: null }
    ]);

    return (
        <div style={{ display: 'flex', gap: '16px', padding: '16px' }}>
            {columns.map((col) => (
                <div
                    key={col.id}
                    style={{
                        background: '#f3f4f6',
                        borderRadius: '8px',
                        padding: '16px',
                        minWidth: '220px',
                        border: '1px solid #e5e7eb'
                    }}
                >
                    <h3>
                        {col.name}{' '}
                        <span style={{ fontSize: '0.8em', color: '#6b7280' }}>
                            {col.wip_limit ? `(Max: ${col.wip_limit})` : '(∞)'}
                        </span>
                    </h3>
                </div>
            ))}
        </div>
    );
}
