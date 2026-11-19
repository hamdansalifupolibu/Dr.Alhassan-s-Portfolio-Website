const express = require('express');
const router = express.Router();
const db = require('../db/database');
const authMiddleware = require('../middleware/authMiddleware');

// Payment keys are owned exclusively by PUT /api/access/payment-config (Admin Dashboard → fee control).
// The general site-settings form must never overwrite them with a stale value it loaded earlier.
const PAYMENT_KEYS = new Set(['nonUmatPrice', 'paymentEnabled']);

async function readSettingsMap() {
  const rows = await db.prepare('SELECT key, value FROM settings').all();
  const settingsObj = {};
  for (const row of rows) {
    settingsObj[row.key] = row.value;
  }
  return settingsObj;
}

// GET /api/settings — public: returns all settings as key-value map
router.get('/', async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    res.json(await readSettingsMap());
  } catch (err) {
    console.error('Failed to read settings:', err);
    res.status(500).json({ error: 'Failed to read settings' });
  }
});

// PUT /api/settings — admin only: update multiple settings at once
router.put('/', authMiddleware, async (req, res) => {
  const updates = req.body;
  if (!updates || typeof updates !== 'object') {
    return res.status(400).json({ error: 'Payload must be an object of key-value pairs.' });
  }

  const upsertSql = `
    INSERT INTO settings (key, value, updated_at)
    VALUES (?, ?, datetime('now'))
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')
  `;

  const statements = Object.entries(updates)
    .filter(([k, v]) => !PAYMENT_KEYS.has(k) && (typeof v === 'string' || typeof v === 'number'))
    .map(([k, v]) => ({ sql: upsertSql, args: [k, String(v)] }));

  try {
    await db.batch(statements);
    res.json({ message: 'Settings saved successfully', settings: await readSettingsMap() });
  } catch (err) {
    console.error('Failed to save settings:', err);
    res.status(500).json({ error: 'Failed to save settings: ' + err.message });
  }
});

module.exports = router;
