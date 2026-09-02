/**
 * Indian Standard Time (IST - Asia/Kolkata, UTC+5:30) Date & Time Utilities
 * 
 * Guarantees that all timestamps across the admin dashboard, modals, inputs, and tables
 * are formatted consistently in IST regardless of user browser or server timezone.
 */

export const IST_TIMEZONE = 'Asia/Kolkata';
export const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000; // 5 hours 30 mins in ms

/**
 * Parses any date input safely into a Date object in UTC
 */
export function parseDate(dateInput) {
  if (!dateInput) return null;
  if (dateInput instanceof Date) return dateInput;
  if (typeof dateInput === 'string') {
    const trimmed = dateInput.trim();
    // If format is 'YYYY-MM-DD HH:mm:ss' (MySQL timestamp without Z, stored in UTC)
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(trimmed)) {
      return new Date(trimmed.replace(' ', 'T') + 'Z');
    }
    return new Date(trimmed);
  }
  return new Date(dateInput);
}

/**
 * Converts any UTC / MySQL / ISO timestamp into "YYYY-MM-DDTHH:mm" for <input type="datetime-local">
 * Guaranteed to display the EXACT time in Indian Standard Time (IST) without browser timezone shifts.
 */
export function toDatetimeLocalIST(dateInput) {
  if (!dateInput) return '';
  const d = parseDate(dateInput);
  if (!d || isNaN(d.getTime())) return '';

  // Shift UTC date by +5:30 to get IST date components
  const istDate = new Date(d.getTime() + IST_OFFSET_MS);
  const year = istDate.getUTCFullYear();
  const month = String(istDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(istDate.getUTCDate()).padStart(2, '0');
  const hours = String(istDate.getUTCHours()).padStart(2, '0');
  const minutes = String(istDate.getUTCMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Converts a datetime-local input string ("YYYY-MM-DDTHH:mm") chosen in IST
 * into a UTC ISO string ("YYYY-MM-DDTHH:mm:00.000Z") for sending to backend.
 */
export function istDatetimeLocalToUTC(datetimeLocalStr) {
  if (!datetimeLocalStr) return null;
  const trimmed = datetimeLocalStr.trim();
  const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2})(?::(\d{2}))?)?$/);
  if (!match) return datetimeLocalStr;

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10) - 1;
  const day = parseInt(match[3], 10);
  const hour = parseInt(match[4] || '0', 10);
  const minute = parseInt(match[5] || '0', 10);
  const second = parseInt(match[6] || '0', 10);

  // Input was in IST (+5:30) -> subtract 5h 30m to get UTC epoch
  const utcMs = Date.UTC(year, month, day, hour, minute, second) - IST_OFFSET_MS;
  return new Date(utcMs).toISOString();
}

/**
 * Format date in IST: "2 Oct 2026"
 */
export function formatDateIST(dateInput) {
  const d = parseDate(dateInput);
  if (!d || isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', {
    timeZone: IST_TIMEZONE,
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

/**
 * Format time in IST: "08:30 PM"
 */
export function formatTimeIST(dateInput) {
  const d = parseDate(dateInput);
  if (!d || isNaN(d.getTime())) return '—';
  const str = d.toLocaleTimeString('en-US', {
    timeZone: IST_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
  return str.replace(/\b(am|pm)\b/gi, (m) => m.toUpperCase());
}

/**
 * Format time with seconds in IST: "08:30:15 PM"
 */
export function formatTimeWithSecondsIST(dateInput) {
  const d = parseDate(dateInput);
  if (!d || isNaN(d.getTime())) return '—';
  const str = d.toLocaleTimeString('en-US', {
    timeZone: IST_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
  return str.replace(/\b(am|pm)\b/gi, (m) => m.toUpperCase());
}

/**
 * Format date & time in IST: "2 Oct 2026, 08:30 PM"
 */
export function formatDateTimeIST(dateInput) {
  const d = parseDate(dateInput);
  if (!d || isNaN(d.getTime())) return '—';
  const str = d.toLocaleString('en-GB', {
    timeZone: IST_TIMEZONE,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
  return str.replace(/\b(am|pm)\b/gi, (m) => m.toUpperCase());
}

/**
 * Formats a 24-hour clock string (e.g. "01:00") into 12-hour AM/PM: "01:00 AM"
 */
export function formatClockTime(clockStr) {
  if (!clockStr) return '01:00 AM';
  const parts = clockStr.split(':');
  let h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1] || '0', 10) || 0;
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  h = h ? h : 12;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
}

/**
 * Summarize scan behavior for table badges
 */
export function formatBehaviorSummary(category) {
  if (!category) return 'One-Time Use';
  const behavior = (category.scan_behavior || 'ONE_TIME').toUpperCase();
  if (behavior === 'ONE_TIME') {
    return 'One-Time (Permanent)';
  }
  const timeFormatted = formatClockTime(category.renewal_time || '01:00');
  const untilFormatted = category.renewal_active_until
    ? formatDateIST(category.renewal_active_until)
    : (category.valid_until ? formatDateIST(category.valid_until) : '');
  
  if (untilFormatted) {
    return `Renews daily at ${timeFormatted} (until ${untilFormatted})`;
  }
  return `Renews daily at ${timeFormatted}`;
}
