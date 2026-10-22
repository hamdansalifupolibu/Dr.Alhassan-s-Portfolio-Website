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
router.post('/verify-student', (req, res) => {
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
  const existing = db.prepare(`
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

  db.prepare(
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
router.post('/feedback', (req, res) => {
  const { studentIdentifier, name, programme, level, reason, suggestions } = req.body;

  try {
    db.prepare(`
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
router.get('/feedback', authMiddleware, (req, res) => {
  const rows = db.prepare(`
    SELECT * FROM student_feedback
    ORDER BY created_at DESC
    LIMIT 100
  `).all();
  res.json(rows);
});

// POST /api/access/verify-token — check if a stored token is still valid
router.post('/verify-token', (req, res) => {
  const { token } = req.body;

  if (!token) return res.status(400).json({ valid: false });

  const record = db.prepare(`
    SELECT * FROM access_tokens WHERE token = ? AND expires_at > datetime('now')
  `).get(token);

  if (!record) return res.json({ valid: false });

  res.json({ valid: true, type: record.type, identifier: record.identifier });
});

// GET /api/access/public-config — public: get Paystack public key & current configured price
router.get('/public-config', (req, res) => {
  try {
    const priceRow = db.prepare("SELECT value FROM settings WHERE key = 'nonUmatPrice'").get();
    const enabledRow = db.prepare("SELECT value FROM settings WHERE key = 'paymentEnabled'").get();

    const priceGHS = priceRow && !isNaN(parseFloat(priceRow.value)) ? parseFloat(priceRow.value) : 20;
    const paymentEnabled = enabledRow ? enabledRow.value !== 'false' : true;

    res.json({
      paystackPublicKey:
        process.env.PAYSTACK_PUBLIC_KEY || 'pk_live_31edc9824f6209e93c2ec11b860d8899f6400db2',
      priceGHS,
      paymentEnabled,
    });
  } catch (err) {
    res.json({
      paystackPublicKey:
        process.env.PAYSTACK_PUBLIC_KEY || 'pk_live_31edc9824f6209e93c2ec11b860d8899f6400db2',
      priceGHS: 20,
      paymentEnabled: true,
    });
  }
});

// GET /api/access/payment-config — admin: get current payment settings
router.get('/payment-config', authMiddleware, (req, res) => {
  try {
    const priceRow = db.prepare("SELECT value FROM settings WHERE key = 'nonUmatPrice'").get();
    const enabledRow = db.prepare("SELECT value FROM settings WHERE key = 'paymentEnabled'").get();

    const priceGHS = priceRow && !isNaN(parseFloat(priceRow.value)) ? parseFloat(priceRow.value) : 20;
    const paymentEnabled = enabledRow ? enabledRow.value !== 'false' : true;

    res.json({
      priceGHS,
      paymentEnabled,
      paystackPublicKey:
        process.env.PAYSTACK_PUBLIC_KEY || 'pk_live_31edc9824f6209e93c2ec11b860d8899f6400db2',
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to read payment configuration' });
  }
});

// PUT /api/access/payment-config — admin: update payment fee & status
router.put('/payment-config', authMiddleware, (req, res) => {
  try {
    const { priceGHS, paymentEnabled } = req.body;

    if (priceGHS !== undefined) {
      const num = parseFloat(priceGHS);
      if (isNaN(num) || num < 0) {
        return res.status(400).json({ error: 'Price must be a valid non-negative number' });
      }
      db.prepare(`
        INSERT INTO settings (key, value, updated_at) VALUES ('nonUmatPrice', ?, datetime('now'))
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')
      `).run(String(num));
    }

    if (paymentEnabled !== undefined) {
      db.prepare(`
        INSERT INTO settings (key, value, updated_at) VALUES ('paymentEnabled', ?, datetime('now'))
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')
      `).run(paymentEnabled ? 'true' : 'false');
    }

    const priceRow = db.prepare("SELECT value FROM settings WHERE key = 'nonUmatPrice'").get();
    const enabledRow = db.prepare("SELECT value FROM settings WHERE key = 'paymentEnabled'").get();

    res.json({
      success: true,
      message: 'Payment configuration updated successfully',
      priceGHS: priceRow ? parseFloat(priceRow.value) : 20,
      paymentEnabled: enabledRow ? enabledRow.value !== 'false' : true,
    });
  } catch (err) {
    console.error('Failed to update payment config:', err);
    res.status(500).json({ error: 'Failed to update payment configuration' });
  }
});

// POST /api/access/paystack-verify — verify Paystack payment, store transaction, and issue token
router.post('/paystack-verify', async (req, res) => {
  const { reference, email: clientEmail, name: clientName } = req.body;

  if (!reference) {
    return res.status(400).json({ error: 'Payment reference is required' });
  }

  // Check if this payment ref already issued a token
  const existingToken = db.prepare(`
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
      db.prepare(`
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

    db.prepare(`
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

// GET /api/access/payments — admin only: view all Paystack transactions
router.get('/payments', authMiddleware, (req, res) => {
  try {
    const payments = db.prepare(`
      SELECT * FROM payments
      ORDER BY datetime(paid_at) DESC
      LIMIT 100
    `).all();

    const summary = db.prepare(`
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
