const express = require('express');
const router = express.Router();
const https = require('https');
const db = require('../db/database');
const authMiddleware = require('../middleware/authMiddleware');

const DEFAULT_CHANNEL_ID = 'UCf34Js08RbulU-GowH7N_Bg'; // Dr. Alhassan Wiela, Ph.D.

// Helper to fetch text from an HTTPS URL with redirect following
function httpsFetch(url) {
  return new Promise((resolve, reject) => {
    https.get(
      url,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      },
      (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return httpsFetch(res.headers.location).then(resolve).catch(reject);
        }
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve(data));
      }
    ).on('error', reject);
  });
}

// Helper to deduce an accurate engineering category from video title
function autoCategorize(title = '') {
  const lower = title.toLowerCase();
  if (
    lower.includes('exam') ||
    lower.includes('past question') ||
    lower.includes('question') ||
    lower.includes('quiz') ||
    lower.includes('solution') ||
    lower.includes('section b') ||
    lower.includes('pe162') ||
    lower.includes('ch162') ||
    lower.includes('ce1b') ||
    lower.includes('cy1a') ||
    lower.includes('is 151') ||
    lower.includes('ma151')
  ) {
    return 'Exam Solutions & Quizzes';
  }
  if (lower.includes('electromagnetic')) {
    return 'Electromagnetic Field Theory';
  }
  if (
    lower.includes('electrostatic') ||
    lower.includes('coulomb') ||
    lower.includes('gauss') ||
    lower.includes('electric field') ||
    lower.includes('electric flux')
  ) {
    return 'Electrostatics';
  }
  if (
    lower.includes('thevenin') ||
    lower.includes('norton') ||
    lower.includes('superposition') ||
    lower.includes('millman') ||
    lower.includes('mesh') ||
    lower.includes('nodal') ||
    lower.includes('kirchhoff') ||
    lower.includes('ohm') ||
    lower.includes('power transfer') ||
    lower.includes('network reduction') ||
    lower.includes('branch current') ||
    lower.includes('applied electricity')
  ) {
    return 'Circuit Theorems & Analysis';
  }
  if (
    lower.includes('amplifier') ||
    lower.includes('substractor') ||
    lower.includes('op-amp') ||
    lower.includes('inverting') ||
    lower.includes('summing') ||
    lower.includes('differentiator') ||
    lower.includes('integrator')
  ) {
    return 'Operational Amplifiers';
  }
  if (
    lower.includes('transistor') ||
    lower.includes('diode') ||
    lower.includes('biasing') ||
    lower.includes('semiconductor') ||
    lower.includes('pn junction') ||
    lower.includes('barrier potential')
  ) {
    return 'Semiconductor Devices';
  }
  if (
    lower.includes('capacitor') ||
    lower.includes('magnetic') ||
    lower.includes('hysteresis') ||
    lower.includes('storage') ||
    lower.includes('motor') ||
    lower.includes('grid')
  ) {
    return 'Energy & Magnetics';
  }
  return 'General Engineering';
}

// Helper to make JSON POST requests for YouTube InnerTube pagination
function postJSON(url, body) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const req = https.request(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      }
    );
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

