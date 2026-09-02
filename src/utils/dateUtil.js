/**
 * Indian Standard Time (IST - Asia/Kolkata, UTC+5:30) Date & Time Utilities
 * 
 * Guarantees that all timestamps across the admin dashboard and tables
 * are formatted consistently in IST regardless of user browser or server timezone.
 */

export const IST_TIMEZONE = 'Asia/Kolkata';

/**
 * Parses any date input safely into a Date object
 */
export function parseDate(dateInput) {
  if (!dateInput) return null;
  if (dateInput instanceof Date) return dateInput;
  if (typeof dateInput === 'string') {
    // If format is 'YYYY-MM-DD HH:mm:ss' (MySQL timestamp without Z)
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(dateInput)) {
      return new Date(dateInput.replace(' ', 'T') + 'Z');
    }
    return new Date(dateInput);
  }
  return new Date(dateInput);
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
