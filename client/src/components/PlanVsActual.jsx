import { useStore, selectCategorySpend } from '../store/index.js';
import { formatZAR } from '../lib/money.js';

function statusInfo(pct) {
  if (pct > 1)    return { label: 'Over budget', colour: 'text-expense' };
  if (pct >= 0.8) return { label: 'At risk',     colour: 'text-primary' };
  return               { label: 'On track',      colour: 'text-income' };
}

export default function PlanVsActual() {
  const { state } = useStore();
  const spend = selectCategorySpend(state);

  const budgeted = state.categories.filter((c) => c.monthly_budget_cents != null);

  if (budgeted.length === 0) {
    return (
      <p className="text-sm text-muted">
        No budgeted categories yet. Set a budget in the Budget section above.
      </p>
    );
  }

  const rows = budgeted.map((cat) => {
    const spent     = spend.get(cat.id) ?? 0;
    const budget    = cat.monthly_budget_cents;
    const remaining = budget - spent;
    const pct       = spent / budget;
    return { cat, spent, budget, remaining, pct, ...statusInfo(pct) };
  });

  function exportCSV() {
    const header = 'Category,Budget (R),Spent (R),Remaining (R),Status';
    const lines  = rows.map(
      (r) =>
        `${r.cat.name},${(r.budget / 100).toFixed(2)},${(r.spent / 100).toFixed(2)},${(r.remaining / 100).toFixed(2)},${r.label}`,
    );
    const blob = new Blob([header + '\n' + lines.join('\n')], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `budget-${state.activeMonth}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">Plan vs actual</h3>
        <button
          onClick={exportCSV}
          className="rounded border border-border px-3 py-1.5 text-xs text-muted hover:text-ink"
        >
          Export CSV
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-bg text-left text-xs font-medium uppercase tracking-wide text-muted">
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3 text-right">Budget</th>
              <th className="px-4 py-3 text-right">Spent</th>
              <th className="px-4 py-3 text-right">Remaining</th>
              <th className="px-4 py-3 w-28">Progress</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-bg">
            {rows.map(({ cat, spent, budget, remaining, pct, label, colour }) => {
              const barPct  = Math.min(pct * 100, 100);
              const barColour =
                pct > 1 ? 'bg-expense' : pct >= 0.8 ? 'bg-primary' : 'bg-income';
              return (
                <tr key={cat.id} className="hover:bg-surface">
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2">
                      <span className="inline-block h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: cat.colour }} />
                      <span className="text-ink">{cat.name}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-ink">{formatZAR(budget)}</td>
                  <td className="px-4 py-3 text-right text-ink">{formatZAR(spent)}</td>
                  <td className={`px-4 py-3 text-right font-medium ${remaining < 0 ? 'text-expense' : 'text-muted'}`}>
                    {remaining < 0 ? `−${formatZAR(-remaining)}` : formatZAR(remaining)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-border">
                      <div className={`h-full rounded-full ${barColour}`} style={{ width: `${barPct}%` }} />
                    </div>
                  </td>
                  <td className={`px-4 py-3 text-xs font-medium ${colour}`}>{label}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
