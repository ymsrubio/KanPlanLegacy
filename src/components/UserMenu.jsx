// src/components/UserMenu.jsx
// Header user avatar + name with logout dropdown.

import React, { useState, useRef, useEffect } from 'react';

export default function UserMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={menuRef} style={{ position: 'relative' }}>
      <button
        id="user-menu-button"
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: 'transparent',
          border: '1px solid #c5c0b1',
          borderRadius: '12px',
          padding: '6px 14px 6px 6px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          color: '#201515'
        }}
      >
        {user.avatar_url ? (
          <img
            src={user.avatar_url}
            alt={user.name}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '2px solid #ff4f00'
            }}
          />
        ) : (
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: '#ff4f00',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fffefb',
              fontWeight: '700',
              fontSize: '0.85em'
            }}
          >
            {user.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
        )}
        <span style={{ fontWeight: '600', fontSize: '0.85em' }}>
          {user.name}
        </span>
        <svg
          width="12" height="12" viewBox="0 0 12 12"
          style={{
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease'
          }}
        >
          <path d="M2 4l4 4 4-4" stroke="#605d52" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            background: '#fffefb',
            border: '1px solid #c5c0b1',
            borderRadius: '12px',
            padding: '8px',
            minWidth: '180px',
            boxShadow: '0 8px 24px rgba(32,21,21,0.12)',
            zIndex: 1000,
            animation: 'fadeIn 0.15s ease'
          }}
        >
          {/* User info */}
          <div style={{ padding: '8px 12px', borderBottom: '1px solid #e8e4de', marginBottom: '4px' }}>
            <div style={{ fontWeight: '600', fontSize: '0.85em', color: '#201515' }}>{user.name}</div>
            <div style={{ fontSize: '0.75em', color: '#605d52', marginTop: '2px' }}>{user.email}</div>
          </div>

          {/* Sign out button */}
          <button
            id="logout-button"
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              width: '100%',
              background: 'transparent',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 12px',
              cursor: 'pointer',
              fontSize: '0.85em',
              fontWeight: '600',
              color: '#201515',
              transition: 'background 0.15s ease',
              textAlign: 'left'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#f8f4f0'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#605d52" strokeWidth="2" strokeLinecap="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
