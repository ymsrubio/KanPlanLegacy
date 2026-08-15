// src/lib/time-utils.js

/**
 * Get current local wall-clock date as YYYY-MM-DD string
 */
export function getTodayDateString(dateObj = new Date()) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Get current local time rounded to the nearest 5 minutes as 'HH:MM' string (24h)
 */
export function getCurrentRoundedTime(dateObj = new Date()) {
  const minutes = dateObj.getMinutes();
  const roundedMin = Math.round(minutes / 5) * 5;
  const copy = new Date(dateObj);
  copy.setMinutes(roundedMin, 0, 0);

  const h = String(copy.getHours()).padStart(2, '0');
  const m = String(copy.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

/**
 * Generate 5-minute time options for select inputs (288 options)
 */
export function generate5MinTimeOptions() {
  const options = [];
  for (let h = 0; h < 24; h++) {
    const hStr = String(h).padStart(2, '0');
    const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
    const ampm = h >= 12 ? 'PM' : 'AM';

    for (let m = 0; m < 60; m += 5) {
      const mStr = String(m).padStart(2, '0');
      const value = `${hStr}:${mStr}`;
      const label = `${displayHour}:${mStr} ${ampm}`;
      options.push({ value, label });
    }
  }
  return options;
}

/**
 * Check if the date of nowInput differs from a previous date string (YYYY-MM-DD)
 */
export function hasDateChanged(prevDateStr, nowInput = new Date()) {
  if (!prevDateStr) return true;
  const currentDateStr = getTodayDateString(nowInput);
  return prevDateStr !== currentDateStr;
}

/**
 * Format a Date object to local wall-clock ISO string (no Z offset)
 */
export function formatLocalIso(date) {
  if (!date) return null;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  return `${y}-${m}-${d}T${h}:${min}:${s}`;
}
