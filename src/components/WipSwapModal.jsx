// src/components/WipSwapModal.jsx
import React from 'react';

export default function WipSwapModal({ isOpen, onClose, onSwap, readyTasks, pendingTask }) {
  if (!isOpen || !pendingTask) return null;

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
          maxWidth: '480px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)',
          color: '#201515'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ margin: 0, fontSize: '1.2em', fontWeight: '700', color: '#201515' }}>
            🔄 Swap Task to Make Room
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

        {/* Explanation */}
        <div
          style={{
            background: '#fff1f2',
            border: '1px solid #fecdd3',
            borderRadius: '10px',
            padding: '12px 16px',
            marginBottom: '20px',
            fontSize: '0.85em',
            color: '#991b1b'
          }}
        >
          <strong>⚠️ Ready to Start is at capacity!</strong>
          <br />
          Choose a task below to move back to Backlog, making room for{' '}
          <strong>"{pendingTask.title}"</strong>.
        </div>

        {/* Task list to swap */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
          {readyTasks.map((task) => (
            <button
              key={task.id}
              onClick={() => onSwap(task.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                background: '#fffefb',
                border: '1px solid #c5c0b1',
                borderRadius: '10px',
                padding: '12px 16px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'border-color 0.15s, background 0.15s',
                width: '100%'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#ff4f00';
                e.currentTarget.style.background = '#f8f4f0';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#c5c0b1';
                e.currentTarget.style.background = '#fffefb';
              }}
            >
              <span style={{ fontSize: '1.2em' }}>↩️</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600', fontSize: '0.92em', color: '#201515' }}>
                  {task.title}
                </div>
                {task.description && (
                  <div style={{ fontSize: '0.78em', color: '#605d52', marginTop: '2px' }}>
                    {task.description}
                  </div>
                )}
                {task.schedule_start && (
                  <div style={{ fontSize: '0.75em', color: '#ff4f00', fontWeight: '600', marginTop: '4px' }}>
                    ⏱️ Scheduled
                  </div>
                )}
              </div>
              <span
                style={{
                  fontSize: '0.75em',
                  fontWeight: '700',
                  color: '#ff4f00',
                  background: '#fff1f2',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  border: '1px solid #fecdd3',
                  whiteSpace: 'nowrap'
                }}
              >
                Move to Backlog
              </span>
            </button>
          ))}
        </div>

        {/* Cancel */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
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
        </div>
      </div>
    </div>
  );
}
