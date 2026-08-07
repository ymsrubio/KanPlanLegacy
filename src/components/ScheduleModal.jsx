// src/components/ScheduleModal.jsx
import React, { useState } from 'react';

export default function ScheduleModal({ isOpen, onClose, onConfirm, task }) {
  const todayStr = new Date().toISOString().split('T')[0];
  const [scheduleDate, setScheduleDate] = useState(todayStr);
  const [startTime, setStartTime] = useState('10:00');
  const [durationHours, setDurationHours] = useState('1');

  if (!isOpen || !task) return null;

  const handleSubmit = (e) => {
    e.preventDefault();

    // Construct local wall-clock ISO timestamps (no Z offset shift)
    const startIso = `${scheduleDate}T${startTime}:00`;
    const startHour = Number(startTime.split(':')[0]);
    const endHour = startHour + Number(durationHours);
    const endHourStr = String(endHour).padStart(2, '0');
    const endIso = `${scheduleDate}T${endHourStr}:00`;

    onConfirm(task, startIso, endIso);
  };

  const hoursList = Array.from({ length: 13 }, (_, i) => {
    const h = i + 8; // 8 AM to 8 PM
    const hStr = String(h).padStart(2, '0');
    const label = `${h > 12 ? h - 12 : h}:00 ${h >= 12 ? 'PM' : 'AM'}`;
    return { value: `${hStr}:00`, label };
  });

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        background: 'rgba(32, 21, 21, 0.4)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fffefb',
          border: '1px solid #c5c0b1',
          borderRadius: '16px',
          padding: '28px',
          width: '100%',
          maxWidth: '440px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)',
          color: '#201515'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ margin: 0, fontSize: '1.25em', fontWeight: '700', color: '#201515' }}>
            ⏱️ Schedule Time Block
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.2em',
              color: '#939084',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ background: '#f8f4f0', padding: '12px 16px', borderRadius: '10px', marginBottom: '20px', border: '1px solid #c5c0b1' }}>
          <div style={{ fontSize: '0.8em', color: '#605d52', fontWeight: '600', marginBottom: '2px' }}>Moving to Ready to Start:</div>
          <div style={{ fontWeight: '700', fontSize: '1.05em', color: '#201515' }}>{task.title}</div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85em', fontWeight: '600', marginBottom: '6px', color: '#36342e' }}>
              Schedule Date
            </label>
            <input
              type="date"
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #c5c0b1',
                outline: 'none',
                fontSize: '0.95em',
                background: '#fffefb',
                color: '#201515',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.85em', fontWeight: '600', marginBottom: '6px', color: '#36342e' }}>
                Start Time
              </label>
              <select
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid #c5c0b1',
                  background: '#fffefb',
                  color: '#201515',
                  fontSize: '0.95em',
                  boxSizing: 'border-box'
                }}
              >
                {hoursList.map((h) => (
                  <option key={h.value} value={h.value}>
                    {h.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.85em', fontWeight: '600', marginBottom: '6px', color: '#36342e' }}>
                Duration
              </label>
              <select
                value={durationHours}
                onChange={(e) => setDurationHours(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid #c5c0b1',
                  background: '#fffefb',
                  color: '#201515',
                  fontSize: '0.95em',
                  boxSizing: 'border-box'
                }}
              >
                <option value="1">1 Hour</option>
                <option value="2">2 Hours</option>
                <option value="3">3 Hours</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'none',
                border: '1px solid #c5c0b1',
                color: '#36342e',
                padding: '10px 18px',
                borderRadius: '10px',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '0.9em'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                background: '#ff4f00',
                color: '#fffefb',
                border: 'none',
                padding: '10px 22px',
                borderRadius: '10px',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '0.9em',
                boxShadow: '0 2px 4px rgba(255, 79, 0, 0.2)'
              }}
            >
              ⏱️ Confirm Schedule
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
