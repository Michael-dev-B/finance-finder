import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { useLenis } from 'lenis/react';
import { useStore, SET_ACTIVE_MONTH } from './store/index.js';
import { monthLabel } from './lib/date.js';
import { useReducedMotion } from './motion/useReducedMotion.js';
import { useScrollProgress } from './motion/useScrollProgress.js';
import { ToastProvider } from './components/Toast.jsx';
import { RevealView } from './motion/Reveal.jsx';
import HideawayNav from './components/HideawayNav.jsx';
import HeroBackdrop from './three/HeroBackdrop.jsx';
import { useJourneyData } from './three/useJourneyData.js';
import { MonthOverlay, TrendsOverlay, BudgetOverlay } from './components/JourneyOverlays.jsx';
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

// Act I overlay — brand register. Fades and lifts away as the viewer scrolls into the
// workspace. Isolated from App so scroll updates re-render only the overlay, never the
// dashboards behind it.
function HeroOverlay() {
  const progress = useScrollProgress();
  const fade = Math.max(0, 1 - progress * 1.6);
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
      style={{ opacity: fade, transform: `translateY(${progress * -24}px)` }}
    >
      <h1 className="text-[length:var(--text-display)] font-bold leading-[1.05] tracking-tight text-ink [text-wrap:balance]">
        Finance Finder
      </h1>
      <p className="mt-5 max-w-md text-base text-muted">Know exactly where you stand.</p>
      <div className="pointer-events-none absolute inset-x-0 bottom-8 flex justify-center" aria-hidden>
        <svg
          className="h-6 w-6 animate-bounce text-muted"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </div>
    </div>
  );
}

export default function App() {
  const { state, dispatch } = useStore();
  const reduced = useReducedMotion();
  const lenis = useLenis();
  const [activeView, setActiveView]               = useState(() => {
    const saved = typeof window !== 'undefined' && localStorage.getItem(LAST_VIEW_KEY);
    return VALID_VIEWS.has(saved) ? saved : 'dashboard';
  });
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [editingRecurring, setEditingRecurring]   = useState(null);
  const landedRef = useRef(false);
  const journey = useJourneyData();

  const contentReady = !(state.loading && state.categories.length === 0);

  function scrollToWorkspace(immediate = false) {
    const target = document.getElementById('workspace');
    if (!target) return;
    if (lenis && !reduced) lenis.scrollTo(target, { immediate });
    else target.scrollIntoView(); // native; instant under the reduced-motion CSS guard
  }

  function rememberView(view) {
    try { localStorage.setItem(LAST_VIEW_KEY, view); } catch { /* ignore unavailable storage */ }
  }

  function navigate(view) {
    setActiveView(view);
    rememberView(view);
    scrollToWorkspace();
  }

  function handleMonthChange(month) {
    dispatch({ type: SET_ACTIVE_MONTH, payload: month });
    setEditingTransaction(null);
  }

  // Initial landing (runs once, after content is ready so #workspace exists; before
  // paint, so there's no hero flash). A hash deep-link wins; otherwise a returning user
  // (remembered view) docks straight into the workspace — the daily-job guard — while a
  // first-time visitor starts at the hero.
  useLayoutEffect(() => {
    if (landedRef.current || !contentReady) return;
    landedRef.current = true;
    const hashView = window.location.hash.replace('#', '');
    if (VALID_VIEWS.has(hashView)) {
      setActiveView(hashView);
      rememberView(hashView);
      scrollToWorkspace(true);
      return;
    }
    let returning = false;
    try { returning = !!localStorage.getItem(LAST_VIEW_KEY); } catch { returning = false; }
    if (returning) scrollToWorkspace(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentReady]);

  // Runtime deep links: #budget (etc.) selects a view and docks to the workspace.
  // Hash-only — intentionally not a router (master plan §5).
  useEffect(() => {
    function onHashChange() {
      const view = window.location.hash.replace('#', '');
      if (!VALID_VIEWS.has(view)) return;
      setActiveView(view);
      rememberView(view);
      scrollToWorkspace();
    }
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!contentReady) {
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
      <HeroBackdrop data={journey} />
      <HideawayNav activeView={activeView} onNavigate={navigate} />

      {/* Act I — cinematic hero (brand register). Transparent: the fixed WebGL canvas
          shows through from behind. */}
      <section
        id="hero"
        data-register="cinematic"
        className="relative h-[100svh] overflow-hidden"
      >
        <HeroOverlay />
      </section>

      {/* Act I journey — real-data scenes (brand register). Transparent so the WebGL
          scenes show through; opaque under reduced motion so the poster doesn't bleed. */}
      <section
        id="journey-month"
        data-register="cinematic"
        className={`relative h-[100svh] overflow-hidden${reduced ? ' bg-bg' : ''}`}
      >
        <MonthOverlay data={journey} />
      </section>
      <section
        id="journey-trends"
        data-register="cinematic"
        className={`relative h-[100svh] overflow-hidden${reduced ? ' bg-bg' : ''}`}
      >
        <TrendsOverlay data={journey} />
      </section>
      <section
        id="journey-budget"
        data-register="cinematic"
        className={`relative h-[100svh] overflow-hidden${reduced ? ' bg-bg' : ''}`}
      >
        <BudgetOverlay data={journey} />
      </section>

      {/* Act II — the docked Command Room. Today's shell, behavior unchanged; the inner
          <main> keeps its own native scroll (data-lenis-prevent) and pl-14 clears the
          now-fixed rail. */}
      <section id="workspace" className="flex h-[100svh] flex-col bg-bg pl-14">
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

        <main data-lenis-prevent="" className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6">
            {state.error && (
              <div className="rounded border border-expense/30 bg-expense/10 px-4 py-3 text-sm text-expense">
                {state.error}
              </div>
            )}
            <RevealView key={activeView} className="space-y-6">{renderView()}</RevealView>
          </div>
        </main>
      </section>
    </ToastProvider>
  );
}
