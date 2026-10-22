const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../db/database');
const authMiddleware = require('../middleware/authMiddleware');

// POST /api/analytics/track — record a pageview (public, lightweight)
router.post('/track', (req, res) => {
  const { path: pagePath, referrer } = req.body;
  if (!pagePath) return res.status(400).json({ error: 'path is required' });

  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  const ipHash = crypto.createHash('md5').update(ip).digest('hex').slice(0, 12);
  const userAgent = req.headers['user-agent'] || 'unknown';

  db.prepare(`
    INSERT INTO analytics_pageviews (path, referrer, user_agent, ip_hash)
    VALUES (?, ?, ?, ?)
  `).run(pagePath, referrer || null, userAgent, ipHash);

  res.json({ ok: true });
});

// GET /api/analytics/summary — admin only: comprehensive dashboard stats
router.get('/summary', authMiddleware, (req, res) => {
  // Total pageviews
  const totalViews = db.prepare('SELECT count(*) as count FROM analytics_pageviews').get().count;

  // Unique visitors (unique ip_hash)
  const uniqueVisitors = db.prepare('SELECT count(DISTINCT ip_hash) as count FROM analytics_pageviews').get().count;

  // Today's views
  const todayViews = db.prepare(`
    SELECT count(*) as count FROM analytics_pageviews
    WHERE date(created_at) = date('now')
  `).get().count;

  // Pageviews by path (top 10)
  const topPages = db.prepare(`
    SELECT path, count(*) as views, count(DISTINCT ip_hash) as visitors
    FROM analytics_pageviews
    GROUP BY path
    ORDER BY views DESC
    LIMIT 10
  `).all();

  // Views over the last 7 days
  const last7Days = db.prepare(`
    SELECT date(created_at) as day, count(*) as views, count(DISTINCT ip_hash) as visitors
    FROM analytics_pageviews
    WHERE created_at >= datetime('now', '-7 days')
    GROUP BY date(created_at)
    ORDER BY day ASC
  `).all();

  // Resource access counts (UMAT vs Paid)
  const tokenStats = db.prepare(`
    SELECT type, count(*) as count
    FROM access_tokens
    GROUP BY type
  `).all();

  // Payment transactions and revenue summary
  let totalRevenue = 0;
  let totalPaidCount = 0;
  let recentPayments = [];
  try {
    const paySummary = db.prepare(`
      SELECT
        COUNT(*) as count,
        COALESCE(SUM(amount), 0) as revenue
      FROM payments
      WHERE status = 'success'
    `).get();
    totalRevenue = paySummary?.revenue || 0;
    totalPaidCount = paySummary?.count || 0;

    recentPayments = db.prepare(`
      SELECT id, reference, amount, currency, email, customer_name, channel, status, paid_at
      FROM payments
      ORDER BY datetime(paid_at) DESC
      LIMIT 10
    `).all();
  } catch (err) {
    console.warn('Payment query in analytics:', err.message);
  }

  // Device breakdown (Desktop vs Mobile vs Tablet)
  const allUserAgents = db.prepare(`
    SELECT user_agent FROM analytics_pageviews
    ORDER BY id DESC
    LIMIT 500
  `).all();

  let mobile = 0;
  let desktop = 0;
  let tablet = 0;

  for (const row of allUserAgents) {
    const ua = (row.user_agent || '').toLowerCase();
    if (ua.includes('ipad') || ua.includes('tablet')) {
      tablet++;
    } else if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      mobile++;
    } else {
      desktop++;
    }
  }

  // Recent 20 real-time pageviews
  const recentPageviews = db.prepare(`
    SELECT id, path, referrer, ip_hash, created_at
    FROM analytics_pageviews
    ORDER BY id DESC
    LIMIT 20
  `).all();

  // Total past questions, videos, portfolio
  const totalVideos = db.prepare('SELECT count(*) as count FROM videos').get().count;
  const totalPastQuestions = db.prepare('SELECT count(*) as count FROM past_questions').get().count;
  const totalPortfolio = db.prepare('SELECT count(*) as count FROM portfolio').get().count;

  res.json({
    totalViews,
    uniqueVisitors,
    todayViews,
    topPages,
    last7Days,
    tokenStats,
    paymentStats: {
      totalRevenue,
      totalPaidCount,
      recentPayments,
    },
    deviceStats: {
      mobile,
      desktop,
      tablet,
      total: mobile + desktop + tablet,
    },
    recentPageviews,
    contentCounts: {
      videos: totalVideos,
      pastQuestions: totalPastQuestions,
      portfolio: totalPortfolio,
    },
  });
});

module.exports = router;
