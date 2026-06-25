import { useState, useEffect, useCallback } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { getAnalyticsByCategory, getAnalyticsByTag, getAnalyticsTrends } from '../api/analytics.js';
import { formatZAR } from '../lib/money.js';
import { currentMonth } from '../lib/date.js';

const MONTH_ABBR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function monthsBack(n, fromMonth) {
  let [y, m] = fromMonth.split('-').map(Number);
  m -= (n - 1);
  while (m <= 0) { m += 12; y--; }
  return `${y}-${String(m).padStart(2, '0')}`;
}

const DIMS = [
  { key: 'category-expense', label: 'Expenses by category' },
  { key: 'category-income',  label: 'Income by category' },
  { key: 'tag',              label: 'By tag' },
  { key: 'type',             label: 'By type' },
];

const tooltipStyle = {
  fontSize: '0.75rem',
  borderColor: 'var(--color-border)',
  backgroundColor: 'var(--color-surface)',
  color: 'var(--color-ink)',
};

const FALLBACK_COLOURS = ['#4fc1ff', '#dcdcaa', '#f48771', '#6a9955', '#9cdcfe', '#ce9178'];

export default function AnalyticsPanel() {
  const today = currentMonth();
  const [from, setFrom]         = useState(monthsBack(6, today));
  const [to, setTo]             = useState(today);
  const [dimension, setDim]     = useState('category-expense');
  const [chartType, setChart]   = useState('pie');
  const [rows, setRows]         = useState([]);
  const [loading, setLoading]   = useState(false);

  const fetchData = useCallback(async () => {
    if (!from || !to) return;
    setLoading(true);
    try {
      let data;
      if (dimension === 'category-expense') data = await getAnalyticsByCategory(from, to, 'expense');
      else if (dimension === 'category-income') data = await getAnalyticsByCategory(from, to, 'income');
      else if (dimension === 'tag') data = await getAnalyticsByTag(from, to);
      else {
        const trends = await getAnalyticsTrends(from, to);
        const income  = trends.reduce((s, r) => s + r.income_cents, 0);
        const expense = trends.reduce((s, r) => s + r.expense_cents, 0);
        data = [
          { name: 'Income',  total_cents: income,  colour: 'var(--color-income)' },
          { name: 'Expense', total_cents: expense, colour: 'var(--color-expense)' },
        ];
      }
      setRows(data);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [from, to, dimension]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const total = rows.reduce((s, r) => s + r.total_cents, 0);

  const nameKey = dimension === 'tag' ? 'tag_id' : 'category_id';

  const pieData = rows.map((r, i) => ({
    name:   r.name,
    value:  r.total_cents,
    colour: r.colour ?? FALLBACK_COLOURS[i % FALLBACK_COLOURS.length],
  }));

  return (
    <div className="space-y-4 rounded-lg border border-border bg-surface p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Analytics</h2>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted">From</label>
          <input
            type="month"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded border border-border bg-bg px-2 py-1 text-sm text-ink focus:border-accent focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted">To</label>
          <input
            type="month"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="rounded border border-border bg-bg px-2 py-1 text-sm text-ink focus:border-accent focus:outline-none"
          />
        </div>
        <select
          value={dimension}
          onChange={(e) => setDim(e.target.value)}
          className="rounded border border-border bg-bg px-2 py-1 text-sm text-ink focus:border-accent focus:outline-none"
        >
          {DIMS.map((d) => <option key={d.key} value={d.key}>{d.label}</option>)}
        </select>
        <div className="flex gap-1">
          {['pie', 'bar'].map((ct) => (
            <button
              key={ct}
              onClick={() => setChart(ct)}
              className={`rounded px-2.5 py-1 text-xs font-medium ${chartType === ct ? 'bg-accent text-white' : 'text-muted hover:text-ink'}`}
            >
              {ct.charAt(0).toUpperCase() + ct.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="py-6 text-center text-sm text-muted">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted">No data for this period.</p>
      ) : (
        <>
          {/* Chart */}
          <ResponsiveContainer width="100%" height={220}>
            {chartType === 'pie' ? (
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} strokeWidth={1}>
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.colour} stroke="var(--color-surface)" />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatZAR(v)} contentStyle={tooltipStyle} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '0.75rem', color: 'var(--color-ink)' }} />
              </PieChart>
            ) : (
              <BarChart data={pieData} layout="vertical" margin={{ top: 0, right: 60, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'var(--color-muted)' }} axisLine={false} tickLine={false} width={100} />
                <Tooltip formatter={(v) => formatZAR(v)} contentStyle={tooltipStyle} cursor={{ fill: 'var(--color-border)' }} />
                <Bar dataKey="value" radius={[0, 3, 3, 0]}>
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.colour} />
                  ))}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>

          {/* Table */}
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wide text-muted">
                <th className="pb-2">Name</th>
                <th className="pb-2 text-right">Total</th>
                <th className="pb-2 text-right">% of total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((r, i) => (
                <tr key={r[nameKey] ?? i}>
                  <td className="py-2 text-ink">{r.name}</td>
                  <td className="py-2 text-right font-medium text-ink">{formatZAR(r.total_cents)}</td>
                  <td className="py-2 text-right text-muted">
                    {total > 0 ? `${Math.round((r.total_cents / total) * 100)}%` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
