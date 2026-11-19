/**
 * Database layer (libSQL / SQLite).
 *
 * - Production (Vercel): set TURSO_DATABASE_URL + TURSO_AUTH_TOKEN. Turso is hosted SQLite, so every
 *   serverless instance reads and writes the SAME database and changes are permanent.
 * - Local development: falls back to the SQLite file at server/db/alhassan.db.
 * - Vercel WITHOUT Turso: falls back to a throw-away copy in /tmp. This is NOT persistent (changes are
 *   lost and differ between instances) and is reported via `db.persistent === false` / GET /api/health.
 *
 * API (all async):
 *   await db.prepare(sql).get(...params)   -> first row object or undefined
 *   await db.prepare(sql).all(...params)   -> array of row objects
 *   await db.prepare(sql).run(...params)   -> { changes, lastInsertRowid }
 *   await db.batch([{ sql, args }, ...])   -> runs statements atomically in one transaction
 *   await db.ready                         -> resolves once the schema is initialised
 */
const path = require('path');
const fs = require('fs');
const { createClient } = require('@libsql/client');
const schema = require('./schema');

const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const bundledDbPath = path.join(__dirname, 'alhassan.db');

const toFileUrl = (p) => 'file:' + p.replace(/\\/g, '/');

function resolveConnection() {
  const remoteUrl = (process.env.TURSO_DATABASE_URL || process.env.LIBSQL_URL || '').trim();
  if (remoteUrl) {
    return {
      mode: 'turso',
      persistent: true,
      config: {
        url: remoteUrl,
        authToken: (process.env.TURSO_AUTH_TOKEN || process.env.LIBSQL_AUTH_TOKEN || '').trim() || undefined,
      },
    };
  }

  if (isServerless) {
    // Read-only deployment filesystem: work on a temporary copy. Not durable.
    const tmpPath = path.join('/tmp', 'alhassan.db');
    try {
      if (!fs.existsSync(tmpPath) && fs.existsSync(bundledDbPath)) {
        fs.copyFileSync(bundledDbPath, tmpPath);
      }
    } catch (err) {
      console.warn('[DB] Could not copy bundled database to /tmp:', err.message);
    }
    console.warn(
      '[DB] ⚠️  TURSO_DATABASE_URL is not set. Using a temporary /tmp copy of SQLite — admin changes ' +
        '(prices, uploads, payments) will NOT persist on serverless hosting. Configure Turso.'
    );
    return { mode: 'tmp-sqlite', persistent: false, config: { url: toFileUrl(tmpPath) } };
  }

  const localPath = process.env.SQLITE_PATH ? path.resolve(process.env.SQLITE_PATH) : bundledDbPath;
  return { mode: 'local-sqlite', persistent: true, config: { url: toFileUrl(localPath) } };
}

const connection = resolveConnection();
const client = createClient({ ...connection.config, intMode: 'number' });

// libSQL accepts null but not undefined; booleans are stored as 0/1 like better-sqlite3 did.
function normalizeArgs(params) {
  const flat = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
  return flat.map((v) => {
    if (v === undefined) return null;
    if (typeof v === 'boolean') return v ? 1 : 0;
    if (typeof v === 'bigint') return Number(v);
    return v;
  });
}

function toObjects(rs) {
  return rs.rows.map((row) => {
    const obj = {};
    rs.columns.forEach((col, i) => {
      const val = row[i];
      obj[col] = typeof val === 'bigint' ? Number(val) : val;
    });
    return obj;
  });
}

// Include the underlying network cause ("fetch failed" alone says nothing)
function describeError(err) {
  const parts = [err && err.message];
  let c = err && err.cause;
  while (c && parts.length < 4) {
    parts.push(c.code ? `${c.code}: ${c.message}` : c.message);
    c = c.cause;
  }
  return parts.filter(Boolean).join(' <- ');
}

async function init() {
  if (connection.mode !== 'turso') {
    // Local SQLite: WAL improves concurrency. Ignore if the filesystem refuses it.
    try {
      await client.execute('PRAGMA journal_mode = WAL');
    } catch (e) {}
  }
  await client.executeMultiple(schema);
  console.log(`[DB] Connected (${connection.mode}${connection.persistent ? '' : ', NOT persistent'})`);
}

// Initialise once, but if it fails (e.g. a transient network error on cold start) try again on the
// next request instead of leaving this instance permanently broken.
let readyPromise = null;
function ensureReady() {
  if (!readyPromise) {
    readyPromise = init().catch((err) => {
      readyPromise = null;
      const wrapped = new Error(describeError(err));
      console.error('[DB] Initialisation failed:', wrapped.message);
      throw wrapped;
    });
  }
  return readyPromise;
}
ensureReady().catch(() => {});

const db = {
  mode: connection.mode,
  persistent: connection.persistent,
  get ready() {
    return ensureReady();
  },
  describeError,
  client,

  prepare(sql) {
    return {
      async get(...params) {
        const rs = await client.execute({ sql, args: normalizeArgs(params) });
        return toObjects(rs)[0];
      },
      async all(...params) {
        const rs = await client.execute({ sql, args: normalizeArgs(params) });
        return toObjects(rs);
      },
      async run(...params) {
        const rs = await client.execute({ sql, args: normalizeArgs(params) });
        return {
          changes: rs.rowsAffected,
          lastInsertRowid: rs.lastInsertRowid !== undefined ? Number(rs.lastInsertRowid) : undefined,
        };
      },
    };
  },

  async batch(statements) {
    if (!statements.length) return [];
    return client.batch(
      statements.map((s) => ({ sql: s.sql, args: normalizeArgs(s.args || []) })),
      'write'
    );
  },

  async exec(sql) {
    return client.executeMultiple(sql);
  },
};

module.exports = db;
