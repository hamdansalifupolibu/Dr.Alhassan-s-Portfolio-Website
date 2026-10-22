const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db/database');
const authMiddleware = require('../middleware/authMiddleware');

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files are allowed'), false);
  },
  limits: { fileSize: 20 * 1024 * 1024 } // 20MB max
});

// Middleware to verify access token (UMAT or paid) OR valid Admin JWT
const verifyAccess = (req, res, next) => {
  // Check admin authorization header first
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'dr-alhassan-admin-secret-2024';
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.admin = decoded;
      return next();
    } catch (e) {
      // If bearer token failed, fallback to checking access token
    }
  }

  const accessToken = req.headers['x-access-token'] || req.query.token;

  if (!accessToken) {
    return res.status(403).json({ error: 'Access denied: No access token provided' });
  }

  const tokenRecord = db.prepare('SELECT * FROM access_tokens WHERE token = ?').get(accessToken);

  if (!tokenRecord) {
    return res.status(403).json({ error: 'Access denied: Invalid token' });
  }

  if (new Date(tokenRecord.expires_at) < new Date()) {
    return res.status(403).json({ error: 'Access denied: Token expired' });
  }

  req.accessInfo = tokenRecord;
  next();
};

// GET /api/past-questions — requires access token
router.get('/', verifyAccess, (req, res) => {
  const questions = db.prepare('SELECT * FROM past_questions ORDER BY year DESC, created_at DESC').all();
  res.json(questions);
});

// GET /api/past-questions/:id/download — requires access token
router.get('/:id/download', verifyAccess, (req, res) => {
  const question = db.prepare('SELECT * FROM past_questions WHERE id = ?').get(req.params.id);

  if (!question) return res.status(404).json({ error: 'Past question not found' });

  const filePath = path.join(__dirname, '../uploads', question.file_path);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found on server' });
  }

  res.download(filePath, `${question.title}.pdf`);
});

// POST /api/past-questions — admin only (upload PDF)
router.post('/', authMiddleware, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'PDF file is required' });

  const { title, description, year, subject } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });

  const result = db.prepare(
    'INSERT INTO past_questions (title, description, year, subject, file_path) VALUES (?, ?, ?, ?, ?)'
  ).run(title, description || null, year ? parseInt(year) : null, subject || null, req.file.filename);

  const newQuestion = db.prepare('SELECT * FROM past_questions WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(newQuestion);
});

// PUT /api/past-questions/:id — admin only (update metadata)
router.put('/:id', authMiddleware, (req, res) => {
  const { title, description, year, subject } = req.body;
  const question = db.prepare('SELECT * FROM past_questions WHERE id = ?').get(req.params.id);

  if (!question) return res.status(404).json({ error: 'Past question not found' });

  db.prepare(`
    UPDATE past_questions SET title = ?, description = ?, year = ?, subject = ? WHERE id = ?
  `).run(
    title || question.title,
    description !== undefined ? description : question.description,
    year ? parseInt(year) : question.year,
    subject || question.subject,
    req.params.id
  );

  const updated = db.prepare('SELECT * FROM past_questions WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// DELETE /api/past-questions/:id — admin only
router.delete('/:id', authMiddleware, (req, res) => {
  const question = db.prepare('SELECT * FROM past_questions WHERE id = ?').get(req.params.id);
  if (!question) return res.status(404).json({ error: 'Past question not found' });

  // Delete file from disk
  const filePath = path.join(__dirname, '../uploads', question.file_path);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

  db.prepare('DELETE FROM past_questions WHERE id = ?').run(req.params.id);
  res.json({ message: 'Past question deleted successfully' });
});

module.exports = router;
