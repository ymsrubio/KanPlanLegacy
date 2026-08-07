// src/App.jsx
import React from 'react';
import KanbanBoard from './components/KanbanBoard';

export default function App() {
    return (
        <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
            <h1>🎯 KanPlan</h1>
            <p>Agile Kanban + Calendar Time Blocking</p>
            <KanbanBoard></KanbanBoard>
        </div>
    );
}
