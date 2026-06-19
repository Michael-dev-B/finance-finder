const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// '2024-01-15' → '15/01/2024'
export function toDisplayDate(iso) {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

// '15/01/2024' → '2024-01-15'
export function toISODate(display) {
  const [d, m, y] = display.split('/');
  return `${y}-${m}-${d}`;
}

// Returns current month as 'YYYY-MM' in local time
export function currentMonth() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

// '2024-06' → 'June 2024'
export function monthLabel(yyyyMm) {
  const [y, m] = yyyyMm.split('-');
  return `${MONTH_NAMES[parseInt(m, 10) - 1]} ${y}`;
}
