// src/components/prototype/PrototypeSwitcher.jsx
import React, { useEffect } from 'react';

export default function PrototypeSwitcher({ variants, current, onSelect }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.isContentEditable)) {
        return;
      }

      const currentIndex = variants.findIndex(v => v.id === current);
      if (e.key === 'ArrowLeft') {
        const prevIndex = (currentIndex - 1 + variants.length) % variants.length;
        onSelect(variants[prevIndex].id);
      } else if (e.key === 'ArrowRight') {
        const nextIndex = (currentIndex + 1) % variants.length;
        onSelect(variants[nextIndex].id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [variants, current, onSelect]);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 99999,
        background: '#201515',
        color: '#fffefb',
        padding: '10px 20px',
        borderRadius: '30px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
        border: '2px solid #ff4f00',
        fontFamily: 'Inter, system-ui, sans-serif'
      }}
    >
      <span style={{ fontSize: '0.75em', fontWeight: '800', textTransform: 'uppercase', color: '#ff4f00', letterSpacing: '1px' }}>
        DRAWER PROTOTYPE
      </span>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {variants.map((v) => (
          <button
            key={v.id}
            onClick={() => onSelect(v.id)}
            style={{
              background: current === v.id ? '#ff4f00' : 'rgba(255,255,255,0.1)',
              color: '#fffefb',
              border: 'none',
              borderRadius: '20px',
              padding: '6px 14px',
              fontWeight: '700',
              cursor: 'pointer',
              fontSize: '0.85em',
              transition: 'all 0.2s ease'
            }}
          >
            {v.id} — {v.name}
          </button>
        ))}
      </div>

      <span style={{ fontSize: '0.75em', color: '#a09d94' }}>
        (Use ← → keys to cycle)
      </span>
    </div>
  );
}
