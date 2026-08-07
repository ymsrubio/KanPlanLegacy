// src/components/CalendarGrid.jsx
import React, { useState } from 'react';

export default function CalendarGrid({ tasks, onScheduleTask }) {
  const [viewMode, setViewMode] = useState('day'); // 'day' or 'week'

  // Time slots from 8 AM to 8 PM
  const hours = Array.from({ length: 13 }, (_, i) => i + 8);

  // Helper to detect schedule overlaps
  const checkOverlap = (task) => {
    if (!task.schedule_start || !task.schedule_end) return false;

    const start = new Date(task.schedule_start).getTime();
    const end = new Date(task.schedule_end).getTime();

    return tasks.some((other) => {
      if (other.id === task.id || !other.schedule_start || !other.schedule_end) return false;
      const otherStart = new Date(other.schedule_start).getTime();
      const otherEnd = new Date(other.schedule_end).getTime();

      // Overlap condition: start < otherEnd && end > otherStart
      return start < otherEnd && end > otherStart;
    });
  };

  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: '10px',
        border: '1px solid #e2e8f0',
        padding: '16px',
        flex: 1,
        minWidth: '320px'
      }}
    >
      {/* Header & View Mode Switcher */}
      <div
        style={{
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
          paddingBottom: '12px',
          borderBottom: '1px solid #f1f5f9'
        }}
      >
        <h2 style={{ margin: 0, fontSize: '1.1em', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
          📅 Time Blocking Calendar
        </h2>
        <div style={{ display: 'flex', gap: '4px', background: '#f1f5f9', padding: '3px', borderRadius: '6px' }}>
          <button
            onClick={() => setViewMode('day')}
            style={{
              border: 'none',
              background: viewMode === 'day' ? '#ffffff' : 'transparent',
              color: viewMode === 'day' ? '#0f172a' : '#64748b',
              fontWeight: viewMode === 'day' ? '600' : 'normal',
              padding: '4px 12px',
              borderRadius: '4px',
              cursor: 'pointer',
              boxShadow: viewMode === 'day' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
            }}
          >
            Day
          </button>
          <button
            onClick={() => setViewMode('week')}
            style={{
              border: 'none',
              background: viewMode === 'week' ? '#ffffff' : 'transparent',
              color: viewMode === 'week' ? '#0f172a' : '#64748b',
              fontWeight: viewMode === 'week' ? '600' : 'normal',
              padding: '4px 12px',
              borderRadius: '4px',
              cursor: 'pointer',
              boxShadow: viewMode === 'week' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
            }}
          >
            Week
          </button>
        </div>
      </div>

      {/* Hourly Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '500px', overflowY: 'auto' }}>
        {hours.map((hour) => {
          const timeLabel = `${hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? 'PM' : 'AM'}`;

          // Find tasks scheduled during this hour slot
          const scheduledTasks = tasks.filter((t) => {
            if (!t.schedule_start) return false;
            const taskHour = new Date(t.schedule_start).getHours();
            return taskHour === hour;
          });

          return (
            <div
              key={hour}
              style={{
                display: 'flex',
                minHeight: '44px',
                borderBottom: '1px solid #f1f5f9',
                alignItems: 'center'
              }}
            >
              <div style={{ width: '70px', fontSize: '0.75em', color: '#94a3b8', fontWeight: '500' }}>
                {timeLabel}
              </div>
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  gap: '8px',
                  minHeight: '36px',
                  alignItems: 'center',
                  background: scheduledTasks.length > 0 ? '#f8fafc' : 'transparent',
                  borderRadius: '4px',
                  padding: '2px 8px'
                }}
              >
                {scheduledTasks.map((t) => {
                  const isOverlapping = checkOverlap(t);
                  const isDone = t.column_id === 4; // Done column

                  return (
                    <div
                      key={t.id}
                      style={{
                        background: isDone ? '#ecfdf5' : isOverlapping ? '#fef2f2' : '#eff6ff',
                        border: isDone
                          ? '1px solid #a7f3d0'
                          : isOverlapping
                          ? '2px solid #ef4444'
                          : '1px solid #bfdbfe',
                        color: isDone ? '#047857' : isOverlapping ? '#991b1b' : '#1e40af',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '0.8em',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      {isOverlapping && <span title="Schedule Overlap Warning!">⚠️</span>}
                      {isDone && <span>✅</span>}
                      <span>{t.title}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
