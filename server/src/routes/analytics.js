import { Router } from 'express';
import db from '../db/index.js';

const router = Router();

const MONTH_RE = /^\d{4}-\d{2}$/;
const VALID_TYPES = new Set(['income', 'expense']);

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

router.get('/trends', (req, res) => {
  const { from, to } = req.query;
  if (!from || !MONTH_RE.test(from) || !to || !MONTH_RE.test(to)) {
    return res.status(400).json({ error: 'from and to must be YYYY-MM' });
  }

  const rows = db
    .prepare(
      `SELECT strftime('%Y-%m', occurred_on) AS month,
              SUM(CASE WHEN type = 'income'  THEN amount_cents ELSE 0 END) AS income_cents,
              SUM(CASE WHEN type = 'expense' THEN amount_cents ELSE 0 END) AS expense_cents
       FROM transactions
       WHERE strftime('%Y-%m', occurred_on) BETWEEN ? AND ?
         AND split_of IS NULL
       GROUP BY month
       ORDER BY month`,
    )
    .all(from, to);

  const dataMap = new Map(rows.map((r) => [r.month, r]));
  const result = monthRange(from, to).map(
    (mo) => dataMap.get(mo) ?? { month: mo, income_cents: 0, expense_cents: 0 },
  );

  res.json(result);
});

router.get('/by-category', (req, res) => {
  const { from, to, type } = req.query;
  if (!from || !MONTH_RE.test(from) || !to || !MONTH_RE.test(to)) {
    return res.status(400).json({ error: 'from and to must be YYYY-MM' });
  }
  if (!type || !VALID_TYPES.has(type)) {
    return res.status(400).json({ error: "type must be 'income' or 'expense'" });
  }

  const rows = db
    .prepare(
      `SELECT t.category_id, c.name, c.colour, SUM(t.amount_cents) AS total_cents
       FROM transactions t
       LEFT JOIN categories c ON c.id = t.category_id
       WHERE t.type = ?
         AND strftime('%Y-%m', t.occurred_on) BETWEEN ? AND ?
         AND t.split_of IS NULL
       GROUP BY t.category_id
       ORDER BY total_cents DESC`,
    )
    .all(type, from, to);

  res.json(
    rows.map((r) => ({
      category_id: r.category_id,
      name:        r.name   ?? 'Uncategorised',
      colour:      r.colour ?? '#94a3b8',
      total_cents: r.total_cents,
    })),
  );
});

router.get('/by-tag', (req, res) => {
  const { from, to } = req.query;
  if (!from || !MONTH_RE.test(from) || !to || !MONTH_RE.test(to)) {
    return res.status(400).json({ error: 'from and to must be YYYY-MM' });
  }

  const rows = db
    .prepare(
      `SELECT tg.id AS tag_id, tg.name, tg.colour, SUM(t.amount_cents) AS total_cents
       FROM transaction_tags tt
       JOIN transactions t  ON t.id  = tt.transaction_id
       JOIN tags tg          ON tg.id = tt.tag_id
       WHERE strftime('%Y-%m', t.occurred_on) BETWEEN ? AND ?
         AND t.split_of IS NULL
       GROUP BY tg.id
       ORDER BY total_cents DESC`,
    )
    .all(from, to);

  res.json(rows);
});

router.get('/net-worth-trend', (req, res) => {
  const rows = db
    .prepare(
      `SELECT strftime('%Y-%m', occurred_on) AS month,
              SUM(CASE WHEN type = 'income'  THEN amount_cents ELSE 0 END) -
              SUM(CASE WHEN type = 'expense' THEN amount_cents ELSE 0 END) AS net_cents
       FROM transactions
       WHERE split_of IS NULL
       GROUP BY month
       ORDER BY month`,
    )
    .all();

  let cumulative = 0;
  const result = rows.map((r) => {
    cumulative += r.net_cents;
    return { month: r.month, net_cents: r.net_cents, cumulative_cents: cumulative };
  });

  res.json(result);
});

export default router;
