require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL ? [process.env.CLIENT_URL, 'http://localhost:5173'] : true,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure uploads folder exists safely (handles Vercel read-only filesystem)
const uploadsDir = process.env.VERCEL
  ? path.join('/tmp', 'uploads')
  : path.join(__dirname, 'uploads');

try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
} catch (e) {
  console.warn('Could not create uploads directory:', e.message);
}

// Static uploads folder
app.use('/uploads', express.static(uploadsDir));
if (process.env.VERCEL) {
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
}

// Health check
const healthCheck = (req, res) => {
  res.json({ status: 'ok', message: 'Dr. Alhassan API is running' });
};
app.get('/api/health', healthCheck);
app.get('/health', healthCheck);

// API Routes (mounted on both /api/* and root /* to ensure Vercel rewrites match either way)
const authRoutes = require('./routes/auth');
const videoRoutes = require('./routes/videos');
const pastQuestionRoutes = require('./routes/pastQuestions');
const portfolioRoutes = require('./routes/portfolio');
const accessRoutes = require('./routes/access');
const settingsRoutes = require('./routes/settings');
const analyticsRoutes = require('./routes/analytics');
const contactRoutes = require('./routes/contact');

app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);

app.use('/api/videos', videoRoutes);
app.use('/videos', videoRoutes);

app.use('/api/past-questions', pastQuestionRoutes);
app.use('/past-questions', pastQuestionRoutes);

app.use('/api/portfolio', portfolioRoutes);
app.use('/portfolio', portfolioRoutes);

app.use('/api/access', accessRoutes);
app.use('/access', accessRoutes);

app.use('/api/settings', settingsRoutes);
app.use('/settings', settingsRoutes);

app.use('/api/analytics', analyticsRoutes);
app.use('/analytics', analyticsRoutes);

app.use('/api/contact', contactRoutes);
app.use('/contact', contactRoutes);

// Serve static client assets in production if client/dist exists
const clientDistPath = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));

  app.get('/{*splat}', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// 404 handler for unmatched API routes
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  if (err.message === 'Only PDF files are allowed') {
    return res.status(400).json({ error: err.message });
  }
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

module.exports = app;
