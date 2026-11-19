// Core schema. Every statement is idempotent (IF NOT EXISTS) so it is safe to run on every cold start.
module.exports = `
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
  access TEXT NOT NULL DEFAULT 'paid',
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

-- Students who unlocked the FREE past questions (info form, no payment)
CREATE TABLE IF NOT EXISTS free_access_signups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  programme TEXT,
  level TEXT,
  token TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`;
