// src/App.jsx
import React, { useState, useEffect } from 'react';
import KanbanBoard from './components/KanbanBoard.jsx';
import CalendarGrid from './components/CalendarGrid.jsx';

export default function App() {
    const [layoutMode, setLayoutMode] = useState('split');

    const [columns, setColumns] = useState([
        { id: 1, name: 'Backlog', wip_limit: null },
        { id: 2, name: 'Ready to Start', wip_limit: 3 },
        { id: 3, name: 'In Progress', wip_limit: 2 },
        { id: 4, name: 'Done', wip_limit: null }
    ]);

    const [tasks, setTasks] = useState([
        {
            id: 101,
            column_id: 1,
            title: 'Explore Cloudflare D1',
            description: 'Setup local wrangler DB',
            is_urgent: 0,
            is_important: 1,
            schedule_start: '2026-08-07T09:00:00Z',
            schedule_end: '2026-08-07T10:00:00Z'
        },
        {
            id: 102,
            column_id: 2,
            title: 'Fix Express Endpoint',
            description: 'Resolve WIP limit bug',
            is_urgent: 1,
            is_important: 1,
            schedule_start: '2026-08-07T10:00:00Z',
            schedule_end: '2026-08-07T11:00:00Z'
        },
        {
            id: 103,
            column_id: 2,
            title: 'Time-block Calendar',
            description: 'Add drag and drop grid',
            is_urgent: 0,
            is_important: 1,
            schedule_start: '2026-08-07T10:30:00Z',
            schedule_end: '2026-08-07T11:30:00Z'
        }
    ]);

    // Fetch initial columns and tasks from REST API
    useEffect(() => {
        fetch('/api/columns')
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => data && setColumns(data))
            .catch(() => console.log('Using local columns fallback'));

        fetch('/api/tasks')
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => data && setColumns && data.length > 0 && setTasks(data))
            .catch(() => console.log('Using local tasks fallback'));
    }, []);

    return (
        <div style={{ padding: '24px', fontFamily: 'Inter, system-ui, sans-serif', background: '#fffefb', minHeight: '100vh', color: '#201515' }}>
            {/* Header */}
            <header
                style={{
                    display: 'flex',
                    justify: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '16px',
                    marginBottom: '24px',
                    background: '#f8f4f0',
                    padding: '16px 24px',
                    borderRadius: '12px',
                    border: '1px solid #c5c0b1'
                }}
            >
                <div>
                    <h1 style={{ margin: 0, fontSize: '1.5em', color: '#201515', fontWeight: '700', letterSpacing: '-0.5px' }}>
                        🎯 KanPlan
                    </h1>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.9em', color: '#605d52' }}>
                        Agile Kanban WIP Limits + Calendar Time Blocking
                    </p>
                </div>

                {/* View Mode Toggle */}
                <div style={{ display: 'flex', gap: '4px', background: '#fffefb', padding: '4px', borderRadius: '12px', border: '1px solid #c5c0b1' }}>
                    <button
                        onClick={() => setLayoutMode('split')}
                        style={{
                            border: 'none',
                            background: layoutMode === 'split' ? '#ff4f00' : 'transparent',
                            color: layoutMode === 'split' ? '#fffefb' : '#201515',
                            fontWeight: '600',
                            padding: '8px 16px',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            fontSize: '0.85em',
                            transition: 'background 0.2s'
                        }}
                    >
                        📊 Split View
                    </button>
                    <button
                        onClick={() => setLayoutMode('kanban')}
                        style={{
                            border: 'none',
                            background: layoutMode === 'kanban' ? '#ff4f00' : 'transparent',
                            color: layoutMode === 'kanban' ? '#fffefb' : '#201515',
                            fontWeight: '600',
                            padding: '8px 16px',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            fontSize: '0.85em',
                            transition: 'background 0.2s'
                        }}
                    >
                        📋 Kanban Only
                    </button>
                    <button
                        onClick={() => setLayoutMode('calendar')}
                        style={{
                            border: 'none',
                            background: layoutMode === 'calendar' ? '#ff4f00' : 'transparent',
                            color: layoutMode === 'calendar' ? '#fffefb' : '#201515',
                            fontWeight: '600',
                            padding: '8px 16px',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            fontSize: '0.85em',
                            transition: 'background 0.2s'
                        }}
                    >
                        📅 Calendar Only
                    </button>
                </div>
            </header>

            {/* Main Workspace */}
            <main style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
                {(layoutMode === 'split' || layoutMode === 'kanban') && (
                    <div style={{ flex: layoutMode === 'split' ? 1.4 : 1 }}>
                        <KanbanBoard tasks={tasks} setTasks={setTasks} columns={columns} setColumns={setColumns} />
                    </div>
                )}

                {(layoutMode === 'split' || layoutMode === 'calendar') && (
                    <div style={{ flex: layoutMode === 'split' ? 1 : 1 }}>
                        <CalendarGrid tasks={tasks} />
                    </div>
                )}
            </main>
        </div>
    );
}
