import { useState, useEffect } from 'react';
import { useStore, SET_ACTIVE_MONTH } from '../store/index.js';
import { monthLabel } from '../lib/date.js';

function prevMonth(yyyyMm) {
  const [y, m] = yyyyMm.split('-').map(Number);
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`;
}
function nextMonth(yyyyMm) {
  const [y, m] = yyyyMm.split('-').map(Number);
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`;
}

/**
 * Floating month switcher for Act II. The active month is global (drives every data view
 * and the journey scenes), so it lives in a fixed bar that fades in once the workspace
 * (#act2) is reached and stays out of the way over the hero/journey.
 */
export default function MonthBar() {
  const { state, dispatch } = useStore();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = document.getElementById('act2');
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      (entries) => setVisible(entries.some((e) => e.isIntersecting)),
      { rootMargin: '0px 0px -60% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const switching = state.loading && state.categories.length > 0;
  const setMonth = (m) => dispatch({ type: SET_ACTIVE_MONTH, payload: m });

  return (
    <div
      className={`fixed right-4 top-4 z-40 flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 transition-opacity duration-300 ${
        visible ? 'opacity-100' : 'pointer-events-none opacity-0'
      }${switching ? ' opacity-50' : ''}`}
    >
      <button
        aria-label="Previous month"
        onClick={() => setMonth(prevMonth(state.activeMonth))}
        className="rounded px-1.5 py-0.5 text-muted hover:text-ink"
      >
        ‹
      </button>
      <span className="min-w-28 text-center text-sm font-medium text-ink">
        {monthLabel(state.activeMonth)}
      </span>
      <button
        aria-label="Next month"
        onClick={() => setMonth(nextMonth(state.activeMonth))}
        className="rounded px-1.5 py-0.5 text-muted hover:text-ink"
      >
        ›
      </button>
    </div>
  );
}
