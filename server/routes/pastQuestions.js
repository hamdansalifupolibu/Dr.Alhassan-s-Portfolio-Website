const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const db = require('../db/database');
const authMiddleware = require('../middleware/authMiddleware');

const JWT_SECRET = process.env.JWT_SECRET || 'dr-alhassan-admin-secret-2024';
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

/*
 * Storage strategy
 * ----------------
 * - BLOB_READ_WRITE_TOKEN set (production on Vercel): the admin's browser uploads the PDF DIRECTLY to
 *   Vercel Blob (permanent storage, no 4.5 MB serverless body limit). The API only issues a short-lived
 *   upload token and then records the resulting URL in the database.
 * - No Blob token (local development): classic multipart upload to server/uploads via multer.
 */
const blobEnabled = () => Boolean((process.env.BLOB_READ_WRITE_TOKEN || '').trim());
const BLOB_MAX_BYTES = 100 * 1024 * 1024; // 100 MB
const LOCAL_MAX_BYTES = 20 * 1024 * 1024; // 20 MB
const isRemoteFile = (p) => /^https?:\/\//i.test(p || '');

function isTrustedBlobUrl(url) {
  try {
    const u = new URL(url);
    return u.protocol === 'https:' && u.hostname.endsWith('.blob.vercel-storage.com');
  } catch {
    return false;
  }
}

const getUploadDir = () => {
  const dir = isServerless ? path.join('/tmp', 'uploads') : path.join(__dirname, '../uploads');
  if (!fs.existsSync(dir)) {
    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch (e) {
      console.warn('Could not create upload directory:', e.message);
    }
  }
  return dir;
};

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, getUploadDir()),
    filename: (req, file, cb) => {
      const safe = file.originalname.replace(/[^\w.\-()]+/g, '_');
      cb(null, `${Date.now()}-${safe}`);
    },
  }),
  fileFilter: (req, file, cb) => {
    const looksPdf = file.mimetype === 'application/pdf' || /\.pdf$/i.test(file.originalname);
    if (looksPdf) cb(null, true);
    else cb(new Error('Only PDF files are allowed'), false);
  },
  limits: { fileSize: LOCAL_MAX_BYTES },
});

// Run multer only for multipart requests and turn its errors into clear 400 responses
const maybeMultipart = (req, res, next) => {
  if (!req.is('multipart/form-data')) return next();
  upload.single('file')(req, res, (err) => {
    if (!err) return next();
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        error: `PDF is too large. Maximum size is ${Math.round(LOCAL_MAX_BYTES / 1024 / 1024)} MB.`,
      });
    }
    return res.status(400).json({ error: err.message || 'Upload failed' });
  });
};

// Admin JWT (header or ?token=) OR a valid student/paid access token
const verifyAccess = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const candidates = [];
  if (authHeader && authHeader.startsWith('Bearer ')) candidates.push(authHeader.slice(7));
  if (req.query.token) candidates.push(String(req.query.token));

  for (const t of candidates) {
    try {
      req.admin = jwt.verify(t, JWT_SECRET);
      return next();
    } catch (e) {
      // not an admin token — fall through to access-token check
    }
  }

  const accessToken = req.headers['x-access-token'] || req.query.token;
  if (!accessToken) {
    if (candidates.length) {
      // An Authorization token was sent but is not a valid admin JWT (expired, or JWT_SECRET changed)
      console.warn(`[PastQuestions] ${req.method} ${req.originalUrl.split('?')[0]}: admin token rejected (expired or invalid)`);
    }
    return res.status(403).json({ error: 'Access denied: No access token provided' });
  }

  try {
    const tokenRecord = await db.prepare('SELECT * FROM access_tokens WHERE token = ?').get(accessToken);
    if (!tokenRecord) {
      return res.status(403).json({ error: 'Access denied: Invalid token' });
    }
    if (new Date(tokenRecord.expires_at) < new Date()) {
      return res.status(403).json({ error: 'Access denied: Token expired' });
    }
    req.accessInfo = tokenRecord;
    next();
  } catch (err) {
    next(err);
  }
};

// GET /api/past-questions/upload-config — admin: tells the UI which upload path to use
router.get('/upload-config', authMiddleware, (req, res) => {
  const mode = blobEnabled() ? 'blob' : 'local';
  res.json({
    mode,
    maxBytes: mode === 'blob' ? BLOB_MAX_BYTES : LOCAL_MAX_BYTES,
    persistent: mode === 'blob' || !isServerless,
  });
});

// POST /api/past-questions/blob-token — admin: issue a short-lived client token for a direct Blob upload
router.post('/blob-token', authMiddleware, async (req, res) => {
  if (!blobEnabled()) {
    return res.status(503).json({ error: 'Vercel Blob storage is not configured (BLOB_READ_WRITE_TOKEN missing).' });
  }
  try {
    const { handleUpload } = require('@vercel/blob/client');
    const result = await handleUpload({
      body: req.body,
      request: req,
      onBeforeGenerateToken: async (pathname) => {
        if (!/\.pdf$/i.test(pathname)) throw new Error('Only PDF files are allowed');
        return {
          allowedContentTypes: ['application/pdf'],
          maximumSizeInBytes: BLOB_MAX_BYTES,
          addRandomSuffix: true,
        };
      },
    });
    res.json(result);
  } catch (err) {
    console.error('Blob token error:', err);
    res.status(400).json({ error: err.message || 'Could not authorise upload' });
  }
});

