import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase,
  ExternalLink,
  Loader2,
  FolderOpen,
  BookOpen,
  Award,
  Microscope,
  Calendar,
  Sparkles,
  ArrowUpRight,
  Search,
  Filter,
} from 'lucide-react';
import API from '../lib/api';
import defaultPortfolio from '../data/defaultPortfolio.json';

const defaultTypes = Array.from(new Set(defaultPortfolio.map((i) => i.type).filter(Boolean))).sort();

// ─── Type Icon & Colors ────────────────────────────────────────────────────────
const TYPE_CONFIG = {
  publication: {
    label: 'Publication',
    icon: BookOpen,
    badgeBg: 'bg-sky-500/10 dark:bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-300 dark:border-sky-500/30',
    cardBorderHover: 'hover:border-sky-500/50',
    glow: 'from-sky-500/10 to-transparent',
  },
  research: {
    label: 'Research Project',
    icon: Microscope,
    badgeBg: 'bg-purple-500/10 dark:bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-300 dark:border-purple-500/30',
    cardBorderHover: 'hover:border-purple-500/50',
    glow: 'from-purple-500/10 to-transparent',
  },
  award: {
    label: 'Honor & Award',
    icon: Award,
    badgeBg: 'bg-amber-500/10 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-500/30',
    cardBorderHover: 'hover:border-amber-500/50',
    glow: 'from-amber-500/10 to-transparent',
  },
  other: {
    label: 'Academic Activity',
    icon: Briefcase,
    badgeBg: 'bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/30',
    cardBorderHover: 'hover:border-emerald-500/50',
    glow: 'from-emerald-500/10 to-transparent',
  },
};

function getTypeMeta(type = '') {
  const key = (type || '').toLowerCase();
  return TYPE_CONFIG[key] || TYPE_CONFIG.other;
}

// ─── Animation Variants ────────────────────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
  exit: { opacity: 0, scale: 0.94, transition: { duration: 0.2 } },
};

