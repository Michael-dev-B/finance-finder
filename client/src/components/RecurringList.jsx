import { useState, useRef } from 'react';
import { useStore, UPDATE_RECURRING, DELETE_RECURRING } from '../store/index.js';
import { updateRecurring, deleteRecurring } from '../api/recurring.js';
import { formatZAR } from '../lib/money.js';
import { useToast } from './Toast.jsx';

const FREQ_LABELS = {
  weekly:    'Weekly',
  biweekly:  'Every 2 weeks',
  monthly:   'Monthly',
  quarterly: 'Quarterly',
  annual:    'Annually',
};

export default function RecurringList({ onEdit }) {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const categoryMap = new Map(state.categories.map((c) => [c.id, c]));
  const [toggling, setToggling] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const deleteTimer = useRef(null);

  async function handleToggle(item) {
    setToggling(item.id);
    try {
      const updated = await updateRecurring(item.id, {
        name:         item.name,
        amount_cents: item.amount_cents,
        type:         item.type,
        category_id:  item.category_id,
        frequency:    item.frequency,
        day_of_month: item.day_of_month,
        day_of_week:  item.day_of_week,
        start_date:   item.start_date,
        end_date:     item.end_date,
        active:       item.active ? 0 : 1,
        note:         item.note,
      });
      dispatch({ type: UPDATE_RECURRING, payload: updated });
    } finally {
      setToggling(null);
    }
  }

  async function handleDelete(id) {
    await deleteRecurring(id);
    dispatch({ type: DELETE_RECURRING, payload: id });
    toast('Recurring item deleted');
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

  if (state.recurring.length === 0) {
    return <p className="text-sm text-muted">No recurring items yet.</p>;
  }

  return (
    <ul className="divide-y divide-border">
      {state.recurring.map((item) => {
        const cat = item.category_id ? categoryMap.get(item.category_id) : null;
        return (
          <li
            key={item.id}
            className={`flex items-center justify-between py-3 ${item.active ? '' : 'opacity-50'}`}
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-ink">{item.name}</span>
                <span className={`text-sm font-semibold ${item.type === 'income' ? 'text-income' : 'text-expense'}`}>
                  {item.type === 'income' ? '+' : '−'} {formatZAR(item.amount_cents)}
                </span>
                <span className="text-xs text-muted">{FREQ_LABELS[item.frequency]}</span>
                {cat && (
                  <span className="flex items-center gap-1 text-xs text-muted">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: cat.colour }}
                    />
                    {cat.name}
                  </span>
                )}
                {!item.active && (
                  <span className="rounded-full bg-border px-2 py-0.5 text-xs text-muted">
                    Paused
                  </span>
                )}
              </div>
              {item.note && (
                <p className="mt-0.5 text-xs text-muted">{item.note}</p>
              )}
            </div>

            <div className="ml-4 flex shrink-0 gap-3 text-xs">
              <button
                onClick={() => handleToggle(item)}
                disabled={toggling === item.id}
                className="text-muted hover:text-ink disabled:opacity-50"
              >
                {item.active ? 'Pause' : 'Resume'}
              </button>
              <button
                onClick={() => onEdit(item)}
                className="text-muted hover:text-ink"
              >
                Edit
              </button>
              {pendingDelete === item.id ? (
                <>
                  <button onClick={cancelDelete} className="text-muted hover:text-ink">Cancel</button>
                  <button onClick={() => confirmDelete(item.id)} className="font-medium text-expense hover:opacity-80">Delete!</button>
                </>
              ) : (
                <button onClick={() => requestDelete(item.id)} className="text-muted hover:text-expense">Delete</button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
