import { Router } from 'express';
import db from '../db/index.js';

const router = Router();

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

function validate(body) {
  const errors = [];
  if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
    errors.push('name is required');
  }
  if (!body.colour || !HEX_RE.test(body.colour)) {
    errors.push('colour must be a 6-digit hex value (e.g. #22c55e)');
  }
  if (
    body.monthly_budget_cents !== undefined &&
    body.monthly_budget_cents !== null &&
    (!Number.isInteger(body.monthly_budget_cents) || body.monthly_budget_cents <= 0)
  ) {
    errors.push('monthly_budget_cents must be a positive integer');
  }
  if (
    body.group_id !== undefined &&
    body.group_id !== null &&
    !Number.isInteger(body.group_id)
  ) {
    errors.push('group_id must be an integer or null');
  }
  return errors;
}

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM categories ORDER BY name').all();
  res.json(rows);
});

router.post('/', (req, res) => {
  const errors = validate(req.body);
  if (errors.length) return res.status(400).json({ errors });

  const { name, colour, monthly_budget_cents = null, group_id = null } = req.body;
  const result = db
    .prepare(
      'INSERT INTO categories (name, colour, monthly_budget_cents, group_id) VALUES (?, ?, ?, ?)',
    )
    .run(name.trim(), colour, monthly_budget_cents, group_id);

  const created = db
    .prepare('SELECT * FROM categories WHERE id = ?')
    .get(result.lastInsertRowid);
  res.status(201).json(created);
});

router.put('/:id', (req, res) => {
  const existing = db
    .prepare('SELECT id FROM categories WHERE id = ?')
    .get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Category not found' });

  const errors = validate(req.body);
  if (errors.length) return res.status(400).json({ errors });

  const { name, colour, monthly_budget_cents = null, group_id = null } = req.body;
  db.prepare(
    'UPDATE categories SET name = ?, colour = ?, monthly_budget_cents = ?, group_id = ? WHERE id = ?',
  ).run(name.trim(), colour, monthly_budget_cents, group_id, req.params.id);

  const updated = db
    .prepare('SELECT * FROM categories WHERE id = ?')
    .get(req.params.id);
  res.json(updated);
});

router.delete('/:id', (req, res) => {
  const existing = db
    .prepare('SELECT id FROM categories WHERE id = ?')
    .get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Category not found' });

  db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
  res.status(200).json({ deleted: true });
});

export default router;
