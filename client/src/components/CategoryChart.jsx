import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useStore, selectCategorySpend } from '../store/index.js';
import { formatZAR } from '../lib/money.js';

export default function CategoryChart() {
  const { state } = useStore();
  const spend = selectCategorySpend(state);
  const categoryMap = new Map(state.categories.map((c) => [c.id, c]));

  const data = Array.from(spend.entries())
    .map(([id, cents]) => ({
      name: categoryMap.get(id)?.name ?? 'Uncategorised',
      value: cents,
      colour: categoryMap.get(id)?.colour ?? 'var(--color-muted)',
    }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="flex flex-col rounded-lg border border-border bg-surface p-5">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">
        Expense breakdown
      </h2>
      {data.length === 0 ? (
        <div className="flex flex-1 items-center justify-center py-10">
          <p className="text-sm text-muted">
            {state.loading ? 'Loading…' : 'No expense data this month.'}
          </p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              strokeWidth={1}
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.colour} stroke="var(--color-surface)" />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => formatZAR(value)}
              contentStyle={{
                fontSize: '0.75rem',
                borderColor: 'var(--color-border)',
                backgroundColor: 'var(--color-surface)',
              }}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: '0.75rem', color: 'var(--color-ink)' }}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
