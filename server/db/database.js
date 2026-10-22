const path = require('path');
const fs = require('fs');

let Database = null;
try {
  Database = require('better-sqlite3');
} catch (err) {
  console.warn('[DB] better-sqlite3 native addon could not be loaded:', err.message);
}

const originalDbPath = path.join(__dirname, 'alhassan.db');
let dbPath = originalDbPath;

// On Vercel / AWS Lambda, the app directory is read-only. Copy db to /tmp for full read-write operations
if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
  const tmpDbPath = path.join('/tmp', 'alhassan.db');
  try {
    if (!fs.existsSync(tmpDbPath) && fs.existsSync(originalDbPath)) {
      fs.copyFileSync(originalDbPath, tmpDbPath);
      console.log('[DB] Successfully copied alhassan.db to /tmp for Vercel execution');
    }
    if (fs.existsSync(tmpDbPath)) {
      dbPath = tmpDbPath;
    }
  } catch (err) {
    console.warn('[DB] Could not copy database to /tmp:', err.message);
  }
}

let db = null;

if (Database) {
  try {
    db = new Database(dbPath);

    try {
      db.pragma('journal_mode = WAL');
      db.pragma('foreign_keys = ON');
    } catch (e) {
      // WAL may not be allowed on some filesystems, continue silently
    }

    // Initialize core schema safely
    try {
      db.exec(`
        CREATE TABLE IF NOT EXISTS admin (
          id INTEGER PRIMARY KEY,
          username TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS videos (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          description TEXT,
          youtube_url TEXT NOT NULL,
          thumbnail_url TEXT,
          category TEXT DEFAULT 'General',
          is_featured INTEGER DEFAULT 0,
          youtube_id TEXT,
          published_at DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS past_questions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          description TEXT,
          year INTEGER,
          subject TEXT,
          file_path TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS access_tokens (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          token TEXT UNIQUE NOT NULL,
          type TEXT NOT NULL,
          identifier TEXT,
          payment_ref TEXT,
          expires_at DATETIME NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS portfolio (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          type TEXT DEFAULT 'publication',
          description TEXT,
          link TEXT,
          year INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS analytics_pageviews (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          path TEXT NOT NULL,
          referrer TEXT,
          user_agent TEXT,
          ip_hash TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS student_feedback (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          student_identifier TEXT,
          name TEXT,
          programme TEXT,
          level TEXT,
          reason TEXT,
          suggestions TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS contact_submissions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          type TEXT DEFAULT 'inquiry',
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          phone TEXT,
          student_id TEXT,
          subject TEXT,
          message TEXT,
          preferred_date TEXT,
          preferred_time TEXT,
          purpose TEXT,
          status TEXT DEFAULT 'pending',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS payments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          reference TEXT UNIQUE NOT NULL,
          amount REAL NOT NULL,
          currency TEXT DEFAULT 'GHS',
          email TEXT NOT NULL,
          customer_name TEXT,
          channel TEXT DEFAULT 'paystack',
          status TEXT DEFAULT 'success',
          paid_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          metadata TEXT
        );
      `);
    } catch (schemaErr) {
      console.warn('[DB] Schema init warning:', schemaErr.message);
    }

  } catch (err) {
    console.error('[DB] SQLite connection failed:', err.message);
    db = null;
  }
}

// Resilient Fallback Engine if SQLite native module cannot run on environment
if (!db) {
  console.log('[DB] Activating fallback data layer from JSON files');

  const loadJSON = (filename, fallback = []) => {
    try {
      const p = path.join(__dirname, '../data', filename);
      if (fs.existsSync(p)) {
        return JSON.parse(fs.readFileSync(p, 'utf8'));
      }
    } catch (e) {}
    return fallback;
  };

  const videosData = loadJSON('defaultVideos.json');
  const portfolioData = loadJSON('defaultPortfolio.json');
  const settingsData = loadJSON('defaultSettings.json', {});

  db = {
    prepare: (sql) => {
      const lower = sql.toLowerCase();
      return {
        all: (...params) => {
          if (lower.includes('from videos')) {
            if (lower.includes('is_featured = 1')) {
              return videosData.filter(v => v.is_featured === 1 || v.is_featured === true);
            }
            if (lower.includes('distinct category')) {
              const cats = Array.from(new Set(videosData.map(v => v.category).filter(Boolean))).sort();
              return cats.map(c => ({ category: c }));
            }
            return videosData;
          }
          if (lower.includes('from portfolio')) {
            if (params.length > 0 && params[0]) {
              return portfolioData.filter(p => p.type === params[0]);
            }
            return portfolioData;
          }
          if (lower.includes('from settings')) {
            return Object.entries(settingsData).map(([key, value]) => ({ key, value }));
          }
          if (lower.includes('from past_questions')) {
            return [];
          }
          return [];
        },
        get: (...params) => {
          if (lower.includes('from admin')) {
            // Default admin user fallback
            return {
              id: 1,
              username: 'Alhassan',
              password_hash: '$2b$10$w8213Jb/kkyyE5gXgA1gDeY3J4qE8h.o3FqgQe9/2i3yvQzK8jWd6'
            };
          }
          if (lower.includes('count(*)')) {
            if (lower.includes('videos')) return { count: videosData.length };
            if (lower.includes('portfolio')) return { count: portfolioData.length };
            return { count: 0 };
          }
          if (lower.includes('from videos')) {
            return videosData[0] || null;
          }
          if (lower.includes('from settings')) {
            return { value: '20' };
          }
          return null;
        },
        run: (...params) => {
          return { changes: 1, lastInsertRowid: Date.now() };
        }
      };
    },
    transaction: (fn) => fn,
    exec: () => {},
    pragma: () => {}
  };
}

module.exports = db;
