// src/components/Icon.jsx
// 16px line icons from the design system: 1.5px stroke, round caps, currentColor.
import React from 'react';

const PATHS = {
  down: <path d="M4 6l4 4 4-4" />,
  right: <path d="M6 4l4 4-4 4" />,
  prev: <path d="M10 3.5L5.5 8l4.5 4.5" />,
  next: <path d="M6 3.5L10.5 8 6 12.5" />,
  plus: <path d="M8 3v10M3 8h10" />,
  more: <><circle cx="3.5" cy="8" r="1" /><circle cx="8" cy="8" r="1" /><circle cx="12.5" cy="8" r="1" /></>,
  running: <><circle cx="8" cy="8" r="5.5" /><path d="M6.8 5.8v4.4l3.4-2.2z" /></>,
  clock: <><circle cx="8" cy="8" r="5.5" /><path d="M8 5v3.2l2 1.3" /></>,
  lines: <path d="M3 4.5h10M3 8h10M3 11.5h6" />,
  done: <><circle cx="8" cy="8" r="5.5" /><path d="M5.6 8.2l1.7 1.7 3.1-3.4" /></>,
  critical: <path d="M4 8l4-4 4 4M4 12l4-4 4 4" />,
  high: <path d="M4 10l4-4 4 4" />,
  check: <path d="M3.5 8.5l3 3 6-7" />,
  close: <path d="M4 4l8 8M12 4l-8 8" />
};

export default function Icon({ name }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {PATHS[name]}
    </svg>
  );
}
