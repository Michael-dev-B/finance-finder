import { useState } from 'react';
import { useStore, UPDATE_TRANSACTION, ADD_TRANSACTION } from '../store/index.js';
import { splitTransaction } from '../api/transactions.js';
import { formatZAR, parseCentsFromInput } from '../lib/money.js';

const EMPTY_ROW = { amount: '', categoryId: '', note: '' };

export default function SplitModal({ transaction, onClose }) {
  const { state, dispatch } = useStore();
  const [rows, setRows] = useState([EMPTY_ROW, EMPTY_ROW]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const parentCents = transaction.amount_cents;
  const totalCents  = rows.reduce((s, r) => s + (parseCentsFromInput(r.amount) || 0), 0);
  const balanced    = totalCents === parentCents;

  function updateRow(i, key, value) {
    setRows((prev) => prev.map((r, idx) => idx === i ? { ...r, [key]: value } : r));
  }

  function addRow() {
    setRows((prev) => [...prev, EMPTY_ROW]);
  }

  function removeRow(i) {
    if (rows.length <= 2) return;
    setRows((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!balanced) { setError('Split amounts must add up to the original transaction amount.'); return; }

    const splits = rows.map((r) => ({
      amount_cents: parseCentsFromInput(r.amount),
      category_id:  r.categoryId ? Number(r.categoryId) : null,
      note:         r.note || null,
    }));

    if (splits.some((s) => !s.amount_cents || s.amount_cents <= 0)) {
      setError('All split amounts must be greater than zero.'); return;
    }

    setError('');
    setSaving(true);
    try {
      const { parent, children } = await splitTransaction(transaction.id, splits);
      dispatch({ type: UPDATE_TRANSACTION, payload: parent });
      for (const child of children) {
        if (child.occurred_on.startsWith(state.activeMonth)) {
          dispatch({ type: ADD_TRANSACTION, payload: child });
        }
      }
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 p-4">
      <div className="w-full max-w-lg rounded-lg border border-border bg-surface">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-sm font-semibold text-ink">
            Split transaction — {formatZAR(parentCents)}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          {error && <p className="text-sm text-expense">{error}</p>}

          <div className="space-y-2">
            {rows.map((row, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0,00"
                  value={row.amount}
                  onChange={(e) => updateRow(i, 'amount', e.target.value)}
                  className="w-28 rounded border border-border bg-bg px-2 py-1.5 text-sm text-ink placeholder:text-muted focus:border-accent focus:outline-none"
                />
                <select
                  value={row.categoryId}
                  onChange={(e) => updateRow(i, 'categoryId', e.target.value)}
                  className="flex-1 rounded border border-border bg-bg px-2 py-1.5 text-sm text-ink focus:border-accent focus:outline-none"
                >
                  <option value="">Uncategorised</option>
                  {state.categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Note"
                  value={row.note}
                  onChange={(e) => updateRow(i, 'note', e.target.value)}
                  className="flex-1 rounded border border-border bg-bg px-2 py-1.5 text-sm text-ink placeholder:text-muted focus:border-accent focus:outline-none"
                />
                {rows.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeRow(i)}
                    className="text-xs text-muted hover:text-expense"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={addRow}
              className="text-accent hover:opacity-80"
            >
              + Add row
            </button>
            <span className={balanced ? 'text-income' : 'text-expense'}>
              Total: {formatZAR(totalCents)} / {formatZAR(parentCents)}
            </span>
          </div>

          <div className="flex gap-3 border-t border-border pt-4">
            <button
              type="submit"
              disabled={saving || !balanced}
              className="rounded bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {saving ? 'Splitting…' : 'Confirm split'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-border px-4 py-2 text-sm text-muted hover:text-ink"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