export default function Portfolio() {
  const [types, setTypes] = useState(defaultTypes);
  const [activeType, setActiveType] = useState('All');
  const [items, setItems] = useState(defaultPortfolio);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);

  // Fetch portfolio types
  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const { data } = await API.get('/portfolio/types');
        const list = Array.isArray(data) ? data : data.types ?? [];
        setTypes(list);
      } catch (err) {
        console.error('Failed to fetch portfolio types:', err);
      } finally {
        setLoadingTypes(false);
      }
    };
    fetchTypes();
  }, []);

  // Fetch items
  useEffect(() => {
    const fetchItems = async () => {
      setLoadingItems(true);
      try {
        const params = activeType !== 'All' ? { type: activeType } : {};
        const { data } = await API.get('/portfolio', { params });
        const list = Array.isArray(data) ? data : data.items ?? data.portfolio ?? [];
        setItems(list);
      } catch (err) {
        console.error('Failed to fetch portfolio items:', err);
        setItems([]);
      } finally {
        setLoadingItems(false);
      }
    };
    fetchItems();
  }, [activeType]);

  // Client-side search filter
  const filteredItems = items.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.title?.toLowerCase().includes(q) ||
      item.description?.toLowerCase().includes(q) ||
      item.type?.toLowerCase().includes(q) ||
      String(item.year || '').includes(q)
    );
  });

  const allTypes = ['All', ...types.filter((t) => typeof t === 'string' && t !== 'All')];

  // Quick stats
  const publicationCount = items.filter((i) => i.type?.toLowerCase() === 'publication').length;
  const researchCount = items.filter((i) => i.type?.toLowerCase() === 'research').length;
  const awardCount = items.filter((i) => i.type?.toLowerCase() === 'award').length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white selection:bg-emerald-500 selection:text-white transition-colors duration-300">
      {/* ── Background Gradients ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[750px] h-[450px] bg-emerald-500/10 dark:bg-emerald-500/10 rounded-full blur-[140px]" />
        <div className="absolute top-[40%] right-[-10%] w-[500px] h-[500px] bg-sky-500/5 dark:bg-sky-500/5 rounded-full blur-[150px]" />
      </div>

      {/* ── Hero Section ── */}
      <section className="relative pt-28 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs sm:text-sm font-semibold px-4 py-1.5 rounded-full mb-6 shadow-sm shadow-emerald-500/10"
          >
            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Scholarly & Professional Contributions
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-6 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-700 dark:from-white dark:via-slate-100 dark:to-emerald-400 bg-clip-text text-transparent"
          >
            Portfolio &amp; Research
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.2 }}
            className="text-slate-600 dark:text-slate-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed mb-10"
          >
            A curated record of academic peer-reviewed publications, engineering research initiatives,
            innovations in smart grids, renewable energy, and control engineering.
          </motion.p>

          {/* Quick Counter Chips */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.3 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto"
          >
            {[
              { label: 'Total Works', val: items.length, color: 'text-emerald-600 dark:text-emerald-400' },
              { label: 'Publications', val: publicationCount, color: 'text-sky-600 dark:text-sky-400' },
              { label: 'Research Grants', val: researchCount, color: 'text-purple-600 dark:text-purple-400' },
              { label: 'Recognitions', val: awardCount, color: 'text-amber-600 dark:text-amber-400' },
            ].map((stat, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/60 p-3 shadow-sm backdrop-blur-md"
              >
                <p className={`text-xl font-bold ${stat.color}`}>
                  {loadingItems ? '—' : stat.val}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Filter & Search Toolbar ── */}
      <section className="sticky top-16 z-20 bg-white/85 dark:bg-slate-950/85 backdrop-blur-xl border-y border-slate-200 dark:border-slate-800/80 py-4 px-4 sm:px-6 transition-colors duration-300">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {allTypes.map((t) => {
              const meta = t === 'All' ? null : getTypeMeta(t);
              const Icon = meta ? meta.icon : Filter;
              const isActive = activeType === t;
              return (
                <button
                  key={t}
                  onClick={() => setActiveType(t)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-200 border cursor-pointer ${
                    isActive
                      ? 'bg-emerald-600 dark:bg-emerald-500 border-emerald-600 dark:border-emerald-400 text-white dark:text-slate-950 shadow-md shadow-emerald-500/25 scale-[1.02]'
                      : 'bg-white dark:bg-slate-900/70 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="capitalize">{t}</span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[240px] max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search title, year, topic..."
              className="w-full bg-slate-50 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
            />
          </div>
        </div>
      </section>

      {/* ── Portfolio Grid ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <AnimatePresence mode="wait">
          {loadingItems ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-32 gap-3 text-slate-500"
            >
              <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
              <p className="text-sm font-medium">Loading portfolio items…</p>
            </motion.div>
          ) : filteredItems.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-24 text-center max-w-md mx-auto"
            >
              <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center mb-4 text-slate-400 shadow-inner">
                <FolderOpen className="w-8 h-8" />
              </div>
              <p className="text-lg font-semibold text-slate-800 dark:text-slate-300">No portfolio items found</p>
              <p className="text-sm text-slate-500 mt-1 mb-4">
                {searchQuery
                  ? `No results matching "${searchQuery}".`
                  : activeType !== 'All'
                  ? `No items filed under the "${activeType}" category yet.`
                  : 'Portfolio items have not been published yet.'}
              </p>
              {(searchQuery || activeType !== 'All') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setActiveType('All');
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold hover:bg-emerald-500/20 transition-colors cursor-pointer"
                >
                  Reset filters
                </button>
              )}
            </motion.div>
          ) : (
            <motion.div
              key={`${activeType}-${searchQuery}`}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredItems.map((item) => {
                const id = item.id || item._id || item.title;
                const meta = getTypeMeta(item.type);
                const Icon = meta.icon;

                return (
                  <motion.article
                    key={id}
                    variants={cardVariants}
                    whileHover={{ y: -6, transition: { duration: 0.2 } }}
                    className={`relative flex flex-col justify-between rounded-2xl border border-slate-200 dark:border-slate-800/90 bg-white dark:bg-gradient-to-b dark:from-slate-900/90 dark:to-slate-900/50 p-6 backdrop-blur-md transition-all duration-300 shadow-sm hover:shadow-xl dark:shadow-black/30 group ${meta.cardBorderHover}`}
                  >
                    {/* Top Accent Gradient Line */}
                    <div className="absolute top-0 inset-x-6 h-[1.5px] bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    <div>
                      {/* Badge row */}
                      <div className="flex items-center justify-between gap-2 mb-4">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border capitalize ${meta.badgeBg}`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          {item.type || 'Academic Work'}
                        </span>

                        {item.year && (
                          <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-400 text-xs font-mono font-medium bg-slate-100 dark:bg-slate-800/70 px-2 py-0.5 rounded-md">
                            <Calendar className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                            {item.year}
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="text-slate-900 dark:text-white font-bold text-lg leading-snug mb-3 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {item.title}
                      </h3>

                      {/* Description */}
                      {item.description && (
                        <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed line-clamp-4 font-normal mb-5">
                          {item.description}
                        </p>
                      )}
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between mt-auto">
                      {item.link ? (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 group/link transition-colors"
                        >
                          <span>Explore Document / Link</span>
                          <ArrowUpRight className="w-4 h-4 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                          Academic Archive
                        </span>
                      )}

                      <span className="text-[11px] text-slate-400 dark:text-slate-600 font-mono uppercase tracking-wider">
                        UMaT Research
                      </span>
                    </div>
                  </motion.article>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
}
