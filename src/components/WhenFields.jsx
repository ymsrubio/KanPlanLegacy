// src/components/WhenFields.jsx
// Day, start and length controls shared by Add task's When chip and the move-to-Ready time dialog.
// value: { day: 'today' | 'tomorrow', date, startText, minutes, more }; onChange(patch) merges into it.
import React, { useRef } from 'react';
import { LENGTHS, lengthLabel, parseClock } from '../lib/add-task.js';
import { formatTime } from '../lib/schedule.js';
import '../add-task.css';

const DAYS = [['today', 'Today'], ['tomorrow', 'Tomorrow']];

const Svg = ({ children }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);
export const CalendarIcon = () => <Svg><rect x="2.5" y="3.5" width="11" height="10" rx="2" /><path d="M2.5 6.5h11M5.5 2v3M10.5 2v3" /></Svg>;
export const AlertIcon = () => <Svg><circle cx="8" cy="8" r="5.5" /><path d="M8 5v3.5M8 10.8v.2" /></Svg>;

export const Opt = ({ on, onClick, className = '', children, ...rest }) => (
  <button type="button" data-opt="" role="radio" aria-checked={on} className={className} onClick={onClick} {...rest}>{children}</button>
);

export default function WhenFields({ value, start, onChange, onEnter }) {
  const picker = useRef(null);
  const { day, date, startText, minutes, more } = value;
  return (
    <>
      <div className="at-top">
        <div className="at-pills" role="radiogroup" aria-label="Day" style={{ flex: 1 }}>
          {DAYS.map(([k, name]) => <Opt key={k} className="at-pill" on={!date && day === k} onClick={() => onChange({ day: k, date: null, startText: null })}>{name}</Opt>)}
        </div>
        <button type="button" data-opt="" className="at-ibtn" aria-label="Pick a date" onClick={() => picker.current?.showPicker?.()}><CalendarIcon /></button>
        <input ref={picker} className="at-date" type="date" tabIndex={-1} aria-label="Date" value={date ?? ''} onChange={(e) => onChange({ date: e.target.value || null, startText: null })} />
      </div>
      <div className="at-time">
        <input
          data-opt=""
          className="at-input"
          aria-label="Starts"
          aria-invalid={startText != null && parseClock(startText) == null}
          value={startText ?? (start ? formatTime(start) : '')}
          onChange={(e) => onChange({ startText: e.target.value })}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onEnter?.(); } }}
        />
        <button type="button" data-opt="" className="at-next" onClick={() => onChange({ startText: null })}>Next free</button>
      </div>
      <div className="at-pills" role="radiogroup" aria-label="Length">
        {LENGTHS.map((m) => <Opt key={m} className="at-pill" on={minutes === m && !more} onClick={() => onChange({ more: false, minutes: m })}>{lengthLabel(m)}</Opt>)}
        <Opt className="at-pill" on={more} onClick={() => onChange({ more: true })}>More…</Opt>
      </div>
      {more && (
        <label className="at-minutes">
          Minutes
          <input
            data-opt=""
            className="at-input"
            type="number"
            min="5"
            step="5"
            value={minutes}
            onChange={(e) => onChange({ minutes: Math.max(5, Math.round(Number(e.target.value) / 5) * 5 || 5) })}
          />
        </label>
      )}
    </>
  );
}
