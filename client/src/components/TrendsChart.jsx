import { useState, useEffect } from 'react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, Tooltip,
  Legend, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { useStore } from '../store/index.js';
import { getAnalyticsTrends } from '../api/analytics.js';
import { formatZAR } from '../lib/money.js';
import { currentMonth } from '../lib/date.js';

const MONTH_ABBR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function monthsBack(n, fromMonth) {
  let [y, m] = fromMonth.split('-').map(Number);
  m -= (n - 1);
  while (m <= 0) { m += 12; y--; }
  return `${y}-${String(m).padStart(2, '0')}`;
}

function abbr(yyyyMm) {
  const [y, m] = yyyyMm.split('-').map(Number);
  return `${MONTH_ABBR[m - 1]} '${String(y).slice(2)}`;
}

const tooltipStyle = {
  fontSize: '0.75rem',
  borderColor: 'var(--color-border)',
  backgroundColor: 'var(--color-surface)',
  color: 'var(--color-ink)',
};

export default function TrendsChart() {
  const { state } = useStore();
  const [range, setRange] = useState(6);
  const [data, setData]   = useState(null);

  const today = state.activeMonth ?? currentMonth();

  useEffect(() => {
    const from = monthsBack(range, today);
    getAnalyticsTrends(from, today)
      .then((rows) =>
        setData(rows.map((r) => ({
          name:    abbr(r.month),
          income:  r.income_cents,
          expense: r.expense_cents,
          net:     r.income_cents - r.expense_cents,
        }))),
      )
      .catch(() => setData(null));
  }, [range, today]);

  const hasData = data?.some((d) => d.income > 0 || d.expense > 0);

  return (
    <div className="space-y-4 rounded-lg border border-border bg-surface p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Income vs expenses</h2>
        <div className="flex gap-1">
          {[3, 6, 12].map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded px-2.5 py-1 text-xs font-medium ${range === r ? 'bg-accent text-white' : 'text-muted hover:text-ink'}`}
            >
              {r}m
            </button>
          ))}
        </div>
      </div>

      {!data ? (
        <p className="py-6 text-center text-sm text-muted">Loading…</p>
      ) : !hasData ? (
        <p className="py-6 text-center text-sm text-muted">No transactions in this period.</p>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <ComposedChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--color-muted)' }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip
              formatter={(v, name) => [formatZAR(Math.abs(v)), name.charAt(0).toUpperCase() + name.slice(1)]}
              contentStyle={tooltipStyle}
              cursor={{ fill: 'var(--color-border)' }}
            />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '0.75rem', color: 'var(--color-ink)' }} />
            <Bar dataKey="income"  name="Income"  fill="var(--color-income)"  radius={[3, 3, 0, 0]} />
            <Bar dataKey="expense" name="Expense" fill="var(--color-expense)" radius={[3, 3, 0, 0]} />
            <Line dataKey="net" name="Net" stroke="var(--color-primary)" dot={false} strokeWidth={2} />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
