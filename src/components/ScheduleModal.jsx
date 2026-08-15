// src/components/ScheduleModal.jsx
import React, { useState, useEffect } from 'react';
import { getTodayDateString, getCurrentRoundedTime, generate5MinTimeOptions } from '../lib/time-utils.js';

export default function ScheduleModal({ isOpen, onClose, onConfirm, task }) {
  const [scheduleDate, setScheduleDate] = useState(getTodayDateString());
  const [startTime, setStartTime] = useState(getCurrentRoundedTime());
  const [durationMinutes, setDurationMinutes] = useState('60');

  useEffect(() => {
    if (isOpen) {
      setScheduleDate(getTodayDateString());
      setStartTime(getCurrentRoundedTime());
    }
  }, [isOpen]);

  if (!isOpen || !task) return null;

  const timeOptions = generate5MinTimeOptions();

  const handleSubmit = (e) => {
    e.preventDefault();

    // Construct local wall-clock ISO timestamps with 5-min accuracy
    const startIso = `${scheduleDate}T${startTime}:00`;
    const [startH, startM] = startTime.split(':').map(Number);
    const startDateObj = new Date(scheduleDate);
    startDateObj.setHours(startH, startM, 0, 0);

    const endDateObj = new Date(startDateObj.getTime() + Number(durationMinutes) * 60 * 1000);
    const endY = endDateObj.getFullYear();
    const endM = String(endDateObj.getMonth() + 1).padStart(2, '0');
    const endD = String(endDateObj.getDate()).padStart(2, '0');
    const endHStr = String(endDateObj.getHours()).padStart(2, '0');
    const endMinStr = String(endDateObj.getMinutes()).padStart(2, '0');

    const endIso = `${endY}-${endM}-${endD}T${endHStr}:${endMinStr}:00`;

    onConfirm(task, startIso, endIso);
  };

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
                {timeOptions.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.85em', fontWeight: '600', marginBottom: '6px', color: '#36342e' }}>
                Duration
              </label>
              <select
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
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
                <option value="15">15 Minutes</option>
                <option value="30">30 Minutes</option>
                <option value="45">45 Minutes</option>
                <option value="60">1 Hour</option>
                <option value="120">2 Hours</option>
                <option value="180">3 Hours</option>
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
