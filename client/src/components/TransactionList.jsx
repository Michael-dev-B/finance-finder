import { useState, useRef } from 'react';
import { useStore, DELETE_TRANSACTION, UPDATE_TRANSACTION } from '../store/index.js';
import { useToast } from './Toast.jsx';
import { deleteTransaction, updateTransaction } from '../api/transactions.js';
import { formatZAR } from '../lib/money.js';
import { toDisplayDate, monthLabel } from '../lib/date.js';
import SplitModal from './SplitModal.jsx';

const EMPTY_FILTER = { search: '', type: '', categoryId: '', tagId: '', reviewed: '' };

export default function TransactionList({ onEdit }) {
  const { state, dispatch } = useStore();
  const categoryMap = new Map(state.categories.map((c) => [c.id, c]));

  const toast = useToast();
  const [filter, setFilter]       = useState(EMPTY_FILTER);
  const [selected, setSelected]   = useState(new Set());
  const [marking, setMarking]     = useState(false);
  const [splitting, setSplitting] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const deleteTimer = useRef(null);

  function setF(key, value) {
    setFilter((f) => ({ ...f, [key]: value }));
  }

  const activeFilters = Object.values(filter).filter(Boolean).length;

  const visible = state.transactions.filter((t) => {
    if (filter.search && !t.note?.toLowerCase().includes(filter.search.toLowerCase())) return false;
    if (filter.type && t.type !== filter.type) return false;
    if (filter.categoryId && t.category_id !== Number(filter.categoryId)) return false;
    if (filter.tagId && !t.tags?.some((tg) => tg.id === Number(filter.tagId))) return false;
    if (filter.reviewed !== '' && t.is_reviewed !== Number(filter.reviewed)) return false;
    return true;
  });

  async function handleDelete(id) {
    await deleteTransaction(id);
    dispatch({ type: DELETE_TRANSACTION, payload: id });
    setSelected((s) => { const next = new Set(s); next.delete(id); return next; });
    toast('Transaction deleted');
  }

  function requestDelete(id) {
    clearTimeout(deleteTimer.current);
    setPendingDelete(id);
    deleteTimer.current = setTimeout(() => setPendingDelete(null), 5000);
  }

  function cancelDelete() {
    clearTimeout(deleteTimer.current);
    setPendingDelete(null);
  }

  async function confirmDelete(id) {
    clearTimeout(deleteTimer.current);
    setPendingDelete(null);
    await handleDelete(id);
  }

  function toggleSelect(id) {
    setSelected((s) => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function markReviewed() {
    setMarking(true);
    try {
      for (const id of selected) {
        const t = state.transactions.find((tx) => tx.id === id);
        if (!t || t.is_reviewed) continue;
        const updated = await updateTransaction(id, {
          amount_cents: t.amount_cents,
          type:         t.type,
          category_id:  t.category_id,
          occurred_on:  t.occurred_on,
          note:         t.note,
          tag_ids:      t.tags?.map((tg) => tg.id) ?? [],
          is_reviewed:  1,
        });
        dispatch({ type: UPDATE_TRANSACTION, payload: updated });
      }
      setSelected(new Set());
    } finally {
      setMarking(false);
    }
  }

  const showBulkBar = selected.size > 0;

  if (state.transactions.length === 0 && !state.loading) {
    return (
      <p className="py-10 text-center text-sm text-muted">
        No transactions for {monthLabel(state.activeMonth)}.
      </p>
    );
  }

  return (
    <>
      {splitting && (
        <SplitModal
          transaction={splitting}
          onClose={() => setSplitting(null)}
        />
      )}

      {/* Filter bar */}
      <div className="mb-4 flex flex-wrap items-center gap-2 rounded border border-border bg-surface px-4 py-3">
        <input
          type="text"
          placeholder="Search notes…"
          value={filter.search}
          onChange={(e) => setF('search', e.target.value)}
          className="rounded border border-border bg-bg px-3 py-1.5 text-sm text-ink placeholder:text-muted focus:border-accent focus:outline-none"
        />
        <select
          value={filter.type}
          onChange={(e) => setF('type', e.target.value)}
          className="rounded border border-border bg-bg px-2 py-1.5 text-sm text-ink focus:border-accent focus:outline-none"
        >
          <option value="">All types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
        <select
          value={filter.categoryId}
          onChange={(e) => setF('categoryId', e.target.value)}
          className="rounded border border-border bg-bg px-2 py-1.5 text-sm text-ink focus:border-accent focus:outline-none"
        >
          <option value="">All categories</option>
          {state.categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        {state.tags.length > 0 && (
          <select
            value={filter.tagId}
            onChange={(e) => setF('tagId', e.target.value)}
            className="rounded border border-border bg-bg px-2 py-1.5 text-sm text-ink focus:border-accent focus:outline-none"
          >
            <option value="">All tags</option>
            {state.tags.map((tg) => (
              <option key={tg.id} value={tg.id}>{tg.name}</option>
            ))}
          </select>
        )}
        <select
          value={filter.reviewed}
          onChange={(e) => setF('reviewed', e.target.value)}
          className="rounded border border-border bg-bg px-2 py-1.5 text-sm text-ink focus:border-accent focus:outline-none"
        >
          <option value="">All</option>
          <option value="0">Unreviewed</option>
          <option value="1">Reviewed</option>
        </select>
        {activeFilters > 0 && (
          <button
            onClick={() => setFilter(EMPTY_FILTER)}
            className="rounded border border-border px-2 py-1.5 text-xs text-muted hover:text-ink"
          >
            Clear ({activeFilters})
          </button>
        )}
        {showBulkBar && (
          <button
            onClick={markReviewed}
            disabled={marking}
            className="ml-auto rounded bg-accent px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {marking ? 'Saving…' : `Mark ${selected.size} reviewed`}
          </button>
        )}
      </div>

      {visible.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted">No transactions match your filters.</p>
      ) : (
        <div className={`overflow-x-auto rounded-lg border border-border transition-opacity duration-150${state.loading && state.transactions.length > 0 ? ' opacity-50 pointer-events-none' : ''}`}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-bg text-left text-xs font-medium uppercase tracking-wide text-muted">
                <th className="px-3 py-3 w-8"></th>
                <th className="px-4 py-3">Date</th>
                <th className="hidden px-4 py-3 sm:table-cell">Note</th>
                <th className="px-4 py-3">Category / Tags</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-bg">
              {visible.map((t) => {
                const cat = t.category_id ? categoryMap.get(t.category_id) : null;
                const isChild = t.split_of != null;
                return (
                  <tr key={t.id} className={`hover:bg-surface${t.is_reviewed ? ' opacity-60' : ''}`}>
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(t.id)}
                        onChange={() => toggleSelect(t.id)}
                        className="accent-accent"
                      />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted">
                      <span className="flex items-center gap-1">
                        {isChild && <span className="text-muted">↳</span>}
                        {toDisplayDate(t.occurred_on)}
                        {t.is_reviewed === 1 && <span className="text-xs text-muted">✓</span>}
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 text-ink sm:table-cell">
                      {t.note || <span className="text-muted">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="flex items-center gap-1.5">
                          <span
                            className="inline-block h-3 w-3 shrink-0 rounded-full"
                            style={{ backgroundColor: cat?.colour ?? 'var(--color-muted)' }}
                          />
                          <span className="text-muted">{cat?.name ?? 'Uncategorised'}</span>
                        </span>
                        {t.tags?.map((tag) => (
                          <span
                            key={tag.id}
                            className="rounded-full border px-2 py-0.5 text-xs"
                            style={{ borderColor: tag.colour, color: tag.colour }}
                          >
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <span className={t.type === 'income' ? 'font-medium text-income' : 'font-medium text-expense'}>
                        {t.type === 'income' ? '+' : '−'} {formatZAR(t.amount_cents)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        {!isChild && !t.has_splits && (
                          <button
                            onClick={() => setSplitting(t)}
                            className="text-xs text-muted hover:text-ink"
                          >
                            Split
                          </button>
                        )}
                        <button
                          onClick={() => onEdit(t)}
                          className="text-xs text-muted hover:text-ink"
                        >
                          Edit
                        </button>
                        {pendingDelete === t.id ? (
                          <>
                            <button
                              onClick={cancelDelete}
                              className="text-xs text-muted hover:text-ink"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => confirmDelete(t.id)}
                              className="text-xs font-medium text-expense hover:opacity-80"
                            >
                              Delete!
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => requestDelete(t.id)}
                            className="text-xs text-muted hover:text-expense"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
