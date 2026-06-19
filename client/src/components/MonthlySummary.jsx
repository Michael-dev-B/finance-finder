import { useStore, selectMonthlyTotals, selectBudgetRemaining } from '../store/index.js';
import { formatZAR } from '../lib/money.js';

export default function MonthlySummary() {
  const { state } = useStore();
  const { incomeCents, expenseCents, netCents } = selectMonthlyTotals(state);
  const budgets = selectBudgetRemaining(state);

  const netColour =
    netCents > 0 ? 'text-income' : netCents < 0 ? 'text-expense' : 'text-muted';

  return (
    <div className="space-y-4 rounded-lg border border-border bg-surface p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
        This month
      </h2>

      {/* Totals */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <p className="text-xs text-muted">Income</p>
          <p className="mt-0.5 text-lg font-semibold text-income">{formatZAR(incomeCents)}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Expenses</p>
          <p className="mt-0.5 text-lg font-semibold text-expense">{formatZAR(expenseCents)}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Net</p>
          <p className={`mt-0.5 text-lg font-semibold ${netColour}`}>{formatZAR(Math.abs(netCents))}</p>
        </div>
      </div>

      {/* Budget remaining */}
      {budgets.length > 0 && (
        <div className="space-y-2 border-t border-border pt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Budgets</p>
          {budgets.map(({ category, spentCents, remainingCents }) => {
            const pct = Math.min(
              100,
              Math.round((spentCents / category.monthly_budget_cents) * 100),
            );
            const over = remainingCents < 0;
            return (
              <div key={category.id}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: category.colour }}
                    />
                    {category.name}
                  </span>
                  <span className={over ? 'text-expense' : 'text-muted'}>
                    {formatZAR(spentCents)} / {formatZAR(category.monthly_budget_cents)}
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
                  <div
                    className={`h-full rounded-full transition-all ${over ? 'bg-expense' : 'bg-income'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
