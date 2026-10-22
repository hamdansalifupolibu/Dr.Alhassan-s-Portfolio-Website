/**
 * Home.jsx
 * Landing page for Dr. Alhassan Osman.
 * Executive academic design with dual light/dark aesthetics, interactive portrait display, and resource CTA.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Play,
  BookOpen,
  Users,
  Video,
  FileText,
  ArrowRight,
  ChevronRight,
  VideoOff,
  ExternalLink,
  CalendarCheck,
  GraduationCap,
  ShieldCheck,
  Sparkles,
  Award,
  CheckCircle2,
} from 'lucide-react';
import API from '../lib/api';
import VideoCard from '../components/VideoCard';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { useSettings } from '../context/SettingsContext';

// ─── Animation helpers ────────────────────────────────────────────────────────
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 32 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: 'easeOut' },
});

const fadeIn = (delay = 0) => ({
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.7, delay },
});

// ─── Decorative dot-grid background pattern ───────────────────────────────────
function DotGrid() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 opacity-[0.06] dark:opacity-[0.07]"
      style={{
        backgroundImage:
          'radial-gradient(circle, #10b981 1px, transparent 1px)',
        backgroundSize: '28px 28px',
      }}
    />
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function Home() {
  const { settings } = useSettings();
  const [videos, setVideos] = useState([]);
  const [publicationCount, setPublicationCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        setLoading(true);
        const [videosRes, portfolioRes] = await Promise.allSettled([
          API.get('/videos', {
            params: { limit: 3 },
            signal: controller.signal,
          }),
          API.get('/portfolio', {
            signal: controller.signal,
          }),
        ]);

        if (videosRes.status === 'fulfilled') {
          const list = Array.isArray(videosRes.value.data)
            ? videosRes.value.data
            : videosRes.value.data?.data ?? videosRes.value.data?.videos ?? [];
          setVideos(list.slice(0, 3));
        }

        if (portfolioRes.status === 'fulfilled') {
          const pList = Array.isArray(portfolioRes.value.data)
            ? portfolioRes.value.data
            : portfolioRes.value.data?.data ?? [];
          const count = pList.filter(
            (item) => (item.type || '').toLowerCase() === 'publication'
          ).length;
          setPublicationCount(count);
        }
      } catch (err) {
        if (err.name !== 'CanceledError') setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
    return () => controller.abort();
  }, []);

  const youtubeChannel = settings.youtubeChannel || 'https://www.youtube.com/@AlhassanWielaPh.D';

  const stats = [
    { icon: Video, value: '100+', label: 'Educational Lectures', sub: 'YouTube & Classroom' },
    { icon: Users, value: '1k+', label: 'Students Reached', sub: 'UMaT & Worldwide' },
    ...(publicationCount > 0
      ? [
          {
            icon: BookOpen,
            value: publicationCount >= 10 ? `${publicationCount}+` : `${publicationCount}`,
            label: publicationCount === 1 ? 'Peer Publication' : 'Peer Publications',
            sub: 'IEEE & Elsevier Journals',
          },
        ]
      : []),
  ];

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">

      {/* ══════════════════════════════════════════════════════
          HERO SECTION
      ══════════════════════════════════════════════════════ */}
      <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-16">
        {/* Background gradient */}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-br from-slate-100 via-slate-50 to-emerald-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950/30"
        />
        <DotGrid />

        {/* Ambient Glowing Orbs */}
        <motion.div
          aria-hidden
          {...fadeIn(0)}
          className="absolute left-1/2 top-1/4 h-[550px] w-[550px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/15 blur-[150px] pointer-events-none"
        />
        <motion.div
          aria-hidden
          {...fadeIn(0.2)}
          className="absolute right-10 bottom-10 h-[400px] w-[400px] rounded-full bg-sky-500/10 blur-[130px] pointer-events-none"
        />

        {/* Content Container */}
        <div className="relative z-10 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Text Column (7 cols) */}
          <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left gap-6">
            <motion.div {...fadeUp(0.1)} className="flex flex-wrap items-center justify-center lg:justify-start gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs sm:text-sm font-semibold text-emerald-700 dark:text-emerald-400 shadow-sm">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                {settings.institution || 'University of Mines and Technology (UMaT), Tarkwa'}
              </span>
            </motion.div>

            <motion.h1
              {...fadeUp(0.2)}
              className="bg-gradient-to-br from-slate-950 via-slate-850 to-slate-700 dark:from-white dark:via-slate-100 dark:to-slate-400 bg-clip-text text-4xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.08] tracking-tight text-transparent"
            >
              {settings.fullName || 'Dr. Alhassan Osman'}
            </motion.h1>

            <motion.p
              {...fadeUp(0.3)}
              className="text-lg sm:text-2xl font-bold tracking-wide text-emerald-600 dark:text-emerald-400"
            >
              {settings.tagline || 'Lecturer · Control Systems · Smart Grids · Machine Learning'}
            </motion.p>

            <motion.p
              {...fadeUp(0.4)}
              className="max-w-2xl text-sm sm:text-base leading-relaxed text-slate-600 dark:text-slate-300"
            >
              {settings.bio || 'Dedicated to advancing modern engineering education, robust control algorithms, renewable energy systems, and empowering students with freely accessible lecture materials and solved examination papers.'}
            </motion.p>

            {/* Quick credentials badges */}
            <motion.div {...fadeUp(0.45)} className="flex flex-wrap items-center justify-center lg:justify-start gap-2 pt-1 text-xs">
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 px-3.5 py-1.5 text-slate-700 dark:text-slate-300 shadow-sm">
                <GraduationCap size={15} className="text-emerald-500" />
                Ph.D. Control Engineering (Gaziantep)
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 px-3.5 py-1.5 text-slate-700 dark:text-slate-300 shadow-sm">
                <ShieldCheck size={15} className="text-sky-500" />
                Lecturer @ UMaT (2023–Present)
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 px-3.5 py-1.5 text-slate-700 dark:text-slate-300 shadow-sm">
                <Award size={15} className="text-amber-500" />
                Electrical &amp; Electronic Eng.
              </span>
            </motion.div>

            {/* CTA buttons */}
            <motion.div
              {...fadeUp(0.5)}
              className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2"
            >
              <Link
                to="/videos"
                className="group flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3.5 text-sm sm:text-base font-bold text-slate-950 shadow-lg shadow-emerald-500/30 transition-all hover:bg-emerald-400 hover:shadow-emerald-400/40 cursor-pointer"
              >
                <Play className="h-4 w-4 fill-current" />
                Watch Lectures
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                to="/past-questions"
                className="flex items-center gap-2 rounded-xl border border-emerald-500/50 bg-emerald-500/10 px-5 py-3.5 text-sm sm:text-base font-bold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 transition-all shadow-sm cursor-pointer"
              >
                <FileText className="h-4 w-4" />
                Past Questions
              </Link>
              <a
                href={youtubeChannel}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-3.5 text-sm sm:text-base font-semibold text-red-600 dark:text-red-400 transition-all hover:bg-red-500/20 hover:border-red-500/50"
              >
                <Video className="h-5 w-5 text-red-500" />
                YouTube Channel
                <ExternalLink className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
              <Link
                to="/contact?tab=book"
                className="flex items-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/80 px-5 py-3.5 text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-200 backdrop-blur-sm transition-all hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 shadow-sm cursor-pointer"
              >
                <CalendarCheck className="h-4 w-4 text-emerald-500" />
                Book Office Hours
              </Link>
            </motion.div>
          </div>

          {/* Right Portrait Column (5 cols) */}
          <div className="lg:col-span-5 flex justify-center relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0.2 }}
              className="relative w-full max-w-sm sm:max-w-md"
            >
              {/* Back Glow Effect */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-emerald-500/30 via-emerald-400/20 to-sky-500/20 blur-3xl transform scale-95 pointer-events-none" />

              {/* Decorative Geometric Frame */}
              <div className="relative mx-auto rounded-3xl p-2 bg-gradient-to-b from-emerald-500/40 via-slate-200 dark:via-slate-800/60 to-slate-100 dark:to-slate-900/80 border border-slate-300 dark:border-slate-700/60 shadow-2xl backdrop-blur-sm overflow-hidden">
                <div className="relative rounded-2xl bg-gradient-to-b from-slate-100/90 dark:from-slate-900/90 to-white dark:to-slate-950 overflow-hidden pt-4 px-4 flex items-end justify-center">
                  <img
                    src="/images/dr-alhassan-cutout.png"
                    alt={settings.fullName || 'Dr. Alhassan Osman'}
                    className="relative z-10 w-full max-h-[460px] sm:max-h-[520px] object-contain drop-shadow-[0_20px_35px_rgba(0,0,0,0.4)] dark:drop-shadow-[0_20px_35px_rgba(0,0,0,0.85)] transition-transform duration-700 hover:scale-[1.02]"
                  />
                  {/* Subtle bottom gradient overlay for smooth grounding */}
                  <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white dark:from-slate-950 via-white/60 dark:via-slate-950/60 to-transparent z-20 pointer-events-none" />
                </div>
              </div>

              {/* Floating Badge 1: Ph.D. Control Engineering */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="absolute -top-3 -left-2 sm:-left-4 z-30 rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-white/95 dark:bg-slate-900/95 p-3 shadow-xl backdrop-blur-md flex items-center gap-2.5"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  <GraduationCap size={18} />
                </div>
                <div className="leading-tight text-left">
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Ph.D. Control Engineering</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Gaziantep University</p>
                </div>
              </motion.div>

              {/* Floating Badge 2: UMaT Faculty */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.75 }}
                className="absolute -bottom-4 -right-2 sm:-right-4 z-30 rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-white/95 dark:bg-slate-900/95 p-3 shadow-xl backdrop-blur-md flex items-center gap-2.5"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/30">
                  <ShieldCheck size={18} />
                </div>
                <div className="leading-tight text-left">
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Electrical &amp; Electronic Eng.</p>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">UMaT Faculty · 2023–Present</p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          STATS SECTION
      ══════════════════════════════════════════════════════ */}
      <section className="relative bg-white/60 dark:bg-slate-900/50 px-6 py-20 border-y border-slate-200 dark:border-slate-800">
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.15 } },
            }}
            className={`grid gap-6 ${stats.length === 2 ? 'sm:grid-cols-2 max-w-3xl mx-auto' : 'sm:grid-cols-3'}`}
          >
            {stats.map(({ icon: Icon, value, label, sub }) => (
              <motion.div
                key={label}
                variants={{
                  hidden: { opacity: 0, y: 24 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
                }}
                className="group relative overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center shadow-lg dark:shadow-xl transition-all hover:border-emerald-500/40 hover:shadow-emerald-500/10"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="relative z-10 flex flex-col items-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 group-hover:scale-110 transition-transform">
                    <Icon className="h-7 w-7 text-emerald-600 dark:text-emerald-400" strokeWidth={1.75} />
                  </div>
                  <p className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">{value}</p>
                  <p className="text-sm font-bold tracking-wide text-slate-800 dark:text-slate-200">{label}</p>
                  {sub && <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{sub}</p>}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          FEATURED VIDEOS SECTION
      ══════════════════════════════════════════════════════ */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          {/* Section header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
            className="mb-14 flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between"
          >
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                Learn · Explore
              </p>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">Featured Lectures</h2>
              <p className="mt-2 max-w-xl text-slate-600 dark:text-slate-400 text-sm">
                Curated walkthroughs of engineering problems, exam walkthroughs, and theoretical foundations.
              </p>
            </div>
            <Link
              to="/videos"
              className="group flex shrink-0 items-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-5 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 transition-all hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 shadow-sm cursor-pointer"
            >
              <span>Explore All Lectures</span>
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>

          {/* Video grid */}
          {loading ? (
            <LoadingSpinner />
          ) : error ? (
            <EmptyState
              icon={VideoOff}
              title="Could not load videos"
              description={`An error occurred: ${error}. Please try again later.`}
            />
          ) : videos.length === 0 ? (
            <EmptyState
              icon={VideoOff}
              title="No videos yet"
              description="Check back soon for educational video content."
            />
          ) : (
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.12 } },
              }}
              className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3"
            >
              {videos.map((v) => (
                <motion.div
                  key={v._id ?? v.id ?? v.youtube_url}
                  variants={{
                    hidden: { opacity: 0, y: 24 },
                    visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
                  }}
                >
                  <VideoCard
                    title={v.title}
                    description={v.description}
                    youtube_url={v.youtube_url}
                    thumbnail_url={v.thumbnail_url}
                    category={v.category}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          PAST QUESTIONS CTA SECTION
      ══════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden px-6 py-24 border-t border-slate-200 dark:border-slate-800">
        {/* Background */}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-br from-emerald-100/60 via-slate-50 to-slate-100 dark:from-emerald-950/40 dark:via-slate-900 dark:to-slate-950"
        />
        <DotGrid />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative z-10 mx-auto flex max-w-3xl flex-col items-center gap-6 text-center"
        >
          {/* Icon */}
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-500/10 border border-emerald-500/20 shadow-xl shadow-emerald-500/10">
            <FileText className="h-10 w-10 text-emerald-600 dark:text-emerald-400" strokeWidth={1.5} />
          </div>

          <div className="flex flex-col gap-3">
            <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Access Past Examination Questions
            </h2>
            <p className="text-sm sm:text-base leading-relaxed text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
              Prepare smarter with official semester examination question papers, marking schemes, and worked engineering solutions.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-slate-600 dark:text-slate-400">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 font-semibold text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 size={13} /> Free for UMaT Students
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 px-3 py-1 font-semibold text-sky-700 dark:text-sky-400">
              <ShieldCheck size={13} /> Paystack Instant Checkout for Non-UMaT
            </span>
          </div>

          <Link
            to="/past-questions"
            className="group flex items-center gap-2 rounded-2xl bg-emerald-500 hover:bg-emerald-400 px-8 py-4 text-sm sm:text-base font-bold text-slate-950 shadow-xl shadow-emerald-500/25 transition-all cursor-pointer"
          >
            <span>Browse Past Questions</span>
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>
      </section>
    </main>
  );
}
