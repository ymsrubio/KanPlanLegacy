// src/components/LoginPage.jsx
// Shown when the user is unauthenticated. Not drawn in the design canvas: built from
// tokens.css, the shared classes in workspace.css, and the empty-state type of artboard 7.

import React from 'react';

const isLocalhost =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const page = {
  minHeight: '100vh',
  boxSizing: 'border-box',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 'var(--space-4)',
  background: 'var(--page)'
};

const card = {
  width: '100%',
  maxWidth: '400px',
  padding: 'var(--space-8)',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-6)',
  textAlign: 'center'
};

const fullWidth = { width: '100%', boxSizing: 'border-box', textDecoration: 'none' };

export default function LoginPage() {
  return (
    <main style={page}>
      <section className="panel" style={card} aria-labelledby="login-title">
        <div>
          <h1 id="login-title" className="display" style={{ fontSize: 'var(--t-32)' }}>
            KanPlan
          </h1>
          <p className="sub" style={{ fontSize: 'var(--t-14)', color: 'var(--text-2)', marginTop: 'var(--space-2)', lineHeight: 1.45 }}>
            Kanban WIP limits and calendar time blocking.
          </p>
        </div>

        <div className="empty" style={{ padding: 0, alignItems: 'center' }}>
          <h2>Welcome back</h2>
          <p>Sign in to open your board.</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <a href="/api/auth/google" id="login-google-button" className="btn primary" style={fullWidth}>
            Sign in with Google
          </a>
          {isLocalhost && (
            <a href="/api/auth/dev-login" id="login-dev-button" className="btn secondary" style={fullWidth}>
              Local dev sign in
            </a>
          )}
        </div>

        <p style={{ fontSize: 'var(--t-12)', color: 'var(--text-3)' }}>
          Your data stays private, scoped to your account only.
        </p>
      </section>
    </main>
  );
}
