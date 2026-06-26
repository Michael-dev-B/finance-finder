import { useState, useEffect } from 'react';
import { useReducedMotion } from '../motion/useReducedMotion.js';

const NAV = [
  { id: 'dashboard',    label: 'Dashboard',    icon: 'dashboard' },
  { id: 'transactions', label: 'Transactions', icon: 'transactions' },
  { type: 'group', label: 'Analysis' },
  { id: 'income',       label: 'Income',       icon: 'income' },
  { id: 'trends',       label: 'Trends',       icon: 'trends' },
  { id: 'analytics',    label: 'Analytics',    icon: 'analytics' },
  { type: 'group', label: 'Manage' },
  { id: 'categories',   label: 'Categories',   icon: 'categories' },
  { id: 'tags',         label: 'Tags',         icon: 'tags' },
  { id: 'recurring',    label: 'Recurring',    icon: 'recurring' },
  { type: 'sep' },
  { id: 'budget',       label: 'Budget',       icon: 'budget' },
];

// Minimal 1.5px stroke icons, currentColor — no icon dependency.
const ICON_PATHS = {
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </>
  ),
  transactions: (
    <>
      <path d="M8 4 4 8l4 4" />
      <path d="M4 8h16" />
      <path d="m16 20 4-4-4-4" />
      <path d="M20 16H4" />
    </>
  ),
  income: (
    <>
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </>
  ),
  trends: (
    <>
      <path d="M3 3v18h18" />
      <path d="m19 9-5 5-4-4-3 3" />
    </>
  ),
  analytics: (
    <>
      <path d="M3 3v18h18" />
      <rect x="7" y="12" width="3" height="6" rx="0.5" />
      <rect x="12" y="8" width="3" height="10" rx="0.5" />
      <rect x="17" y="5" width="3" height="13" rx="0.5" />
    </>
  ),
  categories: (
    <path d="M3 7a2 2 0 0 1 2-2h3.5l2 2H19a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
  ),
  tags: (
    <>
      <path d="M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L3 13V5a2 2 0 0 1 2-2h8l7.59 7.59a2 2 0 0 1 0 2.82z" />
      <circle cx="7.5" cy="7.5" r="1.5" />
    </>
  ),
  recurring: (
    <>
      <path d="m17 2 4 4-4 4" />
      <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
      <path d="m7 22-4-4 4-4" />
      <path d="M21 13v1a4 4 0 0 1-4 4H3" />
    </>
  ),
  budget: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
    </>
  ),
};

function NavIcon({ name }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICON_PATHS[name]}
    </svg>
  );
}

function isTyping(target) {
  if (!target) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
}

/**
 * Hideaway navigation: a slim icon rail tucked at the left edge that expands to
 * labels on hover / keyboard focus, or stays open when pinned. Jumping to a view is
 * instant (in Phase 2 the same onNavigate will also drive the scroll teleport).
 *
 * Layout note: the rail keeps a constant w-14 slot in flow; the expanded panel is an
 * absolute overlay, so the workspace (and its charts) never reflow on hover.
 */
export default function HideawayNav({ activeView, onNavigate }) {
  const reduced = useReducedMotion();
  const [pinned, setPinned] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const expanded = pinned || hovered || focused;

  useEffect(() => {
    function onKey(e) {
      if (e.key === '\\' && !isTyping(e.target)) {
        e.preventDefault();
        setPinned((p) => !p);
      } else if (e.key === 'Escape') {
        setPinned(false);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const widthTransition = reduced ? '' : 'transition-[width] duration-300 ease-out';
  const labelTransition = reduced ? '' : 'transition-opacity duration-200 ease-out';
  const label = (extra = '') =>
    `whitespace-nowrap ${expanded ? 'opacity-100' : 'opacity-0'} ${labelTransition} ${extra}`;

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-y-0 left-0 z-30 w-14"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setFocused(false);
      }}
    >
      <div
        className={`absolute inset-y-0 left-0 flex flex-col overflow-hidden border-r border-border bg-surface py-3 ${
          expanded ? 'w-56' : 'w-14'
        } ${widthTransition}`}
      >
        {/* Pin / expand handle */}
        <button
          type="button"
          onClick={() => setPinned((p) => !p)}
          aria-expanded={expanded}
          aria-label={pinned ? 'Collapse navigation' : 'Expand navigation'}
          className="mx-2 mb-2 flex h-9 items-center gap-3 rounded px-2.5 text-muted hover:text-ink"
        >
          <span className="grid w-5 shrink-0 place-items-center">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </span>
          <span className={label('text-xs font-semibold uppercase tracking-wide')}>Menu</span>
        </button>

        <div className="flex-1 overflow-y-auto px-2">
          {NAV.map((item, i) => {
            if (item.type === 'sep') {
              return <div key={i} className="my-2 h-px bg-border" />;
            }
            if (item.type === 'group') {
              return (
                <p
                  key={i}
                  className={label('mb-0.5 mt-3 h-4 px-2 text-xs font-medium uppercase tracking-wide text-muted')}
                >
                  {item.label}
                </p>
              );
            }
            const active = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                aria-current={active ? 'page' : undefined}
                title={item.label}
                className={`mb-0.5 flex h-9 w-full items-center gap-3 rounded px-2.5 text-left text-sm transition-colors duration-150 ${
                  active ? 'bg-accent font-semibold text-ink' : 'font-medium text-muted hover:text-ink'
                }`}
              >
                <span className="grid w-5 shrink-0 place-items-center">
                  <NavIcon name={item.icon} />
                </span>
                <span className={label()}>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Keyboard hint — only meaningful once expanded */}
        <p className={label('mt-2 px-4 text-xs text-muted')}>
          <kbd className="font-mono">\</kbd> pin · <kbd className="font-mono">esc</kbd> close
        </p>
      </div>
    </nav>
  );
}
