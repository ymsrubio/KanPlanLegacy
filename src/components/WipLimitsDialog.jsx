// src/components/WipLimitsDialog.jsx
// Edit each column's WIP limit. Opened from the More menu; replaces the inline editor the old board had.
import React, { useEffect, useState } from 'react';
import { parseWipLimit, columnCounts, MAX_WIP_LIMIT } from '../lib/wip-limits.js';

const toDraft = (columns) => Object.fromEntries(columns.map((c) => [c.id, c.wip_limit == null ? '' : String(c.wip_limit)]));

export default function WipLimitsDialog({ isOpen, onClose, columns, tasks, onSave }) {
  const [draft, setDraft] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  useEffect(() => { if (isOpen) { setDraft(toDraft(columns)); setSaving(false); setSaveError(null); } }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const counts = columnCounts(tasks);
  const parsed = columns.map((c) => ({ col: c, res: parseWipLimit(draft[c.id]) }));
  const invalid = parsed.some((p) => !p.res.ok);
  const changed = parsed.filter((p) => p.res.ok && p.res.value !== (p.col.wip_limit ?? null));

  const save = async () => {
    setSaving(true);
    const error = await onSave(changed.map((p) => ({ id: p.col.id, wip_limit: p.res.value })));
    setSaveError(error);
    setSaving(false);
  };

  return (
    <div className="scrim" onClick={onClose}>
      <div className="dlg" role="dialog" aria-modal="true" aria-labelledby="wip-limits-title" onClick={(e) => e.stopPropagation()}>
        <h2 id="wip-limits-title">WIP limits</h2>
        <p style={{ fontSize: 'var(--t-14)', lineHeight: 1.45, color: 'var(--text-2)' }}>
          The most tasks a column holds at once. Leave a limit blank for no cap. A full Ready to start offers a swap instead of blocking.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {parsed.map(({ col, res }) => {
            const n = counts[col.id] || 0;
            const errId = `wip-err-${col.id}`;
            return (
              <React.Fragment key={col.id}>
              <div className="row">
                <label htmlFor={`wip-${col.id}`} className="ttl" style={{ display: 'flex', alignItems: 'center' }}>{col.name}</label>
                <span style={{ fontSize: 'var(--t-12)', color: 'var(--text-2)', fontVariantNumeric: 'tabular-nums' }}>{n} now</span>
                <input
                  id={`wip-${col.id}`}
                  className="at-input"
                  style={{ width: 'calc(var(--space-12) * 2)', height: 'var(--h-ctl-sm)', flex: 'none' }}
                  inputMode="numeric"
                  placeholder="None"
                  maxLength={String(MAX_WIP_LIMIT).length}
                  value={draft[col.id] ?? ''}
                  aria-invalid={!res.ok}
                  aria-describedby={res.ok ? undefined : errId}
                  onChange={(e) => setDraft((d) => ({ ...d, [col.id]: e.target.value }))}
                />
              </div>
              {!res.ok && <p id={errId} role="alert" style={{ fontSize: 'var(--t-12)', color: 'var(--error)', padding: '0 var(--space-3)' }}>{res.error}</p>}
              </React.Fragment>
            );
          })}
        </div>
        {saveError && <p role="alert" style={{ fontSize: 'var(--t-12)', color: 'var(--error)' }}>{saveError}</p>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
          <button type="button" className="btn quiet" onClick={onClose}>Cancel</button>
          <button type="button" className="btn primary" disabled={invalid || saving || changed.length === 0} onClick={save}>Save limits</button>
        </div>
      </div>
    </div>
  );
}
