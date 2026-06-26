import { useState } from 'react';
import { useStore, SET_ACTIVE_MONTH } from './store/index.js';
import { monthLabel } from './lib/date.js';
import { ToastProvider } from './components/Toast.jsx';
import { RevealView } from './motion/Reveal.jsx';
import HideawayNav from './components/HideawayNav.jsx';
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

const LAST_VIEW_KEY = 'ff:lastView';
const VALID_VIEWS = new Set([
  'dashboard', 'transactions', 'income', 'trends', 'analytics',
  'categories', 'tags', 'recurring', 'budget',
]);

function ViewHeading({ children }) {
  return <h2 className="text-lg font-semibold text-ink">{children}</h2>;
}

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
  const [activeView, setActiveView]               = useState(() => {
    const saved = typeof window !== 'undefined' && localStorage.getItem(LAST_VIEW_KEY);
    return VALID_VIEWS.has(saved) ? saved : 'dashboard';
  });
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [editingRecurring, setEditingRecurring]   = useState(null);

  function navigate(view) {
    setActiveView(view);
    try { localStorage.setItem(LAST_VIEW_KEY, view); } catch { /* ignore unavailable storage */ }
  }

  function handleMonthChange(month) {
    dispatch({ type: SET_ACTIVE_MONTH, payload: month });
    setEditingTransaction(null);
  }

  if (state.loading && state.categories.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg">
        <span className="animate-pulse text-sm text-muted">Loading…</span>
      </div>
    );
  }

  const monthSwitching = state.loading && state.categories.length > 0;

  function renderView() {
    switch (activeView) {
      case 'dashboard':
        return (
          <>
            <div className="grid gap-6 md:grid-cols-2">
              <MonthlySummary />
              <CategoryChart />
            </div>
            <UpcomingProjection />
          </>
        );

      case 'transactions':
        return (
          <>
            <section className="rounded-lg border border-border bg-surface p-5">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">
                {editingTransaction ? 'Edit transaction' : 'Add transaction'}
              </h2>
              <TransactionForm
                editing={editingTransaction}
                onDone={() => setEditingTransaction(null)}
              />
            </section>
            <div className="rounded-lg border border-border bg-surface p-5">
              <TransactionList onEdit={setEditingTransaction} />
            </div>
          </>
        );

      case 'income':
        return (
          <>
            <ViewHeading>Income</ViewHeading>
            <IncomeDashboard />
          </>
        );

      case 'trends':
        return (
          <>
            <ViewHeading>Trends</ViewHeading>
            <TrendsChart />
          </>
        );

      case 'analytics':
        return (
          <>
            <ViewHeading>Analytics</ViewHeading>
            <AnalyticsPanel />
          </>
        );

      case 'categories':
        return (
          <>
            <ViewHeading>Categories</ViewHeading>
            <div className="rounded-lg border border-border bg-surface p-5">
              <CategoryManager />
            </div>
          </>
        );

      case 'tags':
        return (
          <>
            <ViewHeading>Tags</ViewHeading>
            <div className="rounded-lg border border-border bg-surface p-5">
              <TagManager />
            </div>
          </>
        );

      case 'recurring':
        return (
          <>
            <ViewHeading>Recurring</ViewHeading>
            <div className="space-y-6 rounded-lg border border-border bg-surface p-5">
              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
                  {editingRecurring ? 'Edit recurring item' : 'Add recurring item'}
                </h3>
                <RecurringForm
                  editing={editingRecurring}
                  onDone={() => setEditingRecurring(null)}
                />
              </div>
              <div className="border-t border-border pt-5">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
                  Recurring items
                </h3>
                <RecurringList onEdit={setEditingRecurring} />
              </div>
            </div>
          </>
        );

      case 'budget':
        return (
          <>
            <ViewHeading>Budget</ViewHeading>
            <div className="rounded-lg border border-border bg-surface p-5">
              <BudgetManager />
            </div>
          </>
        );

      default:
        return null;
    }
  }

  return (
    <ToastProvider>
    <div className="flex h-screen flex-col bg-bg">
      {/* Header — full width above sidebar + content */}
      <header className="border-b border-border bg-surface px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-full items-center justify-between">
          <h1 className="text-xl font-bold text-primary">Finance Finder</h1>
          <div
            className={`flex items-center gap-3${monthSwitching ? ' pointer-events-none opacity-50' : ''}`}
          >
            <button
              aria-label="Previous month"
              onClick={() => handleMonthChange(prevMonth(state.activeMonth))}
              className="rounded px-2 py-1 text-muted hover:text-ink"
            >
              ‹
            </button>
            <span className="min-w-32 text-center font-medium text-ink">
              {monthLabel(state.activeMonth)}
            </span>
            <button
              aria-label="Next month"
              onClick={() => handleMonthChange(nextMonth(state.activeMonth))}
              className="rounded px-2 py-1 text-muted hover:text-ink"
            >
              ›
            </button>
          </div>
        </div>
      </header>

      {/* Two-column shell: sidebar + content */}
      <div className="flex flex-1 overflow-hidden">
        <HideawayNav activeView={activeView} onNavigate={navigate} />

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6">
            {state.error && (
              <div className="rounded border border-expense/30 bg-expense/10 px-4 py-3 text-sm text-expense">
                {state.error}
              </div>
            )}
            <RevealView key={activeView} className="space-y-6">{renderView()}</RevealView>
          </div>
        </main>
      </div>
    </div>
    </ToastProvider>
  );
}
