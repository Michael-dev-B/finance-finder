import { useState, useEffect, useMemo } from 'react';
import {
  useStore,
  selectMonthlyTotals,
  selectCategorySpend,
  selectBudgetRemaining,
} from '../store/index.js';
import { getAnalyticsTrends } from '../api/analytics.js';
import { currentMonth } from '../lib/date.js';

const TREND_MONTHS = 6;
const TOP_CATEGORIES = 6;

// Same step-back logic TrendsChart uses, kept local (it isn't exported there).
function monthsBack(n, fromMonth) {
  let [y, m] = fromMonth.split('-').map(Number);
  m -= n - 1;
  while (m <= 0) {
    m += 12;
    y--;
  }
  return `${y}-${String(m).padStart(2, '0')}`;
}

/**
 * Data for the real-data journey scenes (and their DOM overlays). The month summary and
 * top categories come from the store selectors (no fetch, reactive to the active month);
 * the multi-month trend comes from the analytics API. All money stays integer cents —
 * only the label layer (formatZAR) ever divides.
 *
 * Read OUTSIDE the R3F <Canvas> (context doesn't cross it) and passed in as props. The
 * return value is memoized so the canvas subtree doesn't reconcile on unrelated App
 * re-renders.
 */
export function useJourneyData() {
  const { state } = useStore();
  const [trends, setTrends] = useState(null);

  const activeMonth = state.activeMonth ?? currentMonth();

  useEffect(() => {
    let cancelled = false;
    const from = monthsBack(TREND_MONTHS, activeMonth);
    getAnalyticsTrends(from, activeMonth)
      .then((rows) => {
        if (cancelled) return;
        setTrends(
          rows.map((r) => ({
            month: r.month,
            income: r.income_cents,
            expense: r.expense_cents,
            net: r.income_cents - r.expense_cents,
          })),
        );
      })
      .catch(() => {
        if (!cancelled) setTrends(null);
      });
    return () => {
      cancelled = true;
    };
  }, [activeMonth]);

  const month = useMemo(() => selectMonthlyTotals(state), [state]);

  const topCats = useMemo(() => {
    const spend = selectCategorySpend(state);
    const byId = new Map(state.categories.map((c) => [c.id, c]));
    return Array.from(spend.entries())
      .map(([id, cents]) => ({
        id,
        name: byId.get(id)?.name ?? 'Uncategorised',
        cents,
        colour: byId.get(id)?.colour ?? null,
      }))
      .sort((a, b) => b.cents - a.cents)
      .slice(0, TOP_CATEGORIES);
  }, [state]);

  // Budgeted categories with spend % — mirrors BudgetManager (status thresholds applied
  // at the scene/overlay layer). Most-stressed first.
  const budget = useMemo(
    () =>
      selectBudgetRemaining(state)
        .map(({ category, spentCents }) => {
          const budgetCents = category.monthly_budget_cents;
          return {
            id: category.id,
            name: category.name,
            colour: category.colour,
            spentCents,
            budgetCents,
            pct: budgetCents ? Math.round((spentCents / budgetCents) * 100) : 0,
          };
        })
        .sort((a, b) => b.pct - a.pct)
        .slice(0, TOP_CATEGORIES),
    [state],
  );

  return useMemo(
    () => ({ activeMonth, month, topCats, trends, budget }),
    [activeMonth, month, topCats, trends, budget],
  );
}
