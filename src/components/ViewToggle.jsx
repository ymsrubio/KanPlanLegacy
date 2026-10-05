// src/components/ViewToggle.jsx
// Phone List / Calendar / Matrix switch.
import React from 'react';
import '../bottom-sheet.css';

const VIEWS = [['list', 'List'], ['calendar', 'Calendar'], ['matrix', 'Matrix']];

export default function ViewToggle({ view, onChange }) {
  return (
    <div className="vt" role="group" aria-label="View">
      {VIEWS.map(([key, name]) => (
        <button key={key} type="button" className="vt-btn" aria-pressed={view === key} onClick={() => onChange(key)}>{name}</button>
      ))}
    </div>
  );
}
