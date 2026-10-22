import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Video,
  Loader2,
  PlaySquare,
  ExternalLink,
  Sparkles,
  Search,
  X,
  Play,
  CheckCircle2,
  SlidersHorizontal,
  ArrowUpDown,
  BookOpen,
} from 'lucide-react';
import API from '../lib/api';
import VideoCard from '../components/VideoCard';
import { useSettings } from '../context/SettingsContext';

// ─── Animation variants ────────────────────────────────────────────────────────
const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

// Popular search quick tags for engineering students
const POPULAR_SEARCH_TAGS = [
  'Final Exams',
  'Applied Electricity',
  'Quiz Solution',
  'Op-Amps',
  'Theorems',
  'Electrostatics',
  'Semiconductors',
  'Transistors',
  'Capacitors',
];

// Helper to normalize strings for robust search matching
function normalizeText(str = '') {
  return str
    .toLowerCase()
    .replace(/[-_.,/()'"–—]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Compute relevance score for smart ordering
function computeRelevance(video, queryTokens, rawQuery) {
  const normTitle = normalizeText(video.title || '');
  const normDesc = normalizeText(video.description || '');
  const normCat = normalizeText(video.category || '');
  const normRaw = normalizeText(rawQuery);

  let score = 0;

  // Exact phrase match in title gets highest priority
  if (normTitle.includes(normRaw)) score += 100;
  if (normCat.includes(normRaw)) score += 50;

  // Token matching
  for (const token of queryTokens) {
    if (normTitle.includes(token)) score += 20;
    if (normCat.includes(token)) score += 10;
    if (normDesc.includes(token)) score += 5;
  }

  // Bonus for featured content
  if (video.is_featured === 1 || video.is_featured === true) {
    score += 8;
  }

  return score;
}

export default function Videos() {
  const { settings } = useSettings();
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('default'); // 'default' | 'title' | 'latest'
  const [visibleCount, setVisibleCount] = useState(24);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  const searchInputRef = useRef(null);

  const youtubeUrl = settings.youtubeChannel || 'https://www.youtube.com/@AlhassanWielaPh.D';

  // Fetch all videos and categories on mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [videosRes, catsRes] = await Promise.allSettled([
          API.get('/videos'),
          API.get('/videos/categories'),
        ]);

        if (videosRes.status === 'fulfilled') {
          const list = Array.isArray(videosRes.value.data)
            ? videosRes.value.data
            : videosRes.value.data?.videos ?? [];
          setVideos(list);
        }

        if (catsRes.status === 'fulfilled') {
          const cats = Array.isArray(catsRes.value.data) ? catsRes.value.data : [];
          setCategories(cats);
        }
      } catch (err) {
        console.error('Failed to load video library:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Reset pagination limit whenever category or search query changes
  useEffect(() => {
    setVisibleCount(24);
  }, [activeCategory, searchQuery, sortBy]);

  // Featured spotlight videos
  const featuredVideos = useMemo(() => {
    return videos.filter((v) => v.is_featured === 1 || v.is_featured === true);
  }, [videos]);

  // Robust, multi-token, high-accuracy search & filtering
  const filteredVideos = useMemo(() => {
    const trimmedQuery = searchQuery.trim();
    const queryTokens = trimmedQuery
      ? normalizeText(trimmedQuery).split(' ').filter(Boolean)
      : [];

    let list = videos.filter((v) => {
      // 1. Category check
      if (activeCategory !== 'All' && v.category !== activeCategory) {
        return false;
      }

      // 2. Multi-token search match
      if (queryTokens.length === 0) return true;

      const normTitle = normalizeText(v.title || '');
      const normDesc = normalizeText(v.description || '');
      const normCat = normalizeText(v.category || '');
      const fullText = `${normTitle} ${normDesc} ${normCat}`;

      // All tokens must be present somewhere in the title, description, or category
      return queryTokens.every((token) => fullText.includes(token));
    });

    // Sort list
    if (trimmedQuery) {
      // When searching, sort by relevance score
      list = [...list].sort(
        (a, b) =>
          computeRelevance(b, queryTokens, trimmedQuery) -
          computeRelevance(a, queryTokens, trimmedQuery)
      );
    } else if (sortBy === 'title') {
      list = [...list].sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    } else if (sortBy === 'latest') {
      list = [...list].sort(
        (a, b) =>
          new Date(b.published_at || b.created_at || 0) -
          new Date(a.published_at || a.created_at || 0)
      );
    }

    return list;
  }, [videos, activeCategory, searchQuery, sortBy]);

  const pagedVideos = useMemo(() => {
    return filteredVideos.slice(0, visibleCount);
  }, [filteredVideos, visibleCount]);

  const handleSelectTag = (tag) => {
    setSearchQuery(tag);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white selection:bg-emerald-500 selection:text-white transition-colors duration-300">
      {/* ── Page Hero ── */}
      <section className="relative pt-28 pb-14 px-4 overflow-hidden border-b border-slate-200 dark:border-slate-800/80">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[360px] bg-emerald-500/10 dark:bg-emerald-500/10 rounded-full blur-[140px]" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: -14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs sm:text-sm font-semibold px-4 py-1.5 rounded-full mb-6"
          >
            <Video className="w-4 h-4" />
            <span>Official Video Lectures &amp; Solved Past Questions</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-4 tracking-tight text-slate-900 dark:text-white"
          >
            Educational Video Hub
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.2 }}
            className="text-slate-600 dark:text-slate-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed mb-6"
          >
            Watch all {videos.length > 0 ? videos.length : '80+'}+ comprehensive lecture sessions,
            quizzes, and exam walkthroughs in Applied Electricity, Electromagnetic Field Theory,
            Electrostatics, Electronics, and Control Systems.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.25 }}
            className="flex flex-wrap items-center justify-center gap-3"
          >
            <a
              href={youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 dark:border-red-500/40 bg-red-50 dark:bg-red-500/10 px-5 py-2.5 text-xs sm:text-sm font-semibold text-red-600 dark:text-red-400 transition-all hover:bg-red-100 dark:hover:bg-red-500/20 hover:border-red-500/60 shadow-sm"
            >
              <Video className="w-4 h-4 text-red-500" />
              <span>Watch on YouTube Channel: Alhassan Wiela, Ph. D</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-70" />
            </a>

            <span className="rounded-xl border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 px-4 py-2.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 font-mono">
              {videos.length} Lectures Available
            </span>
          </motion.div>
        </div>
      </section>

      {/* ── Featured Videos Spotlight ── */}
      {featuredVideos.length > 0 && !searchQuery && activeCategory === 'All' && (
        <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-700 dark:text-amber-400 mb-1.5">
                <Sparkles size={13} className="fill-amber-500 dark:fill-amber-400" />
                Featured Spotlight
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                Handpicked Must-Watch Lectures &amp; Exam Solutions
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                Top lectures highlighted by Dr. Alhassan for exam preparation.
              </p>
            </div>
            <span className="text-xs font-mono text-amber-600 dark:text-amber-400/90 self-start sm:self-auto font-medium">
              {featuredVideos.length} featured items
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredVideos.map((video) => (
              <div
                key={video.id || video.youtube_id}
                className="rounded-2xl p-1 bg-gradient-to-b from-amber-500/30 via-emerald-500/20 to-slate-200 dark:to-slate-900 shadow-md transition-transform duration-300 hover:scale-[1.01]"
              >
                <VideoCard video={video} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── All Videos Library & Search / Filter Controls ── */}
      <section className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-200 dark:border-slate-800/80">
        <div className="mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <PlaySquare size={20} className="text-emerald-600 dark:text-emerald-400" />
              Complete Lecture Archive
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
              Filter by engineering subject or use the smart search bar to find any topic or exam problem.
            </p>
          </div>

          {/* Search Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search lectures, topics, questions…"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/90 pl-10 pr-9 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition shadow-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  title="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-xs text-slate-700 dark:text-slate-300 outline-none transition focus:border-emerald-500 cursor-pointer shadow-sm"
            >
              <option value="default">Sort: Default Order</option>
              <option value="title">Sort: Title (A-Z)</option>
              <option value="latest">Sort: Most Recent</option>
            </select>
          </div>
        </div>

        {/* Popular Quick Search Tags */}
        <div className="mb-5 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
            <Sparkles size={12} className="text-emerald-600 dark:text-emerald-400" /> Popular:
          </span>
          {POPULAR_SEARCH_TAGS.map((tag) => {
            const isSelected = searchQuery.toLowerCase() === tag.toLowerCase();
            return (
              <button
                key={tag}
                onClick={() => handleSelectTag(isSelected ? '' : tag)}
                className={`rounded-lg px-2.5 py-1 text-xs transition border cursor-pointer ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-semibold'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 hover:text-slate-900 dark:hover:text-slate-200 shadow-sm'
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none mb-6">
          {categories.map((cat) => {
            const count =
              cat === 'All'
                ? videos.length
                : videos.filter((v) => v.category === cat).length;
            const isActive = activeCategory === cat;

            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex-shrink-0 text-xs sm:text-sm font-semibold px-4 py-2 rounded-xl border transition-all duration-200 flex items-center gap-2 cursor-pointer ${
                  isActive
                    ? 'bg-emerald-600 dark:bg-emerald-500 border-emerald-600 dark:border-emerald-500 text-white dark:text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 hover:text-slate-900 dark:hover:text-white shadow-sm'
                }`}
              >
                <span>{cat}</span>
                <span
                  className={`text-[11px] rounded-full px-1.5 py-0.2 ${
                    isActive
                      ? 'bg-white/25 dark:bg-slate-950/20 text-white dark:text-slate-950'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Results Counter Banner if searching or filtering */}
        {(searchQuery || activeCategory !== 'All') && (
          <div className="mb-6 flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/70 px-4 py-2.5 text-xs text-slate-600 dark:text-slate-300 shadow-sm">
            <div>
              Showing <span className="font-semibold text-emerald-600 dark:text-emerald-400">{filteredVideos.length}</span> lectures
              {searchQuery && (
                <span>
                  {' '}
                  matching <span className="text-slate-900 dark:text-white font-medium">&quot;{searchQuery}&quot;</span>
                </span>
              )}
              {activeCategory !== 'All' && (
                <span>
                  {' '}
                  in <span className="text-slate-900 dark:text-white font-medium">{activeCategory}</span>
                </span>
              )}
            </div>
            <button
              onClick={() => {
                setSearchQuery('');
                setActiveCategory('All');
              }}
              className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-medium cursor-pointer"
            >
              <X size={12} /> Clear all filters
            </button>
          </div>
        )}

        {/* Video Grid */}
        <AnimatePresence mode="wait">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-28 gap-4 text-slate-500">
              <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
              <p className="text-sm font-medium">Loading lecture library…</p>
            </div>
          ) : filteredVideos.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-24 text-center rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white/60 dark:bg-slate-900/40 p-8 shadow-sm"
            >
              <PlaySquare className="w-14 h-14 text-slate-300 dark:text-slate-700 mb-3" />
              <p className="text-base font-bold text-slate-800 dark:text-slate-300">No matching videos found</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                {searchQuery
                  ? `No lectures match "${searchQuery}". Try searching for exam, question number, or topic keywords.`
                  : `No lectures available in category "${activeCategory}".`}
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('All');
                }}
                className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 transition cursor-pointer"
              >
                Reset Search &amp; Show All {videos.length} Lectures
              </button>
            </motion.div>
          ) : (
            <div>
              <motion.div
                key={activeCategory + searchQuery + sortBy}
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {pagedVideos.map((video) => (
                  <motion.div
                    key={video.id || video.youtube_id || video.title}
                    variants={cardVariants}
                  >
                    <VideoCard video={video} />
                  </motion.div>
                ))}
              </motion.div>

              {/* Load More Button if there are more videos */}
              {visibleCount < filteredVideos.length && (
                <div className="mt-12 text-center">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                    Showing {pagedVideos.length} of {filteredVideos.length} lectures
                  </p>
                  <button
                    onClick={() => setVisibleCount((prev) => prev + 24)}
                    className="inline-flex items-center gap-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-6 py-3 text-sm font-semibold text-slate-800 dark:text-slate-200 shadow-md hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition cursor-pointer"
                  >
                    <PlaySquare size={16} />
                    Load More Lectures ({filteredVideos.length - visibleCount} remaining)
                  </button>
                </div>
              )}
            </div>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
}
