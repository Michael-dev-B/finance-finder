import { Router } from 'express';
import db from '../db/index.js';

const router = Router();

const MONTH_RE = /^\d{4}-\d{2}$/;
const DATE_RE  = /^\d{4}-\d{2}-\d{2}$/;
const VALID_TYPES = new Set(['income', 'expense']);
const VALID_FREQS = new Set(['weekly', 'biweekly', 'monthly', 'quarterly', 'annual']);
const DAY_FREQS   = new Set(['monthly', 'quarterly', 'annual']);
const WEEK_FREQS  = new Set(['weekly', 'biweekly']);

function validate(body) {
  const errors = [];
  if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
    errors.push('name is required');
  }
  if (!Number.isInteger(body.amount_cents) || body.amount_cents <= 0) {
    errors.push('amount_cents must be a positive integer');
  }
  if (!VALID_TYPES.has(body.type)) {
    errors.push("type must be 'income' or 'expense'");
  }
  if (!VALID_FREQS.has(body.frequency)) {
    errors.push('frequency must be weekly, biweekly, monthly, quarterly, or annual');
  }
  if (DAY_FREQS.has(body.frequency)) {
    if (!Number.isInteger(body.day_of_month) || body.day_of_month < 1 || body.day_of_month > 31) {
      errors.push('day_of_month (1–31) required for monthly/quarterly/annual frequency');
    }
  }
  if (WEEK_FREQS.has(body.frequency)) {
    if (!Number.isInteger(body.day_of_week) || body.day_of_week < 0 || body.day_of_week > 6) {
      errors.push('day_of_week (0=Mon … 6=Sun) required for weekly/biweekly frequency');
    }
  }
  if (!body.start_date || !DATE_RE.test(body.start_date)) {
    errors.push('start_date must be an ISO date (YYYY-MM-DD)');
  }
  if (body.end_date && !DATE_RE.test(body.end_date)) {
    errors.push('end_date must be an ISO date (YYYY-MM-DD)');
  }
  return errors;
}

// --- Upcoming projection helpers ---

function lastDayOfMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

function clampDay(day, year, month) {
  return Math.min(day, lastDayOfMonth(year, month));
}

function getOccurrences(item, fromYM, toYM) {
  const [fromY, fromM] = fromYM.split('-').map(Number);
  const [toY, toM]     = toYM.split('-').map(Number);

  const fromDate  = new Date(fromY, fromM - 1, 1);
  const toDate    = new Date(toY, toM - 1, lastDayOfMonth(toY, toM));
  const startDate = new Date(item.start_date);
  const endDate   = item.end_date ? new Date(item.end_date) : null;

  const occurrences = [];

  if (WEEK_FREQS.has(item.frequency)) {
    const step = item.frequency === 'weekly' ? 7 : 14;
    let cur = new Date(startDate);
    while (cur <= toDate) {
      if (cur >= fromDate && (!endDate || cur <= endDate)) {
        occurrences.push(cur.toISOString().slice(0, 10));
      }
      cur = new Date(cur.getTime() + step * 86_400_000);
    }
  } else {
    const startMonth = startDate.getMonth() + 1;
    for (let y = fromY, m = fromM; y < toY || (y === toY && m <= toM); ) {
      let occurs = false;
      if (item.frequency === 'monthly') {
        occurs = true;
      } else if (item.frequency === 'quarterly') {
        occurs = (((m - startMonth) % 3 + 12) % 3) === 0;
      } else if (item.frequency === 'annual') {
        occurs = m === startMonth;
      }
      if (occurs) {
        const day     = clampDay(item.day_of_month, y, m);
        const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const d       = new Date(dateStr);
        if (d >= startDate && (!endDate || d <= endDate)) {
          occurrences.push(dateStr);
        }
      }
      m++;
      if (m > 12) { m = 1; y++; }
    }
  }

  return occurrences.map((expected_date) => ({
    recurring_item_id: item.id,
    name:              item.name,
    amount_cents:      item.amount_cents,
    type:              item.type,
    category_id:       item.category_id,
    expected_date,
  }));
}

// --- Routes ---

// /upcoming must be declared before /:id to avoid Express matching 'upcoming' as an id
router.get('/upcoming', (req, res) => {
  const { from, to } = req.query;
  if (!from || !MONTH_RE.test(from) || !to || !MONTH_RE.test(to)) {
    return res.status(400).json({ error: 'from and to must be YYYY-MM' });
  }
  const items  = db.prepare('SELECT * FROM recurring_items WHERE active = 1').all();
  const result = items.flatMap((item) => getOccurrences(item, from, to));
  result.sort((a, b) => a.expected_date.localeCompare(b.expected_date));
  res.json(result);
});

router.get('/', (req, res) => {
  res.json(db.prepare('SELECT * FROM recurring_items ORDER BY name').all());
});

router.post('/', (req, res) => {
  const errors = validate(req.body);
  if (errors.length) return res.status(400).json({ errors });

  const {
    name, amount_cents, type, category_id = null, frequency,
    day_of_month = null, day_of_week = null, start_date,
    end_date = null, note = null,
  } = req.body;

  const result = db.prepare(
    `INSERT INTO recurring_items
       (name, amount_cents, type, category_id, frequency, day_of_month, day_of_week,
        start_date, end_date, note)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(name.trim(), amount_cents, type, category_id, frequency,
        day_of_month, day_of_week, start_date, end_date, note);

  const created = db
    .prepare('SELECT * FROM recurring_items WHERE id = ?')
    .get(result.lastInsertRowid);
  res.status(201).json(created);
});

router.put('/:id', (req, res) => {
  const existing = db
    .prepare('SELECT id FROM recurring_items WHERE id = ?')
    .get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Recurring item not found' });

  const errors = validate(req.body);
  if (errors.length) return res.status(400).json({ errors });

  const {
    name, amount_cents, type, category_id = null, frequency,
    day_of_month = null, day_of_week = null, start_date,
    end_date = null, active = 1, note = null,
  } = req.body;

  db.prepare(
    `UPDATE recurring_items SET
       name = ?, amount_cents = ?, type = ?, category_id = ?, frequency = ?,
       day_of_month = ?, day_of_week = ?, start_date = ?, end_date = ?,
       active = ?, note = ?
     WHERE id = ?`,
  ).run(name.trim(), amount_cents, type, category_id, frequency,
        day_of_month, day_of_week, start_date, end_date,
        active ? 1 : 0, note, req.params.id);

  res.json(db.prepare('SELECT * FROM recurring_items WHERE id = ?').get(req.params.id));
});

router.delete('/:id', (req, res) => {
  const existing = db
    .prepare('SELECT id FROM recurring_items WHERE id = ?')
    .get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Recurring item not found' });

  db.prepare('DELETE FROM recurring_items WHERE id = ?').run(req.params.id);
  res.status(200).json({ deleted: true });
});

export default router;
