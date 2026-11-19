const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../db/database');
const authMiddleware = require('../middleware/authMiddleware');

// Valid UMAT email domains
const UMAT_EMAIL_DOMAINS = ['st.umat.edu.gh', 'umat.edu.gh'];

// 1) 10-digit student ID / reference number (e.g., 4100813923)
const TEN_DIGIT_ID_REGEX = /^\d{10}$/;

// 2) Formatted or unformatted department index number:
// Examples:
// - FCM4100813923 or EL4100813923 or MN4100813923
// - FCM.41.008.139.23 or EL.41.008.139.23
// - UMAT/2024/1234 or UG/22/0456
const INDEX_NUMBER_REGEX = /^[A-Z]{2,4}(\.?\d{1,4}){3,6}$/i;
const LEGACY_REF_REGEX = /^(UMAT|UG)\/\d{2,4}\/\d{3,6}$/i;

const generateToken = () => crypto.randomBytes(32).toString('hex');

const TOKEN_DURATION_HOURS = 72; // 3 days access

// Helper function to validate UMaT identifiers
function validateUmatStudent(rawInput) {
  if (!rawInput || typeof rawInput !== 'string') return { isValid: false };

  const trimmed = rawInput.trim();
  const lower = trimmed.toLowerCase();

  // A) Student Email Check
  if (lower.includes('@')) {
    const domain = lower.split('@')[1];
    if (UMAT_EMAIL_DOMAINS.includes(domain)) {
      return {
        isValid: true,
        type: 'email',
        identifier: lower,
        detectedLabel: `Student Email (${lower})`,
      };
    }
    return {
      isValid: false,
      reason: 'Please use your official UMaT student email ending in @st.umat.edu.gh',
    };
  }

  // B) 10-digit Student ID / Reference Number (e.g. 4100813923)
  const digitsOnly = trimmed.replace(/\s+/g, '');
  if (TEN_DIGIT_ID_REGEX.test(digitsOnly)) {
    return {
      isValid: true,
      type: 'student_id',
      identifier: digitsOnly,
      detectedLabel: `10-digit Student ID (${digitsOnly})`,
    };
  }

  // C) Department Index Number (e.g., FCM4100813923 or FCM.41.008.139.23)
  // Clean dots and spaces if any
  const normalizedIndex = trimmed.toUpperCase().replace(/\s+/g, '');
  if (INDEX_NUMBER_REGEX.test(normalizedIndex) || LEGACY_REF_REGEX.test(normalizedIndex)) {
    return {
      isValid: true,
      type: 'index_number',
      identifier: normalizedIndex,
      detectedLabel: `Index Number (${normalizedIndex})`,
    };
  }

  return {
    isValid: false,
    reason: 'Invalid UMaT student identifier. Provide a valid student email, 10-digit student ID, or index number (e.g. FCM4100813923 or FCM.41.008.139.23).',
  };
}

// POST /api/access/verify-student — UMAT student verification
router.post('/verify-student', async (req, res) => {
  const { identifier } = req.body;

  if (!identifier) {
    return res.status(400).json({
      error: 'Student identifier required',
      message: 'Please enter your UMaT student email, 10-digit student ID, or index number.',
    });
  }

  const check = validateUmatStudent(identifier);

  if (!check.isValid) {
    return res.status(403).json({
      error: 'Verification Failed',
      message: check.reason || 'Verification failed. Please check your details and try again or contact Dr. Alhassan Osman.',
    });
  }

  // Check if this identifier already has an active token
  const existing = await db.prepare(`
    SELECT * FROM access_tokens
    WHERE identifier = ? AND type = 'umat' AND expires_at > datetime('now')
  `).get(check.identifier);

  if (existing) {
    return res.json({
      token: existing.token,
      identifier: check.identifier,
      detectedLabel: check.detectedLabel,
      message: 'Access granted! Welcome, UMaT student.',
    });
  }

  const token = generateToken();
  const expiresAt = new Date(Date.now() + TOKEN_DURATION_HOURS * 60 * 60 * 1000).toISOString();

  await db.prepare(
    'INSERT INTO access_tokens (token, type, identifier, expires_at) VALUES (?, ?, ?, ?)'
  ).run(token, 'umat', check.identifier, expiresAt);

  res.json({
    token,
    identifier: check.identifier,
    detectedLabel: check.detectedLabel,
    message: 'Access granted! Welcome, UMaT student.',
  });
});

