#!/usr/bin/env node
/**
 * One-time migration: copy the local SQLite database (server/db/alhassan.db) into Turso,
 * and upload locally stored past-question PDFs (server/uploads) to Vercel Blob.
 *
 * Usage (from the server/ folder), with the values from Turso and Vercel:
 *
 *   TURSO_DATABASE_URL=libsql://... TURSO_AUTH_TOKEN=... BLOB_READ_WRITE_TOKEN=... node scripts/migrate-to-turso.js
 *
 * Or put the three variables in server/.env and run:  npm run migrate:turso
 *
 * Safe to re-run: rows are inserted with INSERT OR REPLACE on their primary key, and PDFs that are
 * already URLs are skipped. Add --force to migrate even if the Turso database already has data.
 */
require('dotenv').config();
const path = require('path');
const fs = require('fs');
const { createClient } = require('@libsql/client');

const SOURCE = process.env.SQLITE_PATH
  ? path.resolve(process.env.SQLITE_PATH)
  : path.join(__dirname, '..', 'db', 'alhassan.db');
const UPLOADS = path.join(__dirname, '..', 'uploads');
const force = process.argv.includes('--force');

async function main() {
  const url = (process.env.TURSO_DATABASE_URL || '').trim();
  if (!url) throw new Error('TURSO_DATABASE_URL is not set.');
  if (!fs.existsSync(SOURCE)) throw new Error(`Source database not found: ${SOURCE}`);

  const src = createClient({ url: 'file:' + SOURCE.replace(/\\/g, '/'), intMode: 'number' });
  const dst = createClient({ url, authToken: (process.env.TURSO_AUTH_TOKEN || '').trim() || undefined, intMode: 'number' });

  // Create schema in Turso
  await dst.executeMultiple(require('../db/schema'));

  const existing = await dst.execute('SELECT COUNT(*) AS c FROM admin');
  if (Number(existing.rows[0].c) > 0 && !force) {
    console.log('Turso already contains data (admin table not empty). Re-run with --force to overwrite rows.');
  }

  const tables = (
    await src.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
  ).rows.map((r) => r.name);

  for (const table of tables) {
    // Make sure the table exists in Turso (covers any table not in schema.js)
    const ddl = (await src.execute({ sql: "SELECT sql FROM sqlite_master WHERE type='table' AND name = ?", args: [table] })).rows[0].sql;
    await dst.execute(ddl.replace(/^CREATE TABLE\s+(?!IF NOT EXISTS)/i, 'CREATE TABLE IF NOT EXISTS '));

    const rs = await src.execute(`SELECT * FROM "${table}"`);
    if (!rs.rows.length) {
      console.log(`  ${table}: 0 rows`);
      continue;
    }
    if (Number(existing.rows[0].c) > 0 && !force) continue;

    const cols = rs.columns;
    const sql = `INSERT OR REPLACE INTO "${table}" (${cols.map((c) => `"${c}"`).join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`;
    const stmts = rs.rows.map((row) => ({ sql, args: cols.map((_, i) => row[i] ?? null) }));
    for (let i = 0; i < stmts.length; i += 200) {
      await dst.batch(stmts.slice(i, i + 200), 'write');
    }
    console.log(`  ${table}: ${stmts.length} rows copied`);
  }

  // Upload local PDFs to Vercel Blob and point the records at the permanent URL
  if ((process.env.BLOB_READ_WRITE_TOKEN || '').trim()) {
    const { put } = require('@vercel/blob');
    const pqs = (await dst.execute('SELECT id, title, file_path FROM past_questions')).rows;
    for (const pq of pqs) {
      if (/^https?:\/\//i.test(pq.file_path)) continue;
      const local = path.join(UPLOADS, pq.file_path);
      if (!fs.existsSync(local)) {
        console.warn(`  ! PDF for "${pq.title}" not found locally (${pq.file_path}) — re-upload it from the admin panel.`);
        continue;
      }
      const blob = await put(`past-questions/${pq.file_path}`, fs.readFileSync(local), {
        access: 'public',
        contentType: 'application/pdf',
        addRandomSuffix: true,
      });
      await dst.execute({ sql: 'UPDATE past_questions SET file_path = ? WHERE id = ?', args: [blob.url, pq.id] });
      console.log(`  ✓ Uploaded "${pq.title}" to Vercel Blob`);
    }
  } else {
    console.log('BLOB_READ_WRITE_TOKEN not set — skipping PDF upload to Vercel Blob.');
  }

  console.log('\nMigration complete.');
}

main().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
