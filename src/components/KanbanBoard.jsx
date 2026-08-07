// src/components/KanbanBoard.jsx
import React, { useState } from 'react';
import TaskCard from './TaskCard.jsx';


export default function KanbanBoard() {
    // 1. Initial State: The 4 default columns with WIP limits
    const [columns] = useState([
        { id: 1, name: 'Backlog', wip_limit: null },
        { id: 2, name: 'Ready to Start', wip_limit: 3 },
        { id: 3, name: 'In Progress', wip_limit: 2 },
        { id: 4, name: 'Done', wip_limit: null }
    ]);

    // Mock tasks state
    const [tasks] = useState([
        { id: 101, column_id: 1, title: 'Explore Cloudflare D1', description: 'Setup local wrangler DB', is_urgent: 0, is_important: 1 },
        { id: 102, column_id: 2, title: 'Fix Express Endpoint', description: 'Resolve WIP limit bug', is_urgent: 1, is_important: 1 },
        { id: 103, column_id: 2, title: 'Time-block Calendar', description: 'Add drag and drop grid', is_urgent: 0, is_important: 1 }
    ]);

    return (
        <div style={{ display: 'flex', gap: '16px', padding: '16px' }}>
            {columns.map((col) => {
                const colTasks = tasks.filter((t) => t.column_id === col.id);

                return (
                    <div
                        key={col.id}
                        style={{
                            background: '#f8fafc',
                            borderRadius: '8px',
                            padding: '16px',
                            minWidth: '240px',
                            border: '1px solid #e2e8f0'
                        }}
                    >
                        <h3 style={{ marginTop: 0, marginBottom: '12px', fontSize: '1em' }}>
                            {col.name}{' '}
                            <span style={{ fontSize: '0.8em', color: '#64748b' }}>
                                ({colTasks.length}/{col.wip_limit ?? '∞'})
                            </span>
                        </h3>

                        {/* Render Task Cards */}
                        {colTasks.map((task) => (
                            <TaskCard key={task.id} task={task} />
                        ))}
                    </div>
                );
            })}
        </div>
    );
}