// POST /api/access/feedback — optional student survey/feedback
router.post('/feedback', async (req, res) => {
  const { studentIdentifier, name, programme, level, reason, suggestions } = req.body;

  try {
    await db.prepare(`
      INSERT INTO student_feedback (student_identifier, name, programme, level, reason, suggestions)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      studentIdentifier || 'anonymous',
      name || null,
      programme || null,
      level || null,
      reason || null,
      suggestions || null
    );

    res.json({ message: 'Thank you for your feedback! It helps Dr. Alhassan improve these study resources.' });
  } catch (err) {
    console.error('Feedback insertion error:', err);
    res.status(500).json({ error: 'Could not submit feedback.' });
  }
});

// GET /api/access/feedback — admin only: view student feedback
router.get('/feedback', authMiddleware, async (req, res) => {
  const rows = await db.prepare(`
    SELECT * FROM student_feedback
    ORDER BY created_at DESC
    LIMIT 100
  `).all();
  res.json(rows);
});

// POST /api/access/verify-token — check if a stored token is still valid
router.post('/verify-token', async (req, res) => {
  const { token } = req.body;

  if (!token) return res.status(400).json({ valid: false });

  const record = await db.prepare(`
    SELECT * FROM access_tokens WHERE token = ? AND expires_at > datetime('now')
  `).get(token);

  if (!record) return res.json({ valid: false });

  res.json({ valid: true, type: record.type, identifier: record.identifier });
});

const DEFAULT_PAYSTACK_PUBLIC_KEY = 'pk_live_31edc9824f6209e93c2ec11b860d8899f6400db2';
const MIN_PRICE_GHS = 0.1; // Paystack cannot charge less than this
const MAX_PRICE_GHS = 10000;

// Single source of truth for the fee — always read fresh from the database (never cached).
async function readPaymentConfig() {
  const rows = await db
    .prepare("SELECT key, value FROM settings WHERE key IN ('nonUmatPrice', 'paymentEnabled')")
    .all();
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  const parsed = parseFloat(map.nonUmatPrice);
  return {
    priceGHS: Number.isFinite(parsed) ? parsed : 20,
    paymentEnabled: map.paymentEnabled !== undefined ? map.paymentEnabled !== 'false' : true,
    paystackPublicKey: process.env.PAYSTACK_PUBLIC_KEY || DEFAULT_PAYSTACK_PUBLIC_KEY,
  };
}

// Accepts true/false, "true"/"false", 1/0
function parseBool(v) {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  if (typeof v === 'string') return !['false', '0', 'off', 'no', ''].includes(v.trim().toLowerCase());
  return Boolean(v);
}

// GET /api/access/public-config — public: get Paystack public key & current configured price
router.get('/public-config', async (req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    res.json(await readPaymentConfig());
  } catch (err) {
    console.error('Failed to read public payment config:', err);
    // Do NOT silently report a made-up price — the client must not charge a wrong amount.
    res.status(503).json({ error: 'Payment configuration is temporarily unavailable. Please try again.' });
  }
});

// GET /api/access/payment-config — admin: get current payment settings
router.get('/payment-config', authMiddleware, async (req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    res.json({ ...(await readPaymentConfig()), persistent: db.persistent, storageMode: db.mode });
  } catch (err) {
    console.error('Failed to read payment config:', err);
    res.status(500).json({ error: 'Failed to read payment configuration: ' + err.message });
  }
});

// PUT /api/access/payment-config — admin: update payment fee & status
router.put('/payment-config', authMiddleware, async (req, res) => {
  res.set('Cache-Control', 'no-store');
  const { priceGHS, paymentEnabled } = req.body || {};
  const upsertSql = `
    INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now'))
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')
  `;
  const statements = [];

  if (priceGHS !== undefined && priceGHS !== null && priceGHS !== '') {
    const num = typeof priceGHS === 'number' ? priceGHS : parseFloat(String(priceGHS).replace(/,/g, ''));
    if (!Number.isFinite(num) || num < MIN_PRICE_GHS || num > MAX_PRICE_GHS) {
      return res.status(400).json({
        error: `Price must be a number between GH₵ ${MIN_PRICE_GHS.toFixed(2)} and GH₵ ${MAX_PRICE_GHS}.`,
      });
    }
    const rounded = Math.round(num * 100) / 100;
    statements.push({ sql: upsertSql, args: ['nonUmatPrice', String(rounded)] });
  }

  if (paymentEnabled !== undefined && paymentEnabled !== null) {
    statements.push({ sql: upsertSql, args: ['paymentEnabled', parseBool(paymentEnabled) ? 'true' : 'false'] });
  }

  if (statements.length === 0) {
    return res.status(400).json({ error: 'Nothing to update. Provide priceGHS and/or paymentEnabled.' });
  }

  try {
    await db.batch(statements); // atomic: both values change together or not at all
    const saved = await readPaymentConfig(); // read back what is actually stored
    res.json({
      success: true,
      message: 'Payment configuration updated successfully',
      ...saved,
      persistent: db.persistent,
      storageMode: db.mode,
    });
  } catch (err) {
    console.error('Failed to update payment config:', err);
    res.status(500).json({ error: 'Failed to save the new fee: ' + err.message });
  }
});

// POST /api/access/paystack-verify — verify Paystack payment, store transaction, and issue token
router.post('/paystack-verify', async (req, res) => {
  const { reference, email: clientEmail, name: clientName } = req.body;

  if (!reference) {
    return res.status(400).json({ error: 'Payment reference is required' });
  }

  // Check if this payment ref already issued a token
  const existingToken = await db.prepare(`
    SELECT * FROM access_tokens WHERE payment_ref = ? AND expires_at > datetime('now')
  `).get(reference);

  if (existingToken) {
    return res.json({
      ok: true,
      token: existingToken.token,
      message: 'Access already active for this payment reference.',
    });
  }

  try {
    const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
    if (!PAYSTACK_SECRET) {
      return res.status(500).json({
        error: 'Paystack Secret Key is not configured on the server. Please add PAYSTACK_SECRET_KEY to your environment variables.',
      });
    }

    const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!data.status || data.data?.status !== 'success') {
      return res.status(400).json({
        error: 'Payment verification failed',
        message: data.message || 'Transaction was not successful on Paystack.',
      });
    }

    const tx = data.data;
    const amountGHS = tx.amount ? tx.amount / 100 : 20.0;
    const currency = tx.currency || 'GHS';
    const email = tx.customer?.email || clientEmail || 'customer@paystack.com';
    const customerName =
      [tx.customer?.first_name, tx.customer?.last_name].filter(Boolean).join(' ') ||
      clientName ||
      'External Student';
    const channel = tx.channel || 'mobile_money/card';
    const paidAt = tx.paid_at || new Date().toISOString();

    // Insert or update transaction in payments table
    try {
      await db.prepare(`
        INSERT INTO payments (reference, amount, currency, email, customer_name, channel, status, paid_at, metadata)
        VALUES (?, ?, ?, ?, ?, ?, 'success', ?, ?)
        ON CONFLICT(reference) DO UPDATE SET status = 'success', paid_at = excluded.paid_at
      `).run(
        reference,
        amountGHS,
        currency,
        email,
        customerName,
        channel,
        paidAt,
        JSON.stringify(tx.metadata || {})
      );
    } catch (dbErr) {
      console.warn('Payment record warning (continuing to issue token):', dbErr.message);
    }

    const token = generateToken();
    const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(); // 1 year access

    await db.prepare(`
      INSERT INTO access_tokens (token, type, identifier, payment_ref, expires_at)
      VALUES (?, 'paid', ?, ?, ?)
    `).run(token, email, reference, expiresAt);

    res.json({
      ok: true,
      token,
      message: `Payment of GH₵ ${amountGHS.toFixed(2)} verified successfully! Welcome to Dr. Alhassan's resource portal.`,
      payment: {
        reference,
        amount: amountGHS,
        currency,
        email,
        customerName,
        channel,
        paidAt,
      },
    });
  } catch (err) {
    console.error('Paystack verification error:', err);
    res.status(500).json({ error: 'Server error during payment verification: ' + err.message });
  }
});