// GET /api/past-questions — requires access token
router.get('/', verifyAccess, async (req, res) => {
  const questions = await db.prepare('SELECT * FROM past_questions ORDER BY year DESC, created_at DESC').all();
  // Never expose raw storage URLs in listings; downloads go through the access-checked endpoint.
  res.json(questions.map(({ file_path, ...q }) => q));
});

// GET /api/past-questions/:id/download — requires access token
router.get('/:id/download', verifyAccess, async (req, res) => {
  const question = await db.prepare('SELECT * FROM past_questions WHERE id = ?').get(req.params.id);
  if (!question) return res.status(404).json({ error: 'Past question not found' });

  if (isRemoteFile(question.file_path)) {
    // Stored in Vercel Blob: redirect to the file (streaming through a serverless function would hit size limits)
    return res.redirect(302, question.file_path);
  }

  const possiblePaths = [
    path.join('/tmp', 'uploads', question.file_path),
    path.join(__dirname, '../uploads', question.file_path),
  ];
  const filePath = possiblePaths.find((p) => fs.existsSync(p));
  if (!filePath) {
    return res.status(404).json({ error: 'File not found on server. Please ask the admin to re-upload this paper.' });
  }

  res.download(filePath, `${question.title}.pdf`);
});

// POST /api/past-questions — admin only
//  - Blob mode: JSON body { title, subject, year, description, blobUrl }
//  - Local mode: multipart form with field "file"
router.post('/', authMiddleware, maybeMultipart, async (req, res) => {
  const { title, description, year, subject, blobUrl } = req.body || {};

  const cleanupLocal = () => {
    if (req.file) fs.promises.unlink(req.file.path).catch(() => {});
  };

  if (!title || !String(title).trim()) {
    cleanupLocal();
    return res.status(400).json({ error: 'Title is required' });
  }

  let storedPath;
  if (blobUrl) {
    if (!isTrustedBlobUrl(blobUrl)) {
      return res.status(400).json({ error: 'Invalid file URL' });
    }
    storedPath = blobUrl;
  } else if (req.file) {
    if (isServerless && blobEnabled() === false) {
      console.warn('[PastQuestions] Saved to /tmp on serverless — this file is NOT persistent. Configure Vercel Blob.');
    }
    storedPath = req.file.filename;
  } else {
    return res.status(400).json({ error: 'PDF file is required' });
  }

  const parsedYear = year ? parseInt(year, 10) : null;

  try {
    const result = await db
      .prepare('INSERT INTO past_questions (title, description, year, subject, file_path) VALUES (?, ?, ?, ?, ?)')
      .run(
        String(title).trim(),
        description ? String(description).trim() : null,
        Number.isFinite(parsedYear) ? parsedYear : null,
        subject ? String(subject).trim() : null,
        storedPath
      );

    const newQuestion = await db.prepare('SELECT * FROM past_questions WHERE id = ?').get(result.lastInsertRowid);
    const { file_path, ...publicFields } = newQuestion || {};
    res.status(201).json(publicFields);
  } catch (err) {
    console.error('Failed to save past question:', err);
    cleanupLocal();
    if (blobUrl) await deleteStoredFile(blobUrl);
    res.status(500).json({ error: 'Failed to save past question: ' + err.message });
  }
});

// PUT /api/past-questions/:id — admin only (update metadata)
router.put('/:id', authMiddleware, async (req, res) => {
  const { title, description, year, subject } = req.body;
  const question = await db.prepare('SELECT * FROM past_questions WHERE id = ?').get(req.params.id);
  if (!question) return res.status(404).json({ error: 'Past question not found' });

  await db.prepare(`
    UPDATE past_questions SET title = ?, description = ?, year = ?, subject = ? WHERE id = ?
  `).run(
    title || question.title,
    description !== undefined ? description : question.description,
    year ? parseInt(year, 10) : question.year,
    subject || question.subject,
    req.params.id
  );

  const updated = await db.prepare('SELECT * FROM past_questions WHERE id = ?').get(req.params.id);
  const { file_path, ...publicFields } = updated;
  res.json(publicFields);
});

async function deleteStoredFile(filePath) {
  if (isRemoteFile(filePath)) {
    if (!blobEnabled()) return;
    try {
      const { del } = require('@vercel/blob');
      await del(filePath);
    } catch (e) {
      console.warn('Could not delete blob:', e.message);
    }
    return;
  }
  for (const p of [path.join('/tmp', 'uploads', filePath), path.join(__dirname, '../uploads', filePath)]) {
    try {
      if (fs.existsSync(p)) fs.unlinkSync(p);
    } catch (e) {}
  }
}

// DELETE /api/past-questions/:id — admin only
router.delete('/:id', authMiddleware, async (req, res) => {
  const question = await db.prepare('SELECT * FROM past_questions WHERE id = ?').get(req.params.id);
  if (!question) return res.status(404).json({ error: 'Past question not found' });

  await db.prepare('DELETE FROM past_questions WHERE id = ?').run(req.params.id);
  await deleteStoredFile(question.file_path);
  res.json({ message: 'Past question deleted successfully' });
});

module.exports = router;
