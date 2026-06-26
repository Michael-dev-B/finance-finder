import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { useStore } from '../store/index.js';
import { getIncomeSummary } from '../api/income.js';
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
  const [, m] = yyyyMm.split('-').map(Number);
  return MONTH_ABBR[m - 1];
}

const tooltipStyle = {
  fontSize: '0.75rem',
  borderColor: 'var(--color-border)',
  backgroundColor: 'var(--color-surface)',
  color: 'var(--color-ink)',
};

export default function IncomeDashboard() {
  const { state } = useStore();
  const [range, setRange] = useState(6);
  const [data, setData]   = useState(null);

  const today = state.activeMonth ?? currentMonth();

  useEffect(() => {
    const from = monthsBack(range, today);
    getIncomeSummary(from, today)
      .then(setData)
      .catch(() => setData(null));
  }, [range, today]);

  if (!data) {
    return (
      <div className="rounded-lg border border-border bg-surface p-5">
        <p className="text-sm text-muted">Loading income analysis…</p>
      </div>
    );
  }

  const hasData = data.months.some((mo) => mo.total_cents > 0);

  if (!hasData) {
    return (
      <div className="rounded-lg border border-border bg-surface p-5">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">Income analysis</h2>
        <p className="text-sm text-muted">Add income transactions to see your income analysis.</p>
      </div>
    );
  }

  const barData = data.months.map((mo) => ({
    name:   abbr(mo.month),
    income: mo.total_cents,
  }));

  const bySource = data.months
    .flatMap((mo) => mo.by_category)
    .reduce((acc, bc) => {
      const existing = acc.find((a) => a.category_id === bc.category_id);
      if (existing) existing.total_cents += bc.total_cents;
      else acc.push({ ...bc });
      return acc;
    }, [])
    .sort((a, b) => b.total_cents - a.total_cents);

  const pieData = bySource.map((bc) => ({
    name:   bc.name,
    value:  bc.total_cents,
    colour: bc.colour,
  }));

  const months = data.months;
  const lastIdx = months.length - 1;
  const momDelta = months.length >= 2
    ? months[lastIdx].total_cents - months[lastIdx - 1].total_cents
    : null;

  return (
    <div className="space-y-5 rounded-lg border border-border bg-surface p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Income analysis</h2>
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

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div>
          <p className="text-xs text-muted">Total ({range}m)</p>
          <p className="mt-0.5 text-2xl font-bold text-income">
            {formatZAR(months.reduce((s, mo) => s + mo.total_cents, 0))}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted">Recurring / mo</p>
          <p className="mt-0.5 text-2xl font-bold text-income">
            {formatZAR(data.recurring_income_monthly_cents)}
          </p>
        </div>
        {momDelta !== null && (
          <div>
            <p className="text-xs text-muted">vs last month</p>
            <p className={`mt-0.5 text-2xl font-bold ${momDelta >= 0 ? 'text-income' : 'text-expense'}`}>
              {momDelta >= 0 ? '+' : '−'}{formatZAR(Math.abs(momDelta))}
            </p>
          </div>
        )}
      </div>

      {/* Monthly bar chart */}
      <div>
        <p className="mb-2 text-xs font-medium text-muted">Monthly income</p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={barData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--color-muted)' }} axisLine={false} tickLine={false} />
            <Tooltip
              formatter={(v) => [formatZAR(v), 'Income']}
              contentStyle={tooltipStyle}
              cursor={{ fill: 'var(--color-border)' }}
            />
            <Bar dataKey="income" fill="var(--color-income)" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Income by source */}
      {pieData.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium text-muted">Income by source</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} strokeWidth={1}>
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.colour} stroke="var(--color-surface)" />
                ))}
              </Pie>
              <Tooltip
                formatter={(v) => formatZAR(v)}
                contentStyle={tooltipStyle}
              />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '0.75rem', color: 'var(--color-ink)' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
