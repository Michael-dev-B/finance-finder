import { Router } from 'express';
import db from '../db/index.js';

const router = Router();

const MONTH_RE = /^\d{4}-\d{2}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const VALID_TYPES = new Set(['income', 'expense']);

function validate(body) {
  const errors = [];
  if (!Number.isInteger(body.amount_cents) || body.amount_cents <= 0) {
    errors.push('amount_cents must be a positive integer');
  }
  if (!VALID_TYPES.has(body.type)) {
    errors.push("type must be 'income' or 'expense'");
  }
  if (!body.occurred_on || !DATE_RE.test(body.occurred_on)) {
    errors.push('occurred_on must be an ISO date (YYYY-MM-DD)');
  }
  if (body.category_id !== undefined && body.category_id !== null) {
    if (!Number.isInteger(body.category_id)) {
      errors.push('category_id must be an integer or null');
    } else {
      const cat = db
        .prepare('SELECT id FROM categories WHERE id = ?')
        .get(body.category_id);
      if (!cat) errors.push(`category_id ${body.category_id} does not exist`);
    }
  }
  return errors;
}

function withTags(rows) {
  if (rows.length === 0) return rows;
  const ids = rows.map((r) => r.id);
  const placeholders = ids.map(() => '?').join(',');
  const tagLinks = db
    .prepare(
      `SELECT tt.transaction_id, t.id, t.name, t.colour
       FROM transaction_tags tt
       JOIN tags t ON t.id = tt.tag_id
       WHERE tt.transaction_id IN (${placeholders})
       ORDER BY t.name`,
    )
    .all(...ids);
  const tagMap = {};
  for (const { transaction_id, ...tag } of tagLinks) {
    (tagMap[transaction_id] ??= []).push(tag);
  }
  return rows.map((r) => ({ ...r, tags: tagMap[r.id] ?? [] }));
}

function syncTags(transactionId, tagIds) {
  db.prepare('DELETE FROM transaction_tags WHERE transaction_id = ?').run(transactionId);
  if (Array.isArray(tagIds) && tagIds.length > 0) {
    const insert = db.prepare(
      'INSERT OR IGNORE INTO transaction_tags (transaction_id, tag_id) VALUES (?, ?)',
    );
    for (const tagId of tagIds) {
      insert.run(transactionId, tagId);
    }
  }
}

router.get('/', (req, res) => {
  const { month } = req.query;
  if (month !== undefined && !MONTH_RE.test(month)) {
    return res.status(400).json({ error: 'month must be YYYY-MM' });
  }

  const rows = month
    ? db
        .prepare(
          "SELECT * FROM transactions WHERE strftime('%Y-%m', occurred_on) = ? ORDER BY occurred_on DESC",
        )
        .all(month)
    : db.prepare('SELECT * FROM transactions ORDER BY occurred_on DESC').all();

  res.json(withTags(rows));
});

router.post('/', (req, res) => {
  const errors = validate(req.body);
  if (errors.length) return res.status(400).json({ errors });

  const { amount_cents, type, category_id = null, occurred_on, note = null, tag_ids } =
    req.body;
  const result = db
    .prepare(
      'INSERT INTO transactions (amount_cents, type, category_id, occurred_on, note) VALUES (?, ?, ?, ?, ?)',
    )
    .run(amount_cents, type, category_id, occurred_on, note);

  syncTags(result.lastInsertRowid, tag_ids);
  const created = db
    .prepare('SELECT * FROM transactions WHERE id = ?')
    .get(result.lastInsertRowid);
  res.status(201).json(withTags([created])[0]);
});

router.put('/:id', (req, res) => {
  const existing = db
    .prepare('SELECT id FROM transactions WHERE id = ?')
    .get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Transaction not found' });

  const errors = validate(req.body);
  if (errors.length) return res.status(400).json({ errors });

  const { amount_cents, type, category_id = null, occurred_on, note = null, tag_ids } =
    req.body;
  db.prepare(
    'UPDATE transactions SET amount_cents = ?, type = ?, category_id = ?, occurred_on = ?, note = ? WHERE id = ?',
  ).run(amount_cents, type, category_id, occurred_on, note, req.params.id);

  syncTags(Number(req.params.id), tag_ids);
  const updated = db
    .prepare('SELECT * FROM transactions WHERE id = ?')
    .get(req.params.id);
  res.json(withTags([updated])[0]);
});

router.delete('/:id', (req, res) => {
  const existing = db
    .prepare('SELECT id FROM transactions WHERE id = ?')
    .get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Transaction not found' });

  db.prepare('DELETE FROM transactions WHERE id = ?').run(req.params.id);
  res.status(200).json({ deleted: true });
});

export default router;
