import { Router } from 'express';
import db from '../db/index.js';

const router = Router();

const MONTH_RE = /^\d{4}-\d{2}$/;
const DATE_RE  = /^\d{4}-\d{2}-\d{2}$/;
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
      const cat = db.prepare('SELECT id FROM categories WHERE id = ?').get(body.category_id);
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

  const splitParents = new Set(
    db
      .prepare(`SELECT DISTINCT split_of FROM transactions WHERE split_of IN (${placeholders})`)
      .all(...ids)
      .map((r) => r.split_of),
  );

  return rows.map((r) => ({
    ...r,
    tags:       tagMap[r.id] ?? [],
    has_splits: splitParents.has(r.id),
  }));
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

// T25 — enhanced GET with filter params
router.get('/', (req, res) => {
  const { month, from, to, type, category_id, tag_id, search, is_reviewed } = req.query;

  if (month !== undefined && !MONTH_RE.test(month)) {
    return res.status(400).json({ error: 'month must be YYYY-MM' });
  }
  if (from !== undefined && !DATE_RE.test(from)) {
    return res.status(400).json({ error: 'from must be YYYY-MM-DD' });
  }
  if (to !== undefined && !DATE_RE.test(to)) {
    return res.status(400).json({ error: 'to must be YYYY-MM-DD' });
  }

  let sql = 'SELECT DISTINCT t.* FROM transactions t';
  const params = [];
  const where = [];

  if (tag_id) {
    sql += ' JOIN transaction_tags tt ON tt.transaction_id = t.id';
    where.push('tt.tag_id = ?');
    params.push(Number(tag_id));
  }

  if (month)       { where.push("strftime('%Y-%m', t.occurred_on) = ?"); params.push(month); }
  if (from)        { where.push('t.occurred_on >= ?');                   params.push(from); }
  if (to)          { where.push('t.occurred_on <= ?');                   params.push(to); }
  if (type)        { where.push('t.type = ?');                           params.push(type); }
  if (category_id) { where.push('t.category_id = ?');                   params.push(Number(category_id)); }
  if (search)      { where.push('t.note LIKE ?');                        params.push(`%${search}%`); }
  if (is_reviewed !== undefined) {
    where.push('t.is_reviewed = ?');
    params.push(Number(is_reviewed));
  }

  if (where.length) sql += ' WHERE ' + where.join(' AND ');
  sql += ' ORDER BY t.occurred_on DESC';

  const rows = db.prepare(sql).all(...params);
  res.json(withTags(rows));
});

router.post('/', (req, res) => {
  const errors = validate(req.body);
  if (errors.length) return res.status(400).json({ errors });

  const { amount_cents, type, category_id = null, occurred_on, note = null, tag_ids } = req.body;
  const result = db
    .prepare(
      'INSERT INTO transactions (amount_cents, type, category_id, occurred_on, note) VALUES (?, ?, ?, ?, ?)',
    )
    .run(amount_cents, type, category_id, occurred_on, note);

  syncTags(result.lastInsertRowid, tag_ids);
  const created = db.prepare('SELECT * FROM transactions WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(withTags([created])[0]);
});

router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT id FROM transactions WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Transaction not found' });

  const errors = validate(req.body);
  if (errors.length) return res.status(400).json({ errors });

  const { amount_cents, type, category_id = null, occurred_on, note = null, tag_ids, is_reviewed } = req.body;
  db.prepare(
    'UPDATE transactions SET amount_cents = ?, type = ?, category_id = ?, occurred_on = ?, note = ?, is_reviewed = ? WHERE id = ?',
  ).run(amount_cents, type, category_id, occurred_on, note, is_reviewed ? 1 : 0, req.params.id);

  syncTags(Number(req.params.id), tag_ids);
  const updated = db.prepare('SELECT * FROM transactions WHERE id = ?').get(req.params.id);
  res.json(withTags([updated])[0]);
});

router.delete('/:id', (req, res) => {
  const existing = db.prepare('SELECT id FROM transactions WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Transaction not found' });

  db.prepare('DELETE FROM transactions WHERE id = ?').run(req.params.id);
  res.status(200).json({ deleted: true });
});

// T26 — split
router.post('/:id/split', (req, res) => {
  const parent = db.prepare('SELECT * FROM transactions WHERE id = ?').get(req.params.id);
  if (!parent) return res.status(404).json({ error: 'Transaction not found' });

  const { splits } = req.body;
  if (!Array.isArray(splits) || splits.length < 2) {
    return res.status(400).json({ error: 'splits must be an array of at least 2 items' });
  }
  for (const s of splits) {
    if (!Number.isInteger(s.amount_cents) || s.amount_cents <= 0) {
      return res.status(400).json({ error: 'Each split amount_cents must be a positive integer' });
    }
  }
  const total = splits.reduce((s, r) => s + r.amount_cents, 0);
  if (total !== parent.amount_cents) {
    return res.status(400).json({
      error: `Split total (${total}) must equal parent amount (${parent.amount_cents})`,
    });
  }

  db.prepare('DELETE FROM transactions WHERE split_of = ?').run(parent.id);

  const insertChild = db.prepare(
    'INSERT INTO transactions (amount_cents, type, category_id, occurred_on, note, split_of, is_reviewed) VALUES (?, ?, ?, ?, ?, ?, 1)',
  );

  const childIds = [];
  for (const s of splits) {
    const r = insertChild.run(
      s.amount_cents,
      parent.type,
      s.category_id ?? null,
      parent.occurred_on,
      s.note ?? null,
      parent.id,
    );
    childIds.push(r.lastInsertRowid);
  }

  db.prepare('UPDATE transactions SET is_reviewed = 1 WHERE id = ?').run(parent.id);

  const updatedParent  = db.prepare('SELECT * FROM transactions WHERE id = ?').get(parent.id);
  const childRows      = db.prepare(`SELECT * FROM transactions WHERE id IN (${childIds.map(() => '?').join(',')})`).all(...childIds);

  res.json({
    parent:   withTags([updatedParent])[0],
    children: withTags(childRows),
  });
});

// T26 — unsplit
router.delete('/:id/unsplit', (req, res) => {
  const parent = db.prepare('SELECT * FROM transactions WHERE id = ?').get(req.params.id);
  if (!parent) return res.status(404).json({ error: 'Transaction not found' });

  db.prepare('DELETE FROM transactions WHERE split_of = ?').run(parent.id);
  db.prepare('UPDATE transactions SET is_reviewed = 0 WHERE id = ?').run(parent.id);

  const updated = db.prepare('SELECT * FROM transactions WHERE id = ?').get(parent.id);
  res.json(withTags([updated])[0]);
});

export default router;
