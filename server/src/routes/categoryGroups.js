import { Router } from 'express';
import db from '../db/index.js';

const router = Router();

function validate(body) {
  const errors = [];
  if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
    errors.push('name is required');
  }
  return errors;
}

router.get('/', (req, res) => {
  const groups = db.prepare('SELECT * FROM category_groups ORDER BY name').all();
  const catStmt = db.prepare('SELECT * FROM categories WHERE group_id = ? ORDER BY name');
  res.json(groups.map((g) => ({ ...g, categories: catStmt.all(g.id) })));
});

router.post('/', (req, res) => {
  const errors = validate(req.body);
  if (errors.length) return res.status(400).json({ errors });

  const result = db
    .prepare('INSERT INTO category_groups (name) VALUES (?)')
    .run(req.body.name.trim());
  const created = db
    .prepare('SELECT * FROM category_groups WHERE id = ?')
    .get(result.lastInsertRowid);
  res.status(201).json({ ...created, categories: [] });
});

router.put('/:id', (req, res) => {
  const existing = db
    .prepare('SELECT id FROM category_groups WHERE id = ?')
    .get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Category group not found' });

  const errors = validate(req.body);
  if (errors.length) return res.status(400).json({ errors });

  db.prepare('UPDATE category_groups SET name = ? WHERE id = ?').run(
    req.body.name.trim(),
    req.params.id,
  );
  const updated = db
    .prepare('SELECT * FROM category_groups WHERE id = ?')
    .get(req.params.id);
  const categories = db
    .prepare('SELECT * FROM categories WHERE group_id = ? ORDER BY name')
    .all(req.params.id);
  res.json({ ...updated, categories });
});

router.delete('/:id', (req, res) => {
  const existing = db
    .prepare('SELECT id FROM category_groups WHERE id = ?')
    .get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Category group not found' });

  db.prepare('DELETE FROM category_groups WHERE id = ?').run(req.params.id);
  res.status(200).json({ deleted: true });
});

export default router;
