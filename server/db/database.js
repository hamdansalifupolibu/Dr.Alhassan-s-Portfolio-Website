const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'alhassan.db');

const db = new Database(DB_PATH);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize schema
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

  -- Site Settings & Content Editable Table (Key-Value store)
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Pageviews / Analytics tracking table
  CREATE TABLE IF NOT EXISTS analytics_pageviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    path TEXT NOT NULL,
    referrer TEXT,
    user_agent TEXT,
    ip_hash TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Student Feedback / Survey Table
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

  -- Contact Inquiries & Office Hour Bookings
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

  -- Paystack Payments & Transactions Table
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

// Safe column migrations for videos table
const columnsToAdd = [
  'ALTER TABLE videos ADD COLUMN is_featured INTEGER DEFAULT 0',
  'ALTER TABLE videos ADD COLUMN youtube_id TEXT',
  'ALTER TABLE videos ADD COLUMN published_at DATETIME',
];

for (const stmt of columnsToAdd) {
  try {
    db.exec(stmt);
  } catch {
    // Ignore duplicate column errors if already added
  }
}

// Ensure unique index on youtube_id
try {
  db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_videos_youtube_id ON videos(youtube_id) WHERE youtube_id IS NOT NULL');
} catch {
  // Ignore if index exists
}

module.exports = db;
