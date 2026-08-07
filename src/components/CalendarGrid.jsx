// src/components/CalendarGrid.jsx
import React, { useState } from 'react';

export default function CalendarGrid({ tasks }) {
  const [viewMode, setViewMode] = useState('day');
  const hours = Array.from({ length: 13 }, (_, i) => i + 8);

  const checkOverlap = (task) => {
    if (!task.schedule_start || !task.schedule_end) return false;
    const start = new Date(task.schedule_start).getTime();
    const end = new Date(task.schedule_end).getTime();

    return tasks.some((other) => {
      if (other.id === task.id || !other.schedule_start || !other.schedule_end) return false;
      const otherStart = new Date(other.schedule_start).getTime();
      const otherEnd = new Date(other.schedule_end).getTime();
      return start < otherEnd && end > otherStart;
    });
  };

  return (
    <div
      style={{
        background: '#f8f4f0',
        borderRadius: '12px',
        border: '1px solid #c5c0b1',
        padding: '20px',
        flex: 1,
        minWidth: '320px'
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '16px',
          paddingBottom: '12px',
          borderBottom: '1px solid #c5c0b1'
        }}
      >
        <h2 style={{ margin: 0, fontSize: '1.1em', color: '#201515', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
          📅 Time Blocking Calendar
        </h2>
        <div style={{ display: 'flex', gap: '4px', background: '#fffefb', padding: '3px', borderRadius: '8px', border: '1px solid #c5c0b1' }}>
          <button
            onClick={() => setViewMode('day')}
            style={{
              border: 'none',
              background: viewMode === 'day' ? '#201515' : 'transparent',
              color: viewMode === 'day' ? '#fffefb' : '#201515',
              fontWeight: viewMode === 'day' ? '600' : 'normal',
              padding: '4px 12px',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Day
          </button>
          <button
            onClick={() => setViewMode('week')}
            style={{
              border: 'none',
              background: viewMode === 'week' ? '#201515' : 'transparent',
              color: viewMode === 'week' ? '#fffefb' : '#201515',
              fontWeight: viewMode === 'week' ? '600' : 'normal',
              padding: '4px 12px',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Week
          </button>
        </div>
      </div>

      {/* Hourly Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '500px', overflowY: 'auto' }}>
        {hours.map((hour) => {
          const timeLabel = `${hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? 'PM' : 'AM'}`;

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
                borderBottom: '1px solid #e5e0d8',
                alignItems: 'center'
              }}
            >
              <div style={{ width: '70px', fontSize: '0.75em', color: '#605d52', fontWeight: '600' }}>
                {timeLabel}
              </div>
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  gap: '8px',
                  minHeight: '36px',
                  alignItems: 'center',
                  background: scheduledTasks.length > 0 ? '#fffefb' : 'transparent',
                  borderRadius: '6px',
                  padding: '2px 8px'
                }}
              >
                {scheduledTasks.map((t) => {
                  const isOverlapping = checkOverlap(t);
                  const isDone = t.column_id === 4;

                  return (
                    <div
                      key={t.id}
                      style={{
                        background: isDone ? '#ecfdf5' : isOverlapping ? '#fff1f2' : '#fffefb',
                        border: isDone
                          ? '1px solid #a7f3d0'
                          : isOverlapping
                          ? '2px solid #ff4f00'
                          : '1px solid #201515',
                        color: isDone ? '#047857' : isOverlapping ? '#991b1b' : '#201515',
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
