import { useReducedMotion } from '../motion/useReducedMotion.js';
import { useSectionFocus } from '../motion/useScrollProgress.js';
import { formatZAR } from '../lib/money.js';
import { monthLabel } from '../lib/date.js';

// Section indices in the scroll spine: 0 hero · 1 this-month · 2 trends · 3 workspace.
const SECTION_MONTH = 1;
const SECTION_TRENDS = 2;

function overlayStyle(focus) {
  return { opacity: focus, transform: `translateY(${(1 - focus) * 24}px)` };
}

/**
 * Act I "This Month" overlay — net headline + income/out. Under reduced motion it also
 * renders the category breakdown as CSS bars (the non-WebGL fallback); with WebGL on, the
 * 3D towers carry magnitude and the overlay just lists the category labels.
 */
export function MonthOverlay({ data }) {
  const reduced = useReducedMotion();
  const focus = useSectionFocus(SECTION_MONTH);
  const { activeMonth, month, topCats } = data;
  const net = month.netCents;
  const netColor = net >= 0 ? 'text-income' : 'text-expense';
  const maxCents = topCats.reduce((m, c) => Math.max(m, c.cents), 0) || 1;

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center gap-7 px-6 text-center"
      style={overlayStyle(focus)}
    >
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">
          {monthLabel(activeMonth)}
        </p>
        <p className={`mt-2 whitespace-nowrap text-4xl font-bold leading-none tracking-tight sm:text-6xl ${netColor}`}>
          {formatZAR(net)}
        </p>
        <p className="mt-3 text-sm text-muted">
          <span className="text-income">{formatZAR(month.incomeCents)}</span> in ·{' '}
          <span className="text-expense">{formatZAR(month.expenseCents)}</span> out
        </p>
      </div>

      {reduced && topCats.length > 0 && (
        <div className="w-full max-w-sm space-y-2 text-left">
          {topCats.map((c) => (
            <div key={c.id} className="flex items-center gap-3">
              <span className="w-24 shrink-0 truncate text-xs text-muted">{c.name}</span>
              <span className="h-2 flex-1 rounded-full bg-border">
                <span
                  className="block h-full rounded-full"
                  style={{ width: `${(c.cents / maxCents) * 100}%`, background: c.colour ?? 'var(--color-muted)' }}
                />
              </span>
              <span className="w-20 shrink-0 text-right text-xs text-ink">{formatZAR(c.cents)}</span>
            </div>
          ))}
        </div>
      )}

      {!reduced && topCats.length > 0 && (
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted">
          {topCats.map((c) => (
            <span key={c.id} className="inline-flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full" style={{ background: c.colour ?? 'var(--color-muted)' }} />
              {c.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Act I "Trends" overlay — heading + legend. Under reduced motion it renders per-month net
 * bars (the non-WebGL fallback); with WebGL on, the 3D trend lines carry the shape.
 */
export function TrendsOverlay({ data }) {
  const reduced = useReducedMotion();
  const focus = useSectionFocus(SECTION_TRENDS);
  const { trends } = data;
  const hasData = trends && trends.some((t) => t.income > 0 || t.expense > 0);
  const maxAbs = hasData ? trends.reduce((m, t) => Math.max(m, Math.abs(t.net)), 0) || 1 : 1;

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center gap-7 px-6 text-center"
      style={overlayStyle(focus)}
    >
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">
          Last {trends?.length ?? 6} months
        </p>
        <h2 className="mt-2 text-[length:var(--text-display)] font-bold leading-none tracking-tight text-ink">
          The trend
        </h2>
      </div>

      {!hasData ? (
        <p className="text-sm text-muted">
          {trends == null ? 'Loading…' : 'Not enough history yet.'}
        </p>
      ) : reduced ? (
        <div className="flex items-end gap-2" style={{ height: 96 }}>
          {trends.map((t) => (
            <div key={t.month} className="flex w-8 flex-col items-center gap-1">
              <span
                className="rounded-sm"
                style={{
                  height: Math.max(4, (Math.abs(t.net) / maxAbs) * 92),
                  width: 10,
                  background: t.net >= 0 ? 'var(--color-income)' : 'var(--color-expense)',
                }}
              />
              <span className="text-[10px] text-muted">{t.month.slice(5)}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-wrap justify-center gap-x-4 text-xs text-muted">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: 'var(--color-income)' }} />
            Income
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: 'var(--color-expense)' }} />
            Expense
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: 'var(--color-primary)' }} />
            Net
          </span>
        </div>
      )}
    </div>
  );
}
