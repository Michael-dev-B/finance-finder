import { useState, useEffect } from 'react';
import { useStore } from '../store/index.js';
import { getUpcoming } from '../api/recurring.js';
import { formatZAR } from '../lib/money.js';
import { toDisplayDate } from '../lib/date.js';

export default function UpcomingProjection() {
  const { state } = useStore();
  const [upcoming, setUpcoming] = useState([]);

  useEffect(() => {
    getUpcoming(state.activeMonth, state.activeMonth)
      .then(setUpcoming)
      .catch(() => setUpcoming([]));
  }, [state.activeMonth]);

  const categoryMap = new Map(state.categories.map((c) => [c.id, c]));

  const minExpenses = state.recurring
    .filter((r) => r.active && r.type === 'expense')
    .reduce((sum, r) => sum + r.amount_cents, 0);

  return (
    <div className="flex flex-col rounded-lg border border-border bg-surface p-5">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">
        Recurring this month
      </h2>

      {upcoming.length === 0 ? (
        <div className="flex flex-1 items-center justify-center py-6">
          <p className="text-sm text-muted">No recurring items this month.</p>
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {upcoming.map((item, i) => {
            const cat = item.category_id ? categoryMap.get(item.category_id) : null;
            return (
              <li key={i} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted">{toDisplayDate(item.expected_date)}</span>
                  <span className="text-sm text-ink">{item.name}</span>
                  {cat && (
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: cat.colour }}
                    />
                  )}
                </div>
                <span
                  className={`text-sm font-medium ${item.type === 'income' ? 'text-income' : 'text-expense'}`}
                >
                  {item.type === 'income' ? '+' : '−'} {formatZAR(item.amount_cents)}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {minExpenses > 0 && (
        <p className="mt-4 border-t border-border pt-3 text-xs text-muted">
          Min. commitments:{' '}
          <span className="font-medium text-ink">{formatZAR(minExpenses)}</span>
        </p>
      )}
    </div>
  );
}
