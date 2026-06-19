import { useState } from 'react';
import { useStore, ADD_CATEGORY, UPDATE_CATEGORY, DELETE_CATEGORY } from '../store/index.js';
import { createCategory, updateCategory, deleteCategory } from '../api/categories.js';
import { formatZAR, parseCentsFromInput } from '../lib/money.js';

const DEFAULTS = { name: '', colour: '#22c55e', budget: '' };

export default function CategoryManager() {
  const { state, dispatch } = useStore();
  const [editingCategory, setEditingCategory] = useState(null);
  const [fields, setFields] = useState(DEFAULTS);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function startEdit(cat) {
    setEditingCategory(cat);
    setFields({
      name: cat.name,
      colour: cat.colour,
      budget: cat.monthly_budget_cents
        ? (cat.monthly_budget_cents / 100).toFixed(2).replace('.', ',')
        : '',
    });
    setError('');
  }

  function cancelEdit() {
    setEditingCategory(null);
    setFields(DEFAULTS);
    setError('');
  }

  function set(key, value) {
    setFields((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!fields.name.trim()) { setError('Name is required'); return; }
    if (!/^#[0-9a-fA-F]{6}$/.test(fields.colour)) { setError('Choose a valid colour'); return; }

    let monthly_budget_cents = null;
    if (fields.budget.trim()) {
      const cents = parseCentsFromInput(fields.budget);
      if (isNaN(cents) || cents <= 0) { setError('Enter a valid budget amount'); return; }
      monthly_budget_cents = cents;
    }

    setError('');
    setSaving(true);
    const payload = { name: fields.name.trim(), colour: fields.colour, monthly_budget_cents };

    try {
      if (editingCategory) {
        const updated = await updateCategory(editingCategory.id, payload);
        dispatch({ type: UPDATE_CATEGORY, payload: updated });
      } else {
        const created = await createCategory(payload);
        dispatch({ type: ADD_CATEGORY, payload: created });
      }
      cancelEdit();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    await deleteCategory(id);
    dispatch({ type: DELETE_CATEGORY, payload: id });
  }

  return (
    <div className="space-y-5">
      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <h3 className="text-sm font-semibold text-ink">
          {editingCategory ? `Edit "${editingCategory.name}"` : 'New category'}
        </h3>
        {error && <p className="text-sm text-expense">{error}</p>}

        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Name"
            value={fields.name}
            onChange={(e) => set('name', e.target.value)}
            className="min-w-40 flex-1 rounded border border-border bg-bg px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-accent focus:outline-none"
          />
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted">Colour</label>
            <input
              type="color"
              value={fields.colour}
              onChange={(e) => set('colour', e.target.value)}
              className="h-9 w-12 cursor-pointer rounded border border-border bg-bg p-0.5"
            />
          </div>
          <input
            type="text"
            inputMode="decimal"
            placeholder="Monthly budget (optional)"
            value={fields.budget}
            onChange={(e) => set('budget', e.target.value)}
            className="min-w-48 flex-1 rounded border border-border bg-bg px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-accent focus:outline-none"
          />
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded bg-accent px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {saving ? 'Saving…' : editingCategory ? 'Update' : 'Add category'}
          </button>
          {editingCategory && (
            <button
              type="button"
              onClick={cancelEdit}
              className="rounded border border-border px-3 py-1.5 text-sm text-muted hover:text-ink"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* List */}
      {state.categories.length === 0 ? (
        <p className="text-sm text-muted">No categories yet.</p>
      ) : (
        <ul className="divide-y divide-border">
          {state.categories.map((cat) => (
            <li key={cat.id} className="flex items-center justify-between py-2.5">
              <span className="flex items-center gap-2.5">
                <span
                  className="inline-block h-3.5 w-3.5 rounded-full"
                  style={{ backgroundColor: cat.colour }}
                />
                <span className="text-sm font-medium text-ink">{cat.name}</span>
                {cat.monthly_budget_cents && (
                  <span className="text-xs text-muted">
                    {formatZAR(cat.monthly_budget_cents)} / month
                  </span>
                )}
              </span>
              <span className="flex gap-3 text-xs">
                <button
                  onClick={() => startEdit(cat)}
                  className="text-muted hover:text-ink"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(cat.id)}
                  className="text-muted hover:text-expense"
                >
                  Delete
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