// GET /api/access/payments — admin only: view all Paystack transactions (auto-syncs recent Paystack transactions)
router.get('/payments', authMiddleware, async (req, res) => {
  // Background/Inline sync with Paystack API if PAYSTACK_SECRET_KEY is present
  const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
  if (PAYSTACK_SECRET) {
    try {
      const psRes = await fetch('https://api.paystack.co/transaction?perPage=50', {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
          'Content-Type': 'application/json',
        },
      });
      const psJson = await psRes.json();
      if (psJson && psJson.status && Array.isArray(psJson.data)) {
        const insertTx = await db.prepare(`
          INSERT INTO payments (reference, amount, currency, email, customer_name, channel, status, paid_at, metadata)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(reference) DO UPDATE SET
            status = excluded.status,
            paid_at = COALESCE(payments.paid_at, excluded.paid_at)
        `);
        const insertToken = await db.prepare(`
          INSERT OR IGNORE INTO access_tokens (token, type, identifier, payment_ref, expires_at)
          VALUES (?, 'paid', ?, ?, ?)
        `);

        for (const tx of psJson.data) {
          if (tx.status === 'success' && tx.reference) {
            const amountGHS = tx.amount ? tx.amount / 100 : 20.0;
            const currency = tx.currency || 'GHS';
            const email = tx.customer?.email || 'customer@paystack.com';
            const customerName =
              [tx.customer?.first_name, tx.customer?.last_name].filter(Boolean).join(' ') || 'External Student';
            const channel = tx.channel || 'mobile_money/card';
            const paidAt = tx.paid_at || new Date().toISOString();

            await insertTx.run(
              tx.reference,
              amountGHS,
              currency,
              email,
              customerName,
              channel,
              'success',
              paidAt,
              JSON.stringify(tx.metadata || {})
            );

            // Also ensure access token is recorded for the user
            const existingToken = await db.prepare('SELECT token FROM access_tokens WHERE payment_ref = ?').get(tx.reference);
            if (!existingToken) {
              const token = generateToken();
              const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
              await insertToken.run(token, email, tx.reference, expiresAt);
            }
          }
        }
      }
    } catch (syncErr) {
      console.warn('[Payments Auto-Sync] Could not sync transactions from Paystack:', syncErr.message);
    }
  }

  try {
    const payments = await db.prepare(`
      SELECT * FROM payments
      ORDER BY datetime(paid_at) DESC
      LIMIT 100
    `).all();

    const summary = await db.prepare(`
      SELECT
        COUNT(*) as totalCount,
        COALESCE(SUM(amount), 0) as totalRevenue
      FROM payments
      WHERE status = 'success'
    `).get();

    res.json({
      payments,
      totalCount: summary.totalCount || 0,
      totalRevenue: summary.totalRevenue || 0,
    });
  } catch (err) {
    console.error('Failed to get payments:', err);
    res.status(500).json({ error: 'Failed to retrieve payments' });
  }
});

module.exports = router;
