// src/components/Toast.jsx
import React from 'react';

export default function Toast({ message }) {
  if (!message) return null;

  const isSuccess = message.startsWith('✅');

  return (
    <div
      style={{
        position: 'fixed',
        top: '24px',
        right: '24px',
        zIndex: 9999,
        background: isSuccess ? '#ecfdf5' : '#fff1f2',
        border: `1px solid ${isSuccess ? '#a7f3d0' : '#fecdd3'}`,
        borderLeft: `5px solid ${isSuccess ? '#059669' : '#ff4f00'}`,
        color: isSuccess ? '#065f46' : '#201515',
        padding: '14px 20px',
        borderRadius: '12px',
        fontWeight: '600',
        fontSize: '0.92em',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        animation: 'slideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        maxWidth: '380px'
      }}
    >
      <span>{message}</span>
    </div>
  );
}
