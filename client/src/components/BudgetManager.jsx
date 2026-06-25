import { useState } from 'react';
import { useStore, UPDATE_CATEGORY, selectCategorySpend } from '../store/index.js';
import { updateCategory } from '../api/categories.js';
import { formatZAR, parseCentsFromInput } from '../lib/money.js';

function ProgressBar({ pct }) {
  const colour =
    pct > 100 ? 'bg-expense' : pct >= 80 ? 'bg-primary' : 'bg-income';
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
      <div className={`h-full rounded-full transition-all ${colour}`} style={{ width: `${Math.min(pct, 100)}%` }} />
    </div>
  );
}

function BudgetCell({ cat, spent, dispatch }) {
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
      <button onClick={startEdit} className="text-sm text-ink hover:text-accent" title="Click to edit">
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

  const totalBudgeted = state.categories.reduce(
    (s, c) => s + (c.monthly_budget_cents ?? 0), 0,
  );
  const totalSpent = Array.from(spend.values()).reduce((s, v) => s + v, 0);

  function renderCategory(cat) {
    const spentCents = spend.get(cat.id) ?? 0;
    const budget     = cat.monthly_budget_cents;
    const pct        = budget ? Math.round((spentCents / budget) * 100) : 0;
    const over        = budget && spentCents > budget;

    return (
      <div key={cat.id} className="flex items-center gap-3 py-2.5">
        <span
          className="inline-block h-3 w-3 shrink-0 rounded-full"
          style={{ backgroundColor: cat.colour }}
        />
        <span className="min-w-0 flex-1 truncate text-sm text-ink">{cat.name}</span>
        <div className="w-24">
          <ProgressBar pct={budget ? pct : 0} />
        </div>
        <span className={`w-20 text-right text-sm ${over ? 'text-expense' : 'text-muted'}`}>
          {formatZAR(spentCents)}
        </span>
        <span className="text-xs text-muted">/</span>
        <div className="w-24 text-right">
          <BudgetCell cat={cat} spent={spentCents} dispatch={dispatch} />
        </div>
        {budget != null && (
          <span className={`w-16 text-right text-xs ${over ? 'text-expense' : pct >= 80 ? 'text-primary' : 'text-income'}`}>
            {over ? `Over ${formatZAR(spentCents - budget)}` : `${pct}%`}
          </span>
        )}
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
      {/* Column headers */}
      <div className="flex items-center gap-3 pb-1 text-xs font-medium uppercase tracking-wide text-muted">
        <span className="h-3 w-3 shrink-0" />
        <span className="flex-1">Category</span>
        <span className="w-24 text-center">Progress</span>
        <span className="w-20 text-right">Spent</span>
        <span className="w-5" />
        <span className="w-24 text-right">Budget</span>
        <span className="w-16 text-right">Status</span>
      </div>

      {/* Groups */}
      {Array.from(grouped.entries()).map(([gid, cats]) => {
        const group = groupMap.get(gid);
        return renderSection(group?.name ?? 'Group', cats, String(gid));
      })}

      {/* Ungrouped */}
      {ungrouped.length > 0 && renderSection('Ungrouped', ungrouped, '__ungrouped__')}

      {/* Footer */}
      <div className="flex items-center gap-3 border-t border-border pt-3 text-xs font-medium text-muted">
        <span className="h-3 w-3 shrink-0" />
        <span className="flex-1">Total</span>
        <span className="w-24" />
        <span className="w-20 text-right font-semibold text-ink">{formatZAR(totalSpent)}</span>
        <span className="w-5" />
        <span className="w-24 text-right font-semibold text-ink">{formatZAR(totalBudgeted)}</span>
        <span className="w-16" />
      </div>
    </div>
  );
}
