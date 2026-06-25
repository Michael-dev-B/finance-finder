import { useState, useRef } from 'react';
import { useStore, ADD_TAG, UPDATE_TAG, DELETE_TAG } from '../store/index.js';
import { createTag, updateTag, deleteTag } from '../api/tags.js';
import { useToast } from './Toast.jsx';

const DEFAULTS = { name: '', colour: '#569cd6' };

export default function TagManager() {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const [editingTag, setEditingTag] = useState(null);
  const [fields, setFields] = useState(DEFAULTS);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const deleteTimer = useRef(null);

  function startEdit(tag) {
    setEditingTag(tag);
    setFields({ name: tag.name, colour: tag.colour });
    setError('');
  }

  function cancelEdit() {
    setEditingTag(null);
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

    setError('');
    setSaving(true);
    const payload = { name: fields.name.trim(), colour: fields.colour };

    try {
      if (editingTag) {
        const updated = await updateTag(editingTag.id, payload);
        dispatch({ type: UPDATE_TAG, payload: updated });
      } else {
        const created = await createTag(payload);
        dispatch({ type: ADD_TAG, payload: created });
      }
      cancelEdit();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    await deleteTag(id);
    dispatch({ type: DELETE_TAG, payload: id });
    toast('Tag deleted');
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

  return (
    <div className="space-y-5">
      <form onSubmit={handleSubmit} className="space-y-3">
        <h3 className="text-sm font-semibold text-ink">
          {editingTag ? `Edit "${editingTag.name}"` : 'New tag'}
        </h3>
        {error && <p className="text-sm text-expense">{error}</p>}

        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Tag name"
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
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded bg-accent px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {saving ? 'Saving…' : editingTag ? 'Update' : 'Add tag'}
          </button>
          {editingTag && (
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

      {state.tags.length === 0 ? (
        <p className="text-sm text-muted">No tags yet.</p>
      ) : (
        <ul className="divide-y divide-border">
          {state.tags.map((tag) => (
            <li key={tag.id} className="flex items-center justify-between py-2.5">
              <span className="flex items-center gap-2.5">
                <span
                  className="inline-block h-3.5 w-3.5 rounded-full"
                  style={{ backgroundColor: tag.colour }}
                />
                <span className="text-sm font-medium text-ink">{tag.name}</span>
              </span>
              <span className="flex gap-3 text-xs">
                <button onClick={() => startEdit(tag)} className="text-muted hover:text-ink">Edit</button>
                {pendingDelete === tag.id ? (
                  <>
                    <button onClick={cancelDelete} className="text-muted hover:text-ink">Cancel</button>
                    <button onClick={() => confirmDelete(tag.id)} className="font-medium text-expense hover:opacity-80">Delete!</button>
                  </>
                ) : (
                  <button onClick={() => requestDelete(tag.id)} className="text-muted hover:text-expense">Delete</button>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
