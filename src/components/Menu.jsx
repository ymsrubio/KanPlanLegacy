// src/components/Menu.jsx
// Header button with a dropdown menu. Esc or a click outside closes it; focus returns to the button.
import React, { useEffect, useRef, useState } from 'react';

export default function Menu({ button, buttonClass = 'btn secondary', ariaLabel, children }) {
  const [open, setOpen] = useState(false);
  const wrap = useRef(null);
  const btn = useRef(null);
  const close = () => { setOpen(false); btn.current?.focus(); };

  useEffect(() => {
    if (!open) return undefined;
    wrap.current.querySelector('[role^=menuitem]')?.focus();
    const away = (e) => { if (!wrap.current.contains(e.target)) setOpen(false); };
    document.addEventListener('pointerdown', away);
    return () => document.removeEventListener('pointerdown', away);
  }, [open]);

  const onKeyDown = (e) => {
    if (e.key === 'Escape') { e.stopPropagation(); close(); return; }
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const items = [...wrap.current.querySelectorAll('[role^=menuitem]')];
    const i = items.indexOf(document.activeElement);
    items[(i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length]?.focus();
  };

  return (
    <span className="fw" ref={wrap} onKeyDown={onKeyDown}>
      <button type="button" ref={btn} className={buttonClass} aria-label={ariaLabel} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {button}
      </button>
      {open && <div className="fmenu" role="menu">{children(close)}</div>}
    </span>
  );
}
