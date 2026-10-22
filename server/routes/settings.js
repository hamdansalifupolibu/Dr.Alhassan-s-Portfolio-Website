const express = require('express');
const router = express.Router();
const db = require('../db/database');
const authMiddleware = require('../middleware/authMiddleware');

// GET /api/settings — public: returns all settings as key-value map
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const settingsObj = {};
  for (const row of rows) {
    settingsObj[row.key] = row.value;
  }
  res.json(settingsObj);
});

// PUT /api/settings — admin only: update multiple settings at once
router.put('/', authMiddleware, (req, res) => {
  const updates = req.body;
  if (!updates || typeof updates !== 'object') {
    return res.status(400).json({ error: 'Payload must be an object of key-value pairs.' });
  }

  const upsert = db.prepare(`
    INSERT INTO settings (key, value, updated_at)
    VALUES (?, ?, datetime('now'))
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')
  `);

  const updateMany = db.transaction((entries) => {
    for (const [k, v] of entries) {
      if (typeof v === 'string' || typeof v === 'number') {
        upsert.run(k, String(v));
      }
    }
  });

  updateMany(Object.entries(updates));

  // Return the updated settings map
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const settingsObj = {};
  for (const row of rows) {
    settingsObj[row.key] = row.value;
  }

  res.json({ message: 'Settings saved successfully', settings: settingsObj });
});

module.exports = router;