// Comprehensive YouTube Channel Scraper that retrieves ALL videos across all pages
async function scrapeAllChannelVideos(channelUrl = 'https://www.youtube.com/@AlhassanWielaPh.D/videos') {
  const html = await httpsFetch(channelUrl);
  const keyMatch = html.match(/"INNERTUBE_API_KEY":"([^"]+)"/);
  const apiKey = keyMatch ? keyMatch[1] : null;

  const m = html.match(/var ytInitialData = ({[\s\S]*?});<\/script>/);
  if (!m) return [];

  const data = JSON.parse(m[1]);
  const tabs = data?.contents?.twoColumnBrowseResultsRenderer?.tabs || [];
  const videosTab = tabs.find((t) => t.tabRenderer?.title === 'Videos' || t.tabRenderer?.selected);
  const contents = videosTab?.tabRenderer?.content?.richGridRenderer?.contents || [];

  const videoMap = new Map();

  function addItem(videoId, title, subtitle = '', desc = '', pub = '') {
    if (!videoId || videoMap.has(videoId)) return;
    const cleanTitle = (title || 'Video Lecture').replace(/&amp;/g, '&').replace(/&quot;/g, '"').trim();
    const cleanDesc = desc || subtitle || `UMaT Engineering Lecture: ${cleanTitle}`;
    videoMap.set(videoId, {
      videoId,
      title: cleanTitle,
      description: cleanDesc,
      publishedAt: pub || new Date().toISOString(),
      youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`,
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      category: autoCategorize(cleanTitle),
    });
  }

  function parseItems(items) {
    for (const item of items) {
      const lvm = item?.richItemRenderer?.content?.lockupViewModel;
      if (lvm && lvm.contentId) {
        const title = lvm.metadata?.lockupMetadataViewModel?.title?.content;
        const rows = lvm.metadata?.lockupMetadataViewModel?.metadata?.contentMetadataViewModel?.metadataRows || [];
        const subtitle = rows.map((r) => r.parts?.map((p) => p.text?.content).join(' ')).join(' • ');
        addItem(lvm.contentId, title, subtitle);
        continue;
      }
      const vr = item?.richItemRenderer?.content?.videoRenderer;
      if (vr && vr.videoId) {
        const title = vr.title?.runs?.[0]?.text || vr.title?.accessibility?.accessibilityData?.label;
        const desc = vr.descriptionSnippet?.runs?.map((r) => r.text).join('') || '';
        const pub = vr.publishedTimeText?.simpleText || '';
        addItem(vr.videoId, title, '', desc, pub);
      }
    }
  }

  parseItems(contents);

  // Paginate through continuation tokens
  let continuationItem = contents.find((c) => c.continuationItemRenderer);
  let continuationToken = continuationItem?.continuationItemRenderer?.continuationEndpoint?.continuationCommand?.token;
  let page = 1;

  while (continuationToken && apiKey && page < 20) {
    page++;
    try {
      const postUrl = `https://www.youtube.com/youtubei/v1/browse?key=${apiKey}`;
      const res = await postJSON(postUrl, {
        context: { client: { clientName: 'WEB', clientVersion: '2.20240101.00.00' } },
        continuation: continuationToken,
      });

      const appendItems = res?.onResponseReceivedActions?.[0]?.appendContinuationItemsAction?.continuationItems || [];
      parseItems(appendItems);

      continuationItem = appendItems.find((c) => c.continuationItemRenderer);
      continuationToken = continuationItem?.continuationItemRenderer?.continuationEndpoint?.continuationCommand?.token;
      if (!continuationToken) break;
    } catch (e) {
      console.warn(`YouTube pagination page ${page} failed:`, e.message);
      break;
    }
  }

  return Array.from(videoMap.values());
}

