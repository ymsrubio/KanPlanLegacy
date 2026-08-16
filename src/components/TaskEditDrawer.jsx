// src/components/TaskEditDrawer.jsx
// Right-side slide-over drawer for editing task details, priority levels, due dates, and schedule time blocks.

import React, { useState, useEffect } from 'react';
import { getTodayDateString, getCurrentRoundedTime, generate5MinTimeOptions } from '../lib/time-utils.js';

export default function TaskEditDrawer({ isOpen, onClose, onSave, task, projects = [] }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState('');
  const [urgencyLevel, setUrgencyLevel] = useState(3);
  const [importanceLevel, setImportanceLevel] = useState(3);
  const [deadline, setDeadline] = useState('');

  // Schedule state
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduleDate, setScheduleDate] = useState(getTodayDateString());
  const [startTime, setStartTime] = useState(getCurrentRoundedTime());
  const [durationMinutes, setDurationMinutes] = useState('60');

  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setProjectId(task.project_id ? String(task.project_id) : '');
      setUrgencyLevel(task.urgency_level || (task.is_urgent ? 4 : 2));
      setImportanceLevel(task.importance_level || (task.is_important ? 4 : 2));
      setDeadline(task.deadline || '');

      const hasStart = Boolean(task.schedule_start);
      setIsScheduled(hasStart);

      if (hasStart) {
        setScheduleDate(task.schedule_start.split('T')[0] || getTodayDateString());
        setStartTime(task.schedule_start.split('T')[1]?.substring(0, 5) || getCurrentRoundedTime());

        if (task.schedule_end) {
          const startMs = new Date(task.schedule_start).getTime();
          const endMs = new Date(task.schedule_end).getTime();
          const diffMins = Math.round((endMs - startMs) / (60 * 1000));
          if (diffMins > 0) {
            setDurationMinutes(String(diffMins));
          }
        }
      } else {
        setScheduleDate(getTodayDateString());
        setStartTime(getCurrentRoundedTime());
        setDurationMinutes('60');
      }
    }
  }, [task]);

  if (!isOpen || !task) return null;

  const priorityScore = urgencyLevel * importanceLevel;
  const timeOptions = generate5MinTimeOptions();

  const handleSubmit = (e) => {
    e.preventDefault();

    let computedStart = null;
    let computedEnd = null;

    if (isScheduled && scheduleDate && startTime) {
      computedStart = `${scheduleDate}T${startTime}:00`;
      const [startH, startM] = startTime.split(':').map(Number);
      const startObj = new Date(scheduleDate);
      startObj.setHours(startH, startM, 0, 0);

      const endObj = new Date(startObj.getTime() + Number(durationMinutes) * 60 * 1000);
      const endY = endObj.getFullYear();
      const endM = String(endObj.getMonth() + 1).padStart(2, '0');
      const endD = String(endObj.getDate()).padStart(2, '0');
      const endHStr = String(endObj.getHours()).padStart(2, '0');
      const endMinStr = String(endObj.getMinutes()).padStart(2, '0');
      computedEnd = `${endY}-${endM}-${endD}T${endHStr}:${endMinStr}:00`;
    }

    onSave({
      ...task,
      title: title.trim(),
      description,
      project_id: projectId ? Number(projectId) : null,
      urgency_level: urgencyLevel,
      importance_level: importanceLevel,
      is_urgent: urgencyLevel >= 4 ? 1 : 0,
      is_important: importanceLevel >= 4 ? 1 : 0,
      priority_score: priorityScore,
      deadline: deadline || null,
      schedule_start: computedStart,
      schedule_end: computedEnd
    });
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
        justifyContent: 'flex-end',
        transition: 'opacity 0.2s ease'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fffefb',
          width: '100%',
          maxWidth: '440px',
          height: '100%',
          borderLeft: '2px solid #201515',
          padding: '28px 24px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-10px 0 30px rgba(32, 21, 21, 0.2)',
          color: '#201515'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #c5c0b1', paddingBottom: '16px' }}>
          <div>
            <span style={{ fontSize: '0.75em', fontWeight: '800', color: '#ff4f00', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Task Inspector
            </span>
            <h2 style={{ margin: '2px 0 0 0', fontSize: '1.25em', fontWeight: '800', color: '#201515' }}>
              ✏️ Edit Task
            </h2>
          </div>
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px', paddingRight: '4px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85em', fontWeight: '700', marginBottom: '6px', color: '#36342e' }}>
              Task Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #c5c0b1',
                outline: 'none',
                fontSize: '0.95em',
                fontWeight: '600',
                background: '#fffefb',
                color: '#201515',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85em', fontWeight: '700', marginBottom: '6px', color: '#36342e' }}>
              📁 Project / Category
            </label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
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
              <option value="">No Project (General)</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  ● {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85em', fontWeight: '700', marginBottom: '6px', color: '#36342e' }}>
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #c5c0b1',
                outline: 'none',
                fontSize: '0.9em',
                background: '#fffefb',
                color: '#201515',
                boxSizing: 'border-box',
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
            />
          </div>

          {/* Priority Score Summary Card */}
          <div style={{ background: '#f8f4f0', border: '1px solid #c5c0b1', borderRadius: '12px', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.85em', fontWeight: '700', color: '#201515' }}>Eisenhower Matrix</span>
              <span style={{ fontSize: '0.8em', fontWeight: '800', padding: '2px 8px', borderRadius: '10px', background: priorityScore >= 20 ? '#ffe4e6' : priorityScore >= 15 ? '#fff7ed' : priorityScore >= 10 ? '#fefce8' : '#f1f5f9', color: priorityScore >= 20 ? '#9f1239' : priorityScore >= 15 ? '#c2410c' : priorityScore >= 10 ? '#a16207' : '#334155' }}>
                Priority: {priorityScore}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8em', fontWeight: '600', marginBottom: '4px' }}>
                  <span>Urgency</span>
                  <span>{urgencyLevel} / 5</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={urgencyLevel}
                  onChange={(e) => setUrgencyLevel(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#ff4f00' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8em', fontWeight: '600', marginBottom: '4px' }}>
                  <span>Importance</span>
                  <span>{importanceLevel} / 5</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={importanceLevel}
                  onChange={(e) => setImportanceLevel(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#ff4f00' }}
                />
              </div>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85em', fontWeight: '700', marginBottom: '6px', color: '#36342e' }}>
              Due Date
            </label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #c5c0b1',
                outline: 'none',
                fontSize: '0.9em',
                background: '#fffefb',
                color: '#201515',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Scheduled Time Block Section */}
          <div style={{ background: '#f8f4f0', border: '1px solid #c5c0b1', borderRadius: '12px', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.85em', fontWeight: '700', color: '#201515' }}>⏱️ Scheduled Time Block</span>
              {isScheduled && (
                <button
                  type="button"
                  onClick={() => setIsScheduled(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#dc2626',
                    fontSize: '0.8em',
                    fontWeight: '700',
                    cursor: 'pointer',
                    padding: '2px 6px'
                  }}
                >
                  🚫 Clear Schedule
                </button>
              )}
            </div>

            {isScheduled ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8em', fontWeight: '600', marginBottom: '4px', color: '#36342e' }}>
                    Schedule Date
                  </label>
                  <input
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #c5c0b1',
                      background: '#fffefb',
                      color: '#201515',
                      fontSize: '0.9em',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.8em', fontWeight: '600', marginBottom: '4px', color: '#36342e' }}>
                      Start Time
                    </label>
                    <select
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid #c5c0b1',
                        background: '#fffefb',
                        color: '#201515',
                        fontSize: '0.9em',
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
                    <label style={{ display: 'block', fontSize: '0.8em', fontWeight: '600', marginBottom: '4px', color: '#36342e' }}>
                      Duration
                    </label>
                    <select
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid #c5c0b1',
                        background: '#fffefb',
                        color: '#201515',
                        fontSize: '0.9em',
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
              </div>
            ) : (
              <div>
                <p style={{ margin: '0 0 10px 0', fontSize: '0.85em', color: '#605d52' }}>
                  Not currently scheduled on calendar.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsScheduled(true);
                    setScheduleDate(getTodayDateString());
                    setStartTime(getCurrentRoundedTime());
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px dashed #ff4f00',
                    background: '#fffefb',
                    color: '#ff4f00',
                    fontWeight: '700',
                    cursor: 'pointer',
                    fontSize: '0.85em'
                  }}
                >
                  ⏱️ Add Time Block to Schedule
                </button>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid #c5c0b1' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '10px',
                border: '1px solid #c5c0b1',
                background: 'none',
                color: '#36342e',
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
                flex: 1,
                padding: '12px',
                borderRadius: '10px',
                border: 'none',
                background: '#ff4f00',
                color: '#fffefb',
                fontWeight: '700',
                cursor: 'pointer',
                fontSize: '0.9em',
                boxShadow: '0 2px 4px rgba(255, 79, 0, 0.2)'
              }}
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
