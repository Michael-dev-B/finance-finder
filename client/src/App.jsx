import { useState, useEffect } from 'react';
import { useLenis } from 'lenis/react';
import { useStore } from './store/index.js';
import { useReducedMotion } from './motion/useReducedMotion.js';
import { useScrollProgress } from './motion/useScrollProgress.js';
import { ToastProvider } from './components/Toast.jsx';
import HideawayNav from './components/HideawayNav.jsx';
import HeroBackdrop from './three/HeroBackdrop.jsx';
import { useJourneyData } from './three/useJourneyData.js';
import { MonthOverlay, TrendsOverlay, BudgetOverlay } from './components/JourneyOverlays.jsx';
import LazySection from './components/LazySection.jsx';
import MonthBar from './components/MonthBar.jsx';
import {
  DashboardView, TransactionsView,
  CategoriesView, TagsView, RecurringView, BudgetView,
} from './components/WorkspaceViews.jsx';
import AnalysisFilmstrip, { FILMSTRIP_VIEWS } from './components/AnalysisFilmstrip.jsx';
import { ScrollTrigger } from './motion/scrollTrigger.js';

// Rail markers, in scroll order. Each maps to an Act II section #view-<id>.
const VIEW_ORDER = [
  'dashboard', 'transactions', 'income', 'trends', 'analytics',
  'categories', 'tags', 'recurring', 'budget',
];
const VALID_VIEWS = new Set(VIEW_ORDER);
const FILMSTRIP = new Set(FILMSTRIP_VIEWS);

// Act I overlay — brand register. Fades/lifts away as the viewer scrolls past the hero.
// Isolated so scroll updates re-render only the overlay.
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
  const { state } = useStore();
  const reduced = useReducedMotion();
  const lenis = useLenis();
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [editingRecurring, setEditingRecurring] = useState(null);
  const [activeSection, setActiveSection] = useState(null);
  const journey = useJourneyData();

  const contentReady = !(state.loading && state.categories.length === 0);

  function scrollToSection(viewKey) {
    // Filmstrip members live inside the pinned horizontal section: scroll to the slice of
    // the pin's scroll range that brings that panel to centre.
    if (FILMSTRIP.has(viewKey) && lenis && !reduced) {
      const st = ScrollTrigger.getById('analysis');
      if (st) {
        const i = FILMSTRIP_VIEWS.indexOf(viewKey);
        const top = st.start + (i / (FILMSTRIP_VIEWS.length - 1)) * (st.end - st.start);
        lenis.scrollTo(top);
        return;
      }
    }
    const target = document.getElementById(`view-${viewKey}`);
    if (!target) return;
    if (lenis && !reduced) lenis.scrollTo(target);
    else target.scrollIntoView(); // native; instant under the reduced-motion CSS guard
  }

  // Rail highlight: whichever view section is crossing the viewport's vertical centre.
  useEffect(() => {
    if (!contentReady || typeof IntersectionObserver === 'undefined') return;
    const els = VIEW_ORDER
      .map((k) => document.getElementById(`view-${k}`))
      .filter(Boolean);
    if (els.length === 0) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActiveSection(e.target.id.replace('view-', ''));
        });
      },
      { rootMargin: '-50% 0px -50% 0px' },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [contentReady]);

  // Deep links: #budget (etc.) scrolls to that section. Default load starts at the top.
  useEffect(() => {
    if (!contentReady) return;
    function applyHash() {
      const view = window.location.hash.replace('#', '');
      if (VALID_VIEWS.has(view)) scrollToSection(view);
    }
    applyHash();
    window.addEventListener('hashchange', applyHash);
    return () => window.removeEventListener('hashchange', applyHash);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentReady]);

  // Keep ScrollTrigger (the filmstrip pin) in sync with Lenis's smooth scroll.
  useEffect(() => {
    if (!lenis) return;
    lenis.on('scroll', ScrollTrigger.update);
    return () => lenis.off('scroll', ScrollTrigger.update);
  }, [lenis]);

  // Lazy sections change Act II's height as they mount; refresh the pin math (debounced).
  useEffect(() => {
    if (reduced || typeof ResizeObserver === 'undefined') return;
    const el = document.getElementById('act2');
    if (!el) return;
    let t;
    const ro = new ResizeObserver(() => {
      clearTimeout(t);
      t = setTimeout(() => ScrollTrigger.refresh(), 150);
    });
    ro.observe(el);
    return () => {
      ro.disconnect();
      clearTimeout(t);
    };
  }, [reduced, contentReady]);

  if (!contentReady) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg">
        <span className="animate-pulse text-sm text-muted">Loading…</span>
      </div>
    );
  }

  const sectionClass = 'bg-bg pl-14';

  return (
    <ToastProvider>
      <HeroBackdrop data={journey} />
      <HideawayNav activeView={activeSection} onNavigate={scrollToSection} />
      <MonthBar />

      {/* Act I — cinematic hero (brand register); the fixed WebGL canvas shows through. */}
      <section
        id="hero"
        data-register="cinematic"
        className="relative h-[100svh] overflow-hidden"
      >
        <HeroOverlay />
      </section>

      {/* Act I journey — real-data scenes. Transparent for WebGL; opaque under reduced motion. */}
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

      {/* Act II — the working app, toured as a continuous scroll. Each view lazy-mounts as
          it nears the viewport; the rail scrolls between them. */}
      <div id="act2">
        {state.error && (
          <div className="mx-auto max-w-5xl px-4 pl-14 pt-4 sm:px-6">
            <div className="rounded border border-expense/30 bg-expense/10 px-4 py-3 text-sm text-expense">
              {state.error}
            </div>
          </div>
        )}

        <LazySection id="view-dashboard" className={sectionClass}>
          <DashboardView />
        </LazySection>
        <LazySection id="view-transactions" className={sectionClass}>
          <TransactionsView
            editing={editingTransaction}
            onEdit={setEditingTransaction}
            onDone={() => setEditingTransaction(null)}
          />
        </LazySection>
        <AnalysisFilmstrip onActivePanel={setActiveSection} />
        <LazySection id="view-categories" className={sectionClass}>
          <CategoriesView />
        </LazySection>
        <LazySection id="view-tags" className={sectionClass}>
          <TagsView />
        </LazySection>
        <LazySection id="view-recurring" className={sectionClass}>
          <RecurringView
            editing={editingRecurring}
            onEdit={setEditingRecurring}
            onDone={() => setEditingRecurring(null)}
          />
        </LazySection>
        <LazySection id="view-budget" className={sectionClass}>
          <BudgetView />
        </LazySection>
      </div>
    </ToastProvider>
  );
}
