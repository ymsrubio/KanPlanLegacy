// src/components/LoginPage.jsx
// Dedicated login page — shown when user is unauthenticated.
// Design follows KanPlan design system: #fffefb canvas, #201515 ink, #ff4f00 accent.

import React from 'react';

export default function LoginPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#fffefb',
        fontFamily: 'Inter, system-ui, sans-serif',
        color: '#201515',
        padding: '24px'
      }}
    >
      {/* Logo + branding */}
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <div
          style={{
            fontSize: '3.5em',
            marginBottom: '8px',
            filter: 'drop-shadow(0 4px 12px rgba(255,79,0,0.3))'
          }}
        >
          🎯
        </div>
        <h1
          style={{
            margin: '0 0 8px 0',
            fontSize: '2.4em',
            fontWeight: '800',
            letterSpacing: '-1px',
            color: '#201515'
          }}
        >
          KanPlan
        </h1>
        <p
          style={{
            margin: 0,
            fontSize: '1.1em',
            color: '#605d52',
            fontWeight: '500',
            maxWidth: '360px',
            lineHeight: '1.5'
          }}
        >
          Agile Kanban WIP Limits + Calendar Time Blocking
        </p>
      </div>

      {/* Login card */}
      <div
        style={{
          background: '#f8f4f0',
          border: '1px solid #c5c0b1',
          borderRadius: '20px',
          padding: '40px 48px',
          textAlign: 'center',
          boxShadow: '0 8px 32px rgba(32,21,21,0.08)',
          maxWidth: '400px',
          width: '100%'
        }}
      >
        <h2
          style={{
            margin: '0 0 8px 0',
            fontSize: '1.3em',
            fontWeight: '700',
            color: '#201515'
          }}
        >
          Welcome back
        </h2>
        <p
          style={{
            margin: '0 0 32px 0',
            fontSize: '0.9em',
            color: '#605d52'
          }}
        >
          Sign in to access your personal board
        </p>

        <a
          href="/api/auth/google"
          id="login-google-button"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            background: '#201515',
            color: '#fffefb',
            border: 'none',
            borderRadius: '14px',
            padding: '14px 28px',
            fontSize: '1em',
            fontWeight: '600',
            cursor: 'pointer',
            textDecoration: 'none',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 12px rgba(32,21,21,0.15)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#ff4f00';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(255,79,0,0.3)';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#201515';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(32,21,21,0.15)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Sign in with Google
        </a>

        {/* Localhost Dev Login option */}
        {(typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) && (
          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #c5c0b1' }}>
            <a
              href="/api/auth/dev-login"
              id="login-dev-button"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                background: '#fffefb',
                color: '#ff4f00',
                border: '1px solid #ff4f00',
                borderRadius: '14px',
                padding: '10px 20px',
                fontSize: '0.9em',
                fontWeight: '700',
                cursor: 'pointer',
                textDecoration: 'none',
                transition: 'all 0.2s ease'
              }}
            >
              🛠️ Local Dev Quick Sign In
            </a>
          </div>
        )}
      </div>

      {/* Footer */}
      <p
        style={{
          marginTop: '32px',
          fontSize: '0.8em',
          color: '#a09d94'
        }}
      >
        Your data stays private — scoped to your account only.
      </p>
    </div>
  );
}