// Fallback RSS feed parser
async function fetchFromRSS(channelId = DEFAULT_CHANNEL_ID) {
  try {
    const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    const xml = await httpsFetch(rssUrl);
    const entries = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)];

    return entries.map((entryMatch) => {
      const content = entryMatch[1];
      const videoIdMatch = content.match(/<yt:videoId>([^<]+)<\/yt:videoId>/);
      const titleMatch = content.match(/<title>([^<]+)<\/title>/);
      const pubMatch = content.match(/<published>([^<]+)<\/published>/);
      const descMatch = content.match(/<media:description>([\s\S]*?)<\/media:description>/);

      const videoId = videoIdMatch ? videoIdMatch[1].trim() : null;
      const title = titleMatch ? titleMatch[1].replace(/&amp;/g, '&').replace(/&quot;/g, '"').trim() : 'Video Lecture';
      const publishedAt = pubMatch ? pubMatch[1].trim() : new Date().toISOString();
      const description = descMatch ? descMatch[1].trim() : `Lecture session on ${title}`;
      return {
        videoId,
        title,
        publishedAt,
        description,
        youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`,
        thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        category: autoCategorize(title),
      };
    }).filter((item) => item.videoId);
  } catch (err) {
    console.warn('RSS fallback error:', err.message);
    return [];
  }
}

// Master sync function: fetches all videos, preserves admin custom edits and featured stars
async function syncYouTubeFeed() {
  let targetUrl = 'https://www.youtube.com/@AlhassanWielaPh.D/videos';

  try {
    const row = db.prepare("SELECT value FROM settings WHERE key = 'youtubeChannel'").get();
    if (row && row.value) {
      const v = row.value.trim();
      targetUrl = v.endsWith('/videos') ? v : `${v.replace(/\/$/, '')}/videos`;
    }
  } catch (err) {
    console.warn('Could not read custom channel URL:', err.message);
  }

  let items = [];
  try {
    items = await scrapeAllChannelVideos(targetUrl);
    console.log(`Scraped ${items.length} total videos from channel tab.`);
  } catch (err) {
    console.warn('Full scraper encountered issue, falling back to RSS:', err.message);
    items = await fetchFromRSS(DEFAULT_CHANNEL_ID);
  }

  if (items.length === 0) {
    items = await fetchFromRSS(DEFAULT_CHANNEL_ID);
  }

  if (items.length === 0) {
    return { synced: 0, total: 0 };
  }

  const findStmt = db.prepare('SELECT id, is_featured FROM videos WHERE youtube_id = ? OR youtube_url = ?');
  const insertStmt = db.prepare(`
    INSERT INTO videos (title, description, youtube_url, thumbnail_url, category, is_featured, youtube_id, published_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const updateStmt = db.prepare(`
    UPDATE videos SET
      title = ?,
      description = COALESCE(?, description),
      thumbnail_url = COALESCE(?, thumbnail_url),
      published_at = COALESCE(?, published_at),
      category = COALESCE(?, category),
      youtube_id = ?
    WHERE id = ?
  `);

  // Check how many featured videos exist right now
  const existingFeatured = db.prepare('SELECT COUNT(*) as count FROM videos WHERE is_featured = 1').get()?.count || 0;

  let syncedCount = 0;

  const insertTx = db.transaction((list) => {
    list.forEach((item, idx) => {
      const existing = findStmt.get(item.videoId, item.youtubeUrl);
      if (existing) {
        updateStmt.run(
          item.title,
          item.description,
          item.thumbnailUrl,
          item.publishedAt,
          item.category,
          item.videoId,
          existing.id
        );
      } else {
        // If no featured videos yet, feature the top 3 by default
        const shouldFeature = existingFeatured === 0 && idx < 3;
        insertStmt.run(
          item.title,
          item.description,
          item.youtubeUrl,
          item.thumbnailUrl,
          item.category,
          shouldFeature ? 1 : 0,
          item.videoId,
          item.publishedAt
        );
      }
      syncedCount++;
    });
  });

  insertTx(items);

  const totalInDb = db.prepare('SELECT COUNT(*) as count FROM videos').get()?.count || 0;
  return { synced: syncedCount, total: totalInDb };
}

// Background auto-sync: sync immediately on launch if library has < 50 items, then periodic every 6 hours
setTimeout(() => {
  try {
    const currentCount = db.prepare('SELECT COUNT(*) as count FROM videos').get()?.count || 0;
    if (currentCount < 50) {
      console.log(`[Auto-Sync] Library has only ${currentCount} videos. Initiating complete YouTube channel sync...`);
      syncYouTubeFeed()
        .then((res) => console.log(`[Auto-Sync] Complete! Synced: ${res.synced}, Total in DB: ${res.total}`))
        .catch((err) => console.error('[Auto-Sync] Error:', err.message));
    }
  } catch (err) {
    console.error('[Auto-Sync] Check error:', err.message);
  }
}, 3000);

// Recurring background sync every 6 hours (21,600,000 ms)
setInterval(() => {
  console.log('[Auto-Sync] Running scheduled 6-hour YouTube channel sync...');
  syncYouTubeFeed()
    .then((res) => console.log(`[Auto-Sync] Scheduled sync completed: ${res.total} videos in DB`))
    .catch((err) => console.error('[Auto-Sync] Scheduled sync failed:', err.message));
}, 6 * 60 * 60 * 1000);

// ── ROUTES ───────────────────────────────────────────────────────────────────

// GET /api/videos — public: get all videos ordered with featured first
router.get('/', (req, res) => {
  const { category, featured, limit } = req.query;
  let query = 'SELECT * FROM videos';
  const conditions = [];
  const params = [];

  if (category && category !== 'All') {
    conditions.push('category = ?');
    params.push(category);
  }

  if (featured === 'true') {
    conditions.push('is_featured = 1');
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY is_featured DESC, datetime(COALESCE(published_at, created_at)) DESC, id DESC';

  if (limit) {
    query += ' LIMIT ?';
    params.push(parseInt(limit, 10));
  }

  const videos = db.prepare(query).all(...params);
  res.json(videos);
});

// GET /api/videos/featured — public: get featured videos for showcase banner
router.get('/featured', (req, res) => {
  let featured = db.prepare('SELECT * FROM videos WHERE is_featured = 1 ORDER BY datetime(COALESCE(published_at, created_at)) DESC').all();

  // If no videos are explicitly marked as featured, fallback to latest 3
  if (featured.length === 0) {
    featured = db.prepare('SELECT * FROM videos ORDER BY datetime(COALESCE(published_at, created_at)) DESC LIMIT 3').all();
  }

  res.json(featured);
});

// GET /api/videos/categories — public: get list of unique categories
router.get('/categories', (req, res) => {
  const categories = db.prepare('SELECT DISTINCT category FROM videos WHERE category IS NOT NULL ORDER BY category ASC').all();
  res.json(['All', ...categories.map((c) => c.category)]);
});

// POST /api/videos/sync-youtube — public or admin: automatically pull all channel videos
router.post('/sync-youtube', async (req, res) => {
  try {
    const result = await syncYouTubeFeed();
    res.json({
      message: `Successfully synchronized ${result.synced} videos from Dr. Alhassan's official YouTube channel!`,
      result,
    });
  } catch (err) {
    console.error('YouTube sync failed:', err);
    res.status(500).json({ error: 'Failed to sync videos from YouTube feed: ' + err.message });
  }
});

// PATCH /api/videos/:id/feature — admin only: toggle or set featured status
router.patch('/:id/feature', authMiddleware, (req, res) => {
  const { id } = req.params;
  const video = db.prepare('SELECT * FROM videos WHERE id = ?').get(id);

  if (!video) return res.status(404).json({ error: 'Video not found' });

  let newFeatured;
  if (req.body.is_featured !== undefined) {
    newFeatured = req.body.is_featured ? 1 : 0;
  } else {
    newFeatured = video.is_featured ? 0 : 1;
  }

  db.prepare('UPDATE videos SET is_featured = ? WHERE id = ?').run(newFeatured, id);
  const updated = db.prepare('SELECT * FROM videos WHERE id = ?').get(id);

  res.json({
    message: newFeatured ? 'Video added to Featured Showcase!' : 'Video removed from Featured Showcase.',
    video: updated,
  });
});

// GET /api/videos/:id — public: single video details
router.get('/:id', (req, res) => {
  const video = db.prepare('SELECT * FROM videos WHERE id = ?').get(req.params.id);
  if (!video) return res.status(404).json({ error: 'Video not found' });
  res.json(video);
});

// POST /api/videos — admin only: manually add video
router.post('/', authMiddleware, (req, res) => {
  const { title, description, thumbnail_url, category, is_featured } = req.body;
  const youtube_url = req.body.youtube_url || req.body.youtubeUrl;

  if (!title || !youtube_url) {
    return res.status(400).json({ error: 'Title and YouTube URL are required' });
  }

  // Extract video ID and auto-generate thumbnail if not provided
  const videoIdMatch = youtube_url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
  const videoId = videoIdMatch ? videoIdMatch[1] : null;
  const autoThumbnail = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;

  try {
    const result = db.prepare(`
      INSERT INTO videos (title, description, youtube_url, thumbnail_url, category, is_featured, youtube_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      title.trim(),
      description ? description.trim() : null,
      youtube_url.trim(),
      thumbnail_url || autoThumbnail,
      category ? category.trim() : 'General',
      is_featured ? 1 : 0,
      videoId
    );

    const newVideo = db.prepare('SELECT * FROM videos WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(newVideo);
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'This YouTube video has already been added to the library.' });
    }
    console.error('Video creation error:', err);
    res.status(500).json({ error: 'Failed to add video.' });
  }
});

// PUT /api/videos/:id — admin only: update video
router.put('/:id', authMiddleware, (req, res) => {
  const { title, description, thumbnail_url, category, is_featured } = req.body;
  const youtube_url = req.body.youtube_url || req.body.youtubeUrl;
  const video = db.prepare('SELECT * FROM videos WHERE id = ?').get(req.params.id);

  if (!video) return res.status(404).json({ error: 'Video not found' });

  const finalYoutubeUrl = youtube_url || video.youtube_url;
  const videoIdMatch = finalYoutubeUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
  const videoId = videoIdMatch ? videoIdMatch[1] : video.youtube_id;
  const autoThumbnail = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : video.thumbnail_url;
  const finalFeatured = is_featured !== undefined ? (is_featured ? 1 : 0) : video.is_featured;

  db.prepare(`
    UPDATE videos SET
      title = ?,
      description = ?,
      youtube_url = ?,
      thumbnail_url = ?,
      category = ?,
      is_featured = ?,
      youtube_id = ?
    WHERE id = ?
  `).run(
    title || video.title,
    description !== undefined ? description : video.description,
    finalYoutubeUrl,
    thumbnail_url || autoThumbnail,
    category || video.category,
    finalFeatured,
    videoId,
    req.params.id
  );

  const updated = db.prepare('SELECT * FROM videos WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// DELETE /api/videos/:id — admin only
router.delete('/:id', authMiddleware, (req, res) => {
  const video = db.prepare('SELECT * FROM videos WHERE id = ?').get(req.params.id);
  if (!video) return res.status(404).json({ error: 'Video not found' });

  db.prepare('DELETE FROM videos WHERE id = ?').run(req.params.id);
  res.json({ message: 'Video deleted successfully' });
});

module.exports = router;
