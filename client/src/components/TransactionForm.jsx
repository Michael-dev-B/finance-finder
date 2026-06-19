import { useState, useEffect } from 'react';
import { useStore, ADD_TRANSACTION, UPDATE_TRANSACTION } from '../store/index.js';
import { createTransaction, updateTransaction } from '../api/transactions.js';
import { parseCentsFromInput } from '../lib/money.js';

function todayISO() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

const DEFAULTS = { amount: '', type: 'expense', categoryId: '', date: todayISO(), note: '' };

export default function TransactionForm({ editing, onDone }) {
  const { state, dispatch } = useStore();
  const [fields, setFields] = useState(DEFAULTS);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editing) {
      setFields({
        amount: (editing.amount_cents / 100).toFixed(2).replace('.', ','),
        type: editing.type,
        categoryId: editing.category_id ?? '',
        date: editing.occurred_on,
        note: editing.note ?? '',
      });
    } else {
      setFields(DEFAULTS);
    }
    setError('');
  }, [editing]);

  function set(key, value) {
    setFields((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const cents = parseCentsFromInput(fields.amount);
    if (!cents || isNaN(cents) || cents <= 0) {
      setError('Enter a valid amount (e.g. 150,00)');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fields.date)) {
      setError('Enter a valid date');
      return;
    }
    setError('');
    setSaving(true);

    const payload = {
      amount_cents: cents,
      type: fields.type,
      category_id: fields.categoryId ? Number(fields.categoryId) : null,
      occurred_on: fields.date,
      note: fields.note || null,
    };

    try {
      if (editing) {
        const updated = await updateTransaction(editing.id, payload);
        dispatch({ type: UPDATE_TRANSACTION, payload: updated });
      } else {
        const created = await createTransaction(payload);
        // Only add to list if it belongs to the active month
        if (created.occurred_on.startsWith(state.activeMonth)) {
          dispatch({ type: ADD_TRANSACTION, payload: created });
        }
      }
      onDone();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-sm text-expense">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Amount */}
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">Amount (R)</label>
          <input
            type="text"
            inputMode="decimal"
            placeholder="0,00"
            value={fields.amount}
            onChange={(e) => set('amount', e.target.value)}
            className="w-full rounded border border-border bg-bg px-3 py-2 text-ink placeholder:text-muted focus:border-accent focus:outline-none"
          />
        </div>

        {/* Date */}
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">Date</label>
          <input
            type="date"
            value={fields.date}
            onChange={(e) => set('date', e.target.value)}
            className="w-full rounded border border-border bg-bg px-3 py-2 text-ink focus:border-accent focus:outline-none"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Type */}
        <div>
          <span className="mb-1 block text-sm font-medium text-ink">Type</span>
          <div className="flex gap-4">
            {['expense', 'income'].map((t) => (
              <label key={t} className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="type"
                  value={t}
                  checked={fields.type === t}
                  onChange={() => set('type', t)}
                  className="accent-accent"
                />
                <span className={t === 'income' ? 'text-income' : 'text-expense'}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">Category</label>
          <select
            value={fields.categoryId}
            onChange={(e) => set('categoryId', e.target.value)}
            className="w-full rounded border border-border bg-bg px-3 py-2 text-ink focus:border-accent focus:outline-none"
          >
            <option value="">Uncategorised</option>
            {state.categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Note */}
      <div>
        <label className="mb-1 block text-sm font-medium text-ink">Note (optional)</label>
        <input
          type="text"
          placeholder="e.g. Woolworths groceries"
          value={fields.note}
          onChange={(e) => set('note', e.target.value)}
          className="w-full rounded border border-border bg-bg px-3 py-2 text-ink placeholder:text-muted focus:border-accent focus:outline-none"
        />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {saving ? 'Saving…' : editing ? 'Update' : 'Add transaction'}
        </button>
        {editing && (
          <button
            type="button"
            onClick={onDone}
            className="rounded border border-border px-4 py-2 text-sm text-muted hover:text-ink"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
