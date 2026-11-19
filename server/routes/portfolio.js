const express = require('express');
const router = express.Router();
const db = require('../db/database');
const authMiddleware = require('../middleware/authMiddleware');

// GET /api/portfolio — public
router.get('/', async (req, res) => {
  const { type } = req.query;
  let items;

  if (type && type !== 'All') {
    items = await db.prepare('SELECT * FROM portfolio WHERE type = ? ORDER BY year DESC, created_at DESC').all(type);
  } else {
    items = await db.prepare('SELECT * FROM portfolio ORDER BY year DESC, created_at DESC').all();
  }

  res.json(items);
});

// GET /api/portfolio/types — public
router.get('/types', async (req, res) => {
  const types = await db.prepare('SELECT DISTINCT type FROM portfolio').all();
  res.json(['All', ...types.map(t => t.type)]);
});

// POST /api/portfolio — admin only
router.post('/', authMiddleware, async (req, res) => {
  const { title, type, description, link, year } = req.body;

  if (!title) return res.status(400).json({ error: 'Title is required' });

  const result = await db.prepare(
    'INSERT INTO portfolio (title, type, description, link, year) VALUES (?, ?, ?, ?, ?)'
  ).run(title, type || 'publication', description || null, link || null, year ? parseInt(year) : null);

  const newItem = await db.prepare('SELECT * FROM portfolio WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(newItem);
});

// PUT /api/portfolio/:id — admin only
router.put('/:id', authMiddleware, async (req, res) => {
  const { title, type, description, link, year } = req.body;
  const item = await db.prepare('SELECT * FROM portfolio WHERE id = ?').get(req.params.id);

  if (!item) return res.status(404).json({ error: 'Portfolio item not found' });

  await db.prepare(`
    UPDATE portfolio SET title = ?, type = ?, description = ?, link = ?, year = ? WHERE id = ?
  `).run(
    title || item.title,
    type || item.type,
    description !== undefined ? description : item.description,
    link !== undefined ? link : item.link,
    year ? parseInt(year) : item.year,
    req.params.id
  );

  const updated = await db.prepare('SELECT * FROM portfolio WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// DELETE /api/portfolio/:id — admin only
router.delete('/:id', authMiddleware, async (req, res) => {
  const item = await db.prepare('SELECT * FROM portfolio WHERE id = ?').get(req.params.id);
  if (!item) return res.status(404).json({ error: 'Portfolio item not found' });

  await db.prepare('DELETE FROM portfolio WHERE id = ?').run(req.params.id);
  res.json({ message: 'Portfolio item deleted successfully' });
});

module.exports = router;
