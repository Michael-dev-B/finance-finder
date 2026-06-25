import { useState, useEffect } from 'react';
import { useStore, ADD_RECURRING, UPDATE_RECURRING } from '../store/index.js';
import { createRecurring, updateRecurring } from '../api/recurring.js';
import { parseCentsFromInput } from '../lib/money.js';

function todayISO() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const DEFAULTS = {
  name: '', amount: '', type: 'expense', categoryId: '',
  frequency: 'monthly', dayOfMonth: '1', dayOfWeek: '0',
  startDate: todayISO(), endDate: '', note: '',
};

const DAY_FREQS  = new Set(['monthly', 'quarterly', 'annual']);
const WEEK_FREQS = new Set(['weekly', 'biweekly']);

export default function RecurringForm({ editing, onDone }) {
  const { state, dispatch } = useStore();
  const [fields, setFields] = useState(DEFAULTS);
  const [error, setError]   = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editing) {
      setFields({
        name:       editing.name,
        amount:     (editing.amount_cents / 100).toFixed(2).replace('.', ','),
        type:       editing.type,
        categoryId: editing.category_id ? String(editing.category_id) : '',
        frequency:  editing.frequency,
        dayOfMonth: editing.day_of_month != null ? String(editing.day_of_month) : '1',
        dayOfWeek:  editing.day_of_week  != null ? String(editing.day_of_week)  : '0',
        startDate:  editing.start_date,
        endDate:    editing.end_date ?? '',
        note:       editing.note ?? '',
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
      setError('Enter a valid amount'); return;
    }
    setError('');
    setSaving(true);

    const payload = {
      name:         fields.name.trim(),
      amount_cents: cents,
      type:         fields.type,
      category_id:  fields.categoryId ? Number(fields.categoryId) : null,
      frequency:    fields.frequency,
      day_of_month: DAY_FREQS.has(fields.frequency)  ? Number(fields.dayOfMonth) : null,
      day_of_week:  WEEK_FREQS.has(fields.frequency) ? Number(fields.dayOfWeek)  : null,
      start_date:   fields.startDate,
      end_date:     fields.endDate || null,
      note:         fields.note || null,
    };

    try {
      if (editing) {
        const updated = await updateRecurring(editing.id, { ...payload, active: editing.active });
        dispatch({ type: UPDATE_RECURRING, payload: updated });
      } else {
        const created = await createRecurring(payload);
        dispatch({ type: ADD_RECURRING, payload: created });
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

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">Name</label>
          <input
            type="text"
            placeholder="e.g. Salary, Netflix"
            value={fields.name}
            onChange={(e) => set('name', e.target.value)}
            required
            className="w-full rounded border border-border bg-bg px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-accent focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">Amount (R)</label>
          <input
            type="text"
            inputMode="decimal"
            placeholder="0,00"
            value={fields.amount}
            onChange={(e) => set('amount', e.target.value)}
            className="w-full rounded border border-border bg-bg px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-accent focus:outline-none"
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <span className="mb-1 block text-sm font-medium text-ink">Type</span>
          <div className="flex gap-4">
            {['expense', 'income'].map((t) => (
              <label key={t} className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="rtype"
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
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">Category</label>
          <select
            value={fields.categoryId}
            onChange={(e) => set('categoryId', e.target.value)}
            className="w-full rounded border border-border bg-bg px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none"
          >
            <option value="">Uncategorised</option>
            {state.categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">Frequency</label>
          <select
            value={fields.frequency}
            onChange={(e) => set('frequency', e.target.value)}
            className="w-full rounded border border-border bg-bg px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none"
          >
            <option value="weekly">Weekly</option>
            <option value="biweekly">Every 2 weeks</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="annual">Annually</option>
          </select>
        </div>

        {DAY_FREQS.has(fields.frequency) && (
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Day of month</label>
            <input
              type="number"
              min="1"
              max="31"
              value={fields.dayOfMonth}
              onChange={(e) => set('dayOfMonth', e.target.value)}
              className="w-full rounded border border-border bg-bg px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none"
            />
          </div>
        )}

        {WEEK_FREQS.has(fields.frequency) && (
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Day of week</label>
            <select
              value={fields.dayOfWeek}
              onChange={(e) => set('dayOfWeek', e.target.value)}
              className="w-full rounded border border-border bg-bg px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none"
            >
              {DAY_NAMES.map((name, i) => (
                <option key={i} value={i}>{name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">Start date</label>
          <input
            type="date"
            value={fields.startDate}
            onChange={(e) => set('startDate', e.target.value)}
            className="w-full rounded border border-border bg-bg px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">End date (optional)</label>
          <input
            type="date"
            value={fields.endDate}
            onChange={(e) => set('endDate', e.target.value)}
            className="w-full rounded border border-border bg-bg px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-ink">Note (optional)</label>
        <input
          type="text"
          placeholder="e.g. Netflix subscription"
          value={fields.note}
          onChange={(e) => set('note', e.target.value)}
          className="w-full rounded border border-border bg-bg px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-accent focus:outline-none"
        />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {saving ? 'Saving…' : editing ? 'Update' : 'Add recurring item'}
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
