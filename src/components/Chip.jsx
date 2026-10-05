// src/components/Chip.jsx
// A chip button that opens a small popover. Arrow keys move between [data-opt] controls,
// Esc closes, and focus returns to the chip.
import React, { useEffect, useRef, useState } from 'react';

export default function Chip({ label, children, ariaLabel }) {
  const [open, setOpen] = useState(false);
  const btn = useRef(null);
  const pop = useRef(null);
  const wrap = useRef(null);

  const close = () => { setOpen(false); btn.current?.focus(); };

  useEffect(() => {
    if (!open) return undefined;
    const opts = pop.current.querySelectorAll('[data-opt]');
    (pop.current.querySelector('[data-opt][aria-checked="true"]') ?? opts[0])?.focus();
    const away = (e) => { if (!wrap.current.contains(e.target)) setOpen(false); };
    document.addEventListener('pointerdown', away);
    return () => document.removeEventListener('pointerdown', away);
  }, [open]);

  const onKeyDown = (e) => {
    if (e.key === 'Escape') { e.stopPropagation(); close(); return; }
    const forward = e.key === 'ArrowDown' || e.key === 'ArrowRight';
    const back = e.key === 'ArrowUp' || e.key === 'ArrowLeft';
    const edge = e.key === 'Home' || e.key === 'End';
    if (!forward && !back && !edge) return;
    if (e.target.tagName === 'INPUT' && (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || edge)) return; // let text editing work
    e.preventDefault();
    const opts = [...pop.current.querySelectorAll('[data-opt]')];
    const i = opts.indexOf(document.activeElement);
    const next = e.key === 'Home' ? 0 : e.key === 'End' ? opts.length - 1 : (i + (forward ? 1 : -1) + opts.length) % opts.length;
    opts[next]?.focus();
  };

  return (
    <span className="at-wrap" ref={wrap}>
      <button type="button" ref={btn} className="at-chip" aria-haspopup="true" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {label}<span aria-hidden="true">▾</span>
      </button>
      {open && <div ref={pop} className="at-pop" role="group" aria-label={ariaLabel} onKeyDown={onKeyDown}>{children(close)}</div>}
    </span>
  );
}
