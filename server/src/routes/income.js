import { Router } from 'express';
import db from '../db/index.js';

const router = Router();

const MONTH_RE = /^\d{4}-\d{2}$/;

function monthRange(from, to) {
  const months = [];
  let [y, m] = from.split('-').map(Number);
  const [toY, toM] = to.split('-').map(Number);
  while (y < toY || (y === toY && m <= toM)) {
    months.push(`${y}-${String(m).padStart(2, '0')}`);
    m++; if (m > 12) { m = 1; y++; }
  }
  return months;
}

router.get('/summary', (req, res) => {
  const { from, to } = req.query;
  if (!from || !MONTH_RE.test(from) || !to || !MONTH_RE.test(to)) {
    return res.status(400).json({ error: 'from and to must be YYYY-MM' });
  }

  const rows = db
    .prepare(
      `SELECT strftime('%Y-%m', occurred_on) AS month,
              category_id,
              SUM(amount_cents) AS total_cents
       FROM transactions
       WHERE type = 'income'
         AND strftime('%Y-%m', occurred_on) BETWEEN ? AND ?
         AND split_of IS NULL
       GROUP BY month, category_id
       ORDER BY month`,
    )
    .all(from, to);

  const catRows = db.prepare('SELECT id, name, colour FROM categories').all();
  const catMap = new Map(catRows.map((c) => [c.id, c]));

  const dataByMonth = new Map();
  for (const r of rows) {
    if (!dataByMonth.has(r.month)) {
      dataByMonth.set(r.month, { month: r.month, total_cents: 0, by_category: [] });
    }
    const entry = dataByMonth.get(r.month);
    entry.total_cents += r.total_cents;
    const cat = r.category_id ? catMap.get(r.category_id) : null;
    entry.by_category.push({
      category_id: r.category_id,
      name:        cat?.name   ?? 'Uncategorised',
      colour:      cat?.colour ?? '#94a3b8',
      total_cents: r.total_cents,
    });
  }

  const months = monthRange(from, to).map((mo) =>
    dataByMonth.get(mo) ?? { month: mo, total_cents: 0, by_category: [] },
  );

  const recurringRow = db
    .prepare(
      "SELECT SUM(amount_cents) AS total FROM recurring_items WHERE type = 'income' AND active = 1",
    )
    .get();

  res.json({
    months,
    recurring_income_monthly_cents: recurringRow?.total ?? 0,
  });
});

export default router;
