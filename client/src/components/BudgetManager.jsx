import { useState } from 'react';
import { useStore, UPDATE_CATEGORY, selectCategorySpend } from '../store/index.js';
import { updateCategory } from '../api/categories.js';
import { formatZAR, parseCentsFromInput } from '../lib/money.js';

function statusInfo(pct) {
  if (pct > 100)  return { label: 'Over budget', colour: 'text-expense',  barColour: 'bg-expense'  };
  if (pct >= 80)  return { label: 'At risk',     colour: 'text-primary',  barColour: 'bg-primary'  };
  return               { label: 'On track',      colour: 'text-income',   barColour: 'bg-income'   };
}

function ProgressBar({ pct }) {
  const { barColour } = statusInfo(pct);
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-border">
      <div className={`h-full rounded-full transition-all ${barColour}`} style={{ width: `${Math.min(pct, 100)}%` }} />
    </div>
  );
}

function BudgetCell({ cat, dispatch }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue]     = useState('');

  function startEdit() {
    setValue(cat.monthly_budget_cents != null ? (cat.monthly_budget_cents / 100).toFixed(2).replace('.', ',') : '');
    setEditing(true);
  }

  async function save() {
    const cents = parseCentsFromInput(value);
    if (cents && cents > 0) {
      const updated = await updateCategory(cat.id, {
        name: cat.name, colour: cat.colour, monthly_budget_cents: cents, group_id: cat.group_id,
      });
      dispatch({ type: UPDATE_CATEGORY, payload: updated });
    }
    setEditing(false);
  }

  if (editing) {
    return (
      <input
        type="text"
        autoFocus
        aria-label={`Budget for ${cat.name}`}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false); }}
        className="w-24 rounded border border-accent bg-bg px-2 py-0.5 text-right text-sm text-ink focus:outline-none"
      />
    );
  }

  if (cat.monthly_budget_cents != null) {
    return (
      <button onClick={startEdit} className="text-sm text-ink hover:text-accent" title="Click to edit budget">
        {formatZAR(cat.monthly_budget_cents)}
      </button>
    );
  }

  return (
    <button onClick={startEdit} className="text-xs text-muted hover:text-accent">
      Set budget
    </button>
  );
}

export default function BudgetManager() {
  const { state, dispatch } = useStore();
  const spend = selectCategorySpend(state);
  const [openGroups, setOpenGroups] = useState(() => new Set(['__ungrouped__']));

  function toggleGroup(id) {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const groupMap = new Map(state.categoryGroups.map((g) => [g.id, g]));
  const grouped = new Map();
  const ungrouped = [];

  for (const cat of state.categories) {
    if (cat.group_id) {
      if (!grouped.has(cat.group_id)) grouped.set(cat.group_id, []);
      grouped.get(cat.group_id).push(cat);
    } else {
      ungrouped.push(cat);
    }
  }

  const totalBudgeted = state.categories.reduce((s, c) => s + (c.monthly_budget_cents ?? 0), 0);
  const totalSpent    = Array.from(spend.values()).reduce((s, v) => s + v, 0);
  const hasBudgets    = state.categories.some((c) => c.monthly_budget_cents != null);

  function buildRow(cat) {
    const spent     = spend.get(cat.id) ?? 0;
    const budget    = cat.monthly_budget_cents;
    const remaining = budget != null ? budget - spent : null;
    const pct       = budget ? Math.round((spent / budget) * 100) : 0;
    return { cat, spent, budget, remaining, pct, ...statusInfo(pct) };
  }

  function exportCSV() {
    const rows   = state.categories.filter((c) => c.monthly_budget_cents != null).map(buildRow);
    const header = 'Category,Budget (R),Spent (R),Remaining (R),Status';
    const lines  = rows.map(
      (r) => `${r.cat.name},${(r.budget / 100).toFixed(2)},${(r.spent / 100).toFixed(2)},${(r.remaining / 100).toFixed(2)},${r.label}`,
    );
    const blob = new Blob([header + '\n' + lines.join('\n')], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `budget-${state.activeMonth}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function renderCategory(cat) {
    const { spent, budget, remaining, pct, label, colour } = buildRow(cat);

    return (
      <div key={cat.id} className="flex items-center gap-3 py-2.5">
        <span className="inline-block h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: cat.colour }} />
        <span className="min-w-0 flex-1 truncate text-sm text-ink">{cat.name}</span>
        <div className="w-24 text-right">
          <BudgetCell cat={cat} dispatch={dispatch} />
        </div>
        <span className={`w-20 text-right text-sm ${budget && spent > budget ? 'text-expense' : 'text-muted'}`}>
          {formatZAR(spent)}
        </span>
        <span className={`w-24 text-right text-sm font-medium ${
          remaining == null ? 'text-muted' : remaining < 0 ? 'text-expense' : 'text-muted'
        }`}>
          {remaining == null ? '—' : remaining < 0 ? `−${formatZAR(-remaining)}` : formatZAR(remaining)}
        </span>
        <div className="w-24">
          <ProgressBar pct={budget ? pct : 0} />
        </div>
        <span className={`w-20 text-right text-xs font-medium ${budget != null ? colour : 'text-muted'}`}>
          {budget != null ? label : '—'}
        </span>
      </div>
    );
  }

  function renderSection(label, cats, groupId) {
    const isOpen = openGroups.has(groupId);
    return (
      <div key={groupId} className="border-t border-border first:border-t-0">
        <button
          onClick={() => toggleGroup(groupId)}
          className="flex w-full items-center justify-between py-2 text-xs font-medium uppercase tracking-wide text-muted hover:text-ink"
        >
          <span>{label}</span>
          <span>{isOpen ? '▴' : '▾'}</span>
        </button>
        {isOpen && <div className="pb-2">{cats.map(renderCategory)}</div>}
      </div>
    );
  }

  if (state.categories.length === 0) {
    return <p className="text-sm text-muted">No categories yet.</p>;
  }

  return (
    <div className="space-y-1">
      {/* Column headers row */}
      <div className="flex items-center gap-3 pb-1">
        <div className="flex flex-1 items-center gap-3 text-xs font-medium uppercase tracking-wide text-muted">
          <span className="h-3 w-3 shrink-0" />
          <span className="flex-1">Category</span>
          <span className="w-24 text-right">Budget</span>
          <span className="w-20 text-right">Spent</span>
          <span className="w-24 text-right">Remaining</span>
          <span className="w-24 text-center">Progress</span>
          <span className="w-20 text-right">Status</span>
        </div>
        {hasBudgets && (
          <button
            onClick={exportCSV}
            className="ml-4 shrink-0 rounded border border-border px-3 py-1.5 text-xs text-muted hover:text-ink"
          >
            Export CSV
          </button>
        )}
      </div>

      {/* Groups */}
      {Array.from(grouped.entries()).map(([gid, cats]) => {
        const group = groupMap.get(gid);
        return renderSection(group?.name ?? 'Group', cats, String(gid));
      })}

      {/* Ungrouped */}
      {ungrouped.length > 0 && renderSection('Ungrouped', ungrouped, '__ungrouped__')}

      {/* Footer totals */}
      <div className="flex items-center gap-3 border-t border-border pt-3 text-xs font-medium text-muted">
        <span className="h-3 w-3 shrink-0" />
        <span className="flex-1">Total</span>
        <span className="w-24 text-right font-semibold text-ink">{formatZAR(totalBudgeted)}</span>
        <span className="w-20 text-right font-semibold text-ink">{formatZAR(totalSpent)}</span>
        <span className="w-24" />
        <span className="w-24" />
        <span className="w-20" />
      </div>
    </div>
  );
}
