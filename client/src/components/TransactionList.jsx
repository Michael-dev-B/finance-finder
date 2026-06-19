import { useStore, DELETE_TRANSACTION } from '../store/index.js';
import { deleteTransaction } from '../api/transactions.js';
import { formatZAR } from '../lib/money.js';
import { toDisplayDate, monthLabel } from '../lib/date.js';

export default function TransactionList({ onEdit }) {
  const { state, dispatch } = useStore();
  const categoryMap = new Map(state.categories.map((c) => [c.id, c]));

  async function handleDelete(id) {
    await deleteTransaction(id);
    dispatch({ type: DELETE_TRANSACTION, payload: id });
  }

  if (state.transactions.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted">
        No transactions for {monthLabel(state.activeMonth)}.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-bg text-left text-xs font-medium uppercase tracking-wide text-muted">
            <th className="px-4 py-3">Date</th>
            <th className="hidden px-4 py-3 sm:table-cell">Note</th>
            <th className="px-4 py-3">Category / Tags</th>
            <th className="px-4 py-3 text-right">Amount</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-surface">
          {state.transactions.map((t) => {
            const cat = t.category_id ? categoryMap.get(t.category_id) : null;
            return (
              <tr key={t.id} className="hover:bg-bg">
                <td className="whitespace-nowrap px-4 py-3 text-muted">
                  {toDisplayDate(t.occurred_on)}
                </td>
                <td className="hidden px-4 py-3 text-ink sm:table-cell">
                  {t.note || <span className="text-muted">—</span>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="flex items-center gap-1.5">
                      <span
                        className="inline-block h-3 w-3 shrink-0 rounded-full"
                        style={{ backgroundColor: cat?.colour ?? '#94a3b8' }}
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
                    <button
                      onClick={() => onEdit(t)}
                      className="text-xs text-muted hover:text-ink"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(t.id)}
                      className="text-xs text-muted hover:text-expense"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
