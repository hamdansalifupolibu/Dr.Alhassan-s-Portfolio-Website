const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/database');
const authMiddleware = require('../middleware/authMiddleware');

const JWT_SECRET = process.env.JWT_SECRET || 'dr-alhassan-admin-secret-2024';

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  // Case-insensitive comparison for username convenience
  const admin = db.prepare('SELECT * FROM admin WHERE LOWER(username) = LOWER(?)').get(username.trim());

  if (!admin) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const isValid = bcrypt.compareSync(password, admin.password_hash);

  if (!isValid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { id: admin.id, username: admin.username },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({ token, username: admin.username });
});

// GET /api/auth/me — returns current admin profile (protected)
router.get('/me', authMiddleware, (req, res) => {
  const admin = db.prepare('SELECT id, username FROM admin WHERE id = ?').get(req.admin.id);
  if (!admin) return res.status(404).json({ error: 'Admin not found' });
  res.json(admin);
});

// PUT /api/auth/change-credentials — change username and/or password (protected)
router.put('/change-credentials', authMiddleware, (req, res) => {
  const { currentPassword, newUsername, newPassword } = req.body;

  if (!currentPassword) {
    return res.status(400).json({ error: 'Current password is required to verify your identity.' });
  }

  const admin = db.prepare('SELECT * FROM admin WHERE id = ?').get(req.admin.id);
  if (!admin) {
    return res.status(404).json({ error: 'Admin account not found.' });
  }

  const isValid = bcrypt.compareSync(currentPassword, admin.password_hash);
  if (!isValid) {
    return res.status(401).json({ error: 'Incorrect current password.' });
  }

  let updatedUsername = admin.username;
  if (newUsername && newUsername.trim()) {
    const trimmed = newUsername.trim();
    // Check if new username is already taken by another ID
    const conflict = db.prepare('SELECT id FROM admin WHERE LOWER(username) = LOWER(?) AND id != ?').get(trimmed, admin.id);
    if (conflict) {
      return res.status(400).json({ error: 'Username is already taken.' });
    }
    updatedUsername = trimmed;
  }

  let updatedPasswordHash = admin.password_hash;
  if (newPassword && newPassword.trim()) {
    if (newPassword.trim().length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters.' });
    }
    updatedPasswordHash = bcrypt.hashSync(newPassword.trim(), 10);
  }

  db.prepare('UPDATE admin SET username = ?, password_hash = ? WHERE id = ?')
    .run(updatedUsername, updatedPasswordHash, admin.id);

  // Issue new token with updated username
  const newToken = jwt.sign(
    { id: admin.id, username: updatedUsername },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({
    message: 'Credentials updated successfully!',
    username: updatedUsername,
    token: newToken,
  });
});

module.exports = router;
