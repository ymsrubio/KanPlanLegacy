// src/components/BottomSheet.jsx
// Phone container for Add task. Esc or backdrop closes; focus returns to what opened it.
import React, { useEffect } from 'react';
import '../bottom-sheet.css';

export default function BottomSheet({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return undefined;
    const opener = document.activeElement;
    return () => opener?.focus?.();
  }, [open]);
  if (!open) return null;
  return (
    <div className="bs-back" onClick={onClose}>
      <div className="bs" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.key === 'Escape' && onClose()}>
        <div className="bs-head">
          <h2 className="bs-title">{title}</h2>
          <button type="button" className="bs-x" aria-label="Close" onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}
