import { useState } from 'react';
import { useStore, SET_ACTIVE_MONTH } from './store/index.js';
import { monthLabel } from './lib/date.js';
import MonthlySummary from './components/MonthlySummary.jsx';
import CategoryChart from './components/CategoryChart.jsx';
import TransactionForm from './components/TransactionForm.jsx';
import TransactionList from './components/TransactionList.jsx';
import CategoryManager from './components/CategoryManager.jsx';
import TagManager from './components/TagManager.jsx';
import RecurringForm from './components/RecurringForm.jsx';
import RecurringList from './components/RecurringList.jsx';
import UpcomingProjection from './components/UpcomingProjection.jsx';
import IncomeDashboard from './components/IncomeDashboard.jsx';
import TrendsChart from './components/TrendsChart.jsx';
import AnalyticsPanel from './components/AnalyticsPanel.jsx';
import BudgetManager from './components/BudgetManager.jsx';
import PlanVsActual from './components/PlanVsActual.jsx';

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
  const [showCategories, setShowCategories]   = useState(false);
  const [showTags, setShowTags]               = useState(false);
  const [showRecurring, setShowRecurring]       = useState(false);
  const [editingRecurring, setEditingRecurring] = useState(null);
  const [showIncome, setShowIncome]             = useState(false);
  const [showTrends, setShowTrends]             = useState(false);
  const [showAnalytics, setShowAnalytics]       = useState(false);
  const [showBudget, setShowBudget]             = useState(false);

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

        {/* Summary + Chart + Upcoming */}
        <div className="grid gap-6 md:grid-cols-2">
          <MonthlySummary />
          <CategoryChart />
        </div>
        <UpcomingProjection />

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

        {/* Recurring items (toggle) */}
        <section>
          <button
            onClick={() => setShowRecurring((v) => !v)}
            className="flex items-center gap-2 text-sm font-medium text-muted hover:text-ink"
          >
            <span>{showRecurring ? '▴' : '▾'}</span>
            Manage recurring items
          </button>
          {showRecurring && (
            <div className="mt-4 space-y-6 rounded-lg border border-border bg-surface p-5">
              <div>
                <h3 className="mb-3 text-sm font-medium text-ink">
                  {editingRecurring ? 'Edit recurring item' : 'Add recurring item'}
                </h3>
                <RecurringForm
                  editing={editingRecurring}
                  onDone={() => setEditingRecurring(null)}
                />
              </div>
              <div className="border-t border-border pt-4">
                <h3 className="mb-3 text-sm font-medium text-ink">Recurring items</h3>
                <RecurringList onEdit={setEditingRecurring} />
              </div>
            </div>
          )}
        </section>

        {/* Income analysis (toggle) */}
        <section>
          <button
            onClick={() => setShowIncome((v) => !v)}
            className="flex items-center gap-2 text-sm font-medium text-muted hover:text-ink"
          >
            <span>{showIncome ? '▴' : '▾'}</span>
            Income analysis
          </button>
          {showIncome && (
            <div className="mt-4">
              <IncomeDashboard />
            </div>
          )}
        </section>

        {/* Trends (toggle) */}
        <section>
          <button
            onClick={() => setShowTrends((v) => !v)}
            className="flex items-center gap-2 text-sm font-medium text-muted hover:text-ink"
          >
            <span>{showTrends ? '▴' : '▾'}</span>
            Trends
          </button>
          {showTrends && (
            <div className="mt-4">
              <TrendsChart />
            </div>
          )}
        </section>

        {/* Analytics (toggle) */}
        <section>
          <button
            onClick={() => setShowAnalytics((v) => !v)}
            className="flex items-center gap-2 text-sm font-medium text-muted hover:text-ink"
          >
            <span>{showAnalytics ? '▴' : '▾'}</span>
            Analytics
          </button>
          {showAnalytics && (
            <div className="mt-4">
              <AnalyticsPanel />
            </div>
          )}
        </section>

        {/* Budget (toggle) */}
        <section>
          <button
            onClick={() => setShowBudget((v) => !v)}
            className="flex items-center gap-2 text-sm font-medium text-muted hover:text-ink"
          >
            <span>{showBudget ? '▴' : '▾'}</span>
            Budget
          </button>
          {showBudget && (
            <div className="mt-4 space-y-6 rounded-lg border border-border bg-surface p-5">
              <BudgetManager />
              <div className="border-t border-border pt-4">
                <PlanVsActual />
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
