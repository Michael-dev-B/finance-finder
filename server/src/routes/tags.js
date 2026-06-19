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
  return errors;
}

router.get('/', (req, res) => {
  res.json(db.prepare('SELECT * FROM tags ORDER BY name').all());
});

router.post('/', (req, res) => {
  const errors = validate(req.body);
  if (errors.length) return res.status(400).json({ errors });

  const { name, colour } = req.body;
  const result = db.prepare('INSERT INTO tags (name, colour) VALUES (?, ?)').run(name.trim(), colour);
  const created = db.prepare('SELECT * FROM tags WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(created);
});

router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT id FROM tags WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Tag not found' });

  const errors = validate(req.body);
  if (errors.length) return res.status(400).json({ errors });

  const { name, colour } = req.body;
  db.prepare('UPDATE tags SET name = ?, colour = ? WHERE id = ?').run(name.trim(), colour, req.params.id);
  res.json(db.prepare('SELECT * FROM tags WHERE id = ?').get(req.params.id));
});

router.delete('/:id', (req, res) => {
  const existing = db.prepare('SELECT id FROM tags WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Tag not found' });

  db.prepare('DELETE FROM tags WHERE id = ?').run(req.params.id);
  res.status(200).json({ deleted: true });
});

export default router;
