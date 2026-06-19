import { useState } from 'react';
import { useStore, SET_ACTIVE_MONTH } from './store/index.js';
import { monthLabel } from './lib/date.js';
import MonthlySummary from './components/MonthlySummary.jsx';
import CategoryChart from './components/CategoryChart.jsx';
import TransactionForm from './components/TransactionForm.jsx';
import TransactionList from './components/TransactionList.jsx';
import CategoryManager from './components/CategoryManager.jsx';
import TagManager from './components/TagManager.jsx';

function prevMonth(yyyyMm) {
  const [y, m] = yyyyMm.split('-').map(Number);
  return m === 1
    ? `${y - 1}-12`
    : `${y}-${String(m - 1).padStart(2, '0')}`;
}

function nextMonth(yyyyMm) {
  const [y, m] = yyyyMm.split('-').map(Number);
  return m === 12
    ? `${y + 1}-01`
    : `${y}-${String(m + 1).padStart(2, '0')}`;
}

export default function App() {
  const { state, dispatch } = useStore();
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [showCategories, setShowCategories] = useState(false);
  const [showTags, setShowTags] = useState(false);

  function handleMonthChange(month) {
    dispatch({ type: SET_ACTIVE_MONTH, payload: month });
    setEditingTransaction(null);
  }

  if (state.loading && state.categories.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <span className="animate-pulse text-sm text-muted">Loading…</span>
      </div>
    );
  }

  const monthSwitching = state.loading && state.categories.length > 0;

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <header className="border-b border-border bg-surface px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <h1 className="text-xl font-semibold text-primary">Finance Finder</h1>
          <div
            className={`flex items-center gap-3${monthSwitching ? ' pointer-events-none opacity-50' : ''}`}
          >
            <button
              onClick={() => handleMonthChange(prevMonth(state.activeMonth))}
              className="rounded px-2 py-1 text-muted hover:text-ink"
            >
              ‹
            </button>
            <span className="min-w-32 text-center font-medium text-ink">
              {monthLabel(state.activeMonth)}
            </span>
            <button
              onClick={() => handleMonthChange(nextMonth(state.activeMonth))}
              className="rounded px-2 py-1 text-muted hover:text-ink"
            >
              ›
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6">
        {state.error && (
          <div className="rounded border border-expense/30 bg-expense/10 px-4 py-3 text-sm text-expense">
            {state.error}
          </div>
        )}

        {/* Summary + Chart */}
        <div className="grid gap-6 md:grid-cols-2">
          <MonthlySummary />
          <CategoryChart />
        </div>

        {/* Transaction form */}
        <section className="rounded-lg border border-border bg-surface p-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">
            {editingTransaction ? 'Edit transaction' : 'Add transaction'}
          </h2>
          <TransactionForm
            editing={editingTransaction}
            onDone={() => setEditingTransaction(null)}
          />
        </section>

        {/* Transaction list */}
        <section>
          <TransactionList onEdit={setEditingTransaction} />
        </section>

        {/* Category manager (toggle) */}
        <section>
          <button
            onClick={() => setShowCategories((v) => !v)}
            className="flex items-center gap-2 text-sm font-medium text-muted hover:text-ink"
          >
            <span>{showCategories ? '▴' : '▾'}</span>
            Manage categories
          </button>
          {showCategories && (
            <div className="mt-4 rounded-lg border border-border bg-surface p-5">
              <CategoryManager />
            </div>
          )}
        </section>

        {/* Tag manager (toggle) */}
        <section>
          <button
            onClick={() => setShowTags((v) => !v)}
            className="flex items-center gap-2 text-sm font-medium text-muted hover:text-ink"
          >
            <span>{showTags ? '▴' : '▾'}</span>
            Manage tags
          </button>
          {showTags && (
            <div className="mt-4 rounded-lg border border-border bg-surface p-5">
              <TagManager />
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
