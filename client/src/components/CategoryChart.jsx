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
    <div className="flex h-full flex-col rounded-lg border border-border bg-surface p-5">
      <h2 className="mb-4 shrink-0 text-sm font-semibold uppercase tracking-wide text-muted">
        Expense breakdown
      </h2>
      {data.length === 0 ? (
        <div className="flex flex-1 items-center justify-center py-10">
          <p className="text-sm text-muted">
            {state.loading ? 'Loading…' : 'No expense data this month.'}
          </p>
        </div>
      ) : (
        <div className="min-h-0 flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="43%"
                outerRadius="72%"
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
                labelStyle={{ color: '#fff' }}
                itemStyle={{ color: '#fff' }}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: '0.75rem', color: '#fff' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
