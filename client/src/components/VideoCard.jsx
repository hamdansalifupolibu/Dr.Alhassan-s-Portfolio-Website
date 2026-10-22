import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, ExternalLink, X, Sparkles } from 'lucide-react';

/**
 * Extracts the YouTube video ID from a variety of YouTube URL formats.
 */
function getYouTubeId(url) {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export default function VideoCard(props) {
  const [modalOpen, setModalOpen] = useState(false);

  // Support both <VideoCard video={v} /> and <VideoCard title={v.title} ... />
  const video = props.video || props;

  const videoId = getYouTubeId(video?.youtube_url || video?.url || video?.youtubeUrl || '');
  const thumbnail = video?.thumbnail_url || (videoId
    ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
    : 'https://placehold.co/480x270/0f172a/10b981?text=Video');

  return (
    <>
      {/* Card */}
      <motion.div
        layout
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden flex flex-col group hover:border-emerald-500/50 hover:shadow-xl shadow-sm dark:shadow-none transition-all duration-300"
      >
        {/* Thumbnail */}
        <div className="relative overflow-hidden cursor-pointer" onClick={() => setModalOpen(true)}>
          <img
            src={thumbnail}
            alt={video.title}
            className="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              e.target.src = 'https://placehold.co/480x270/0f172a/10b981?text=Video';
            }}
          />
          {/* Play overlay */}
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/40">
              <Play className="w-6 h-6 text-white fill-white ml-0.5" />
            </div>
          </div>
          {/* Category badge */}
          {video.category && (
            <span className="absolute top-3 left-3 bg-white/95 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/80 text-emerald-700 dark:text-emerald-400 text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm shadow-sm">
              {video.category}
            </span>
          )}

          {/* Featured badge */}
          {(video.is_featured === 1 || video.is_featured === true) && (
            <span className="absolute top-3 right-3 bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full shadow-lg shadow-amber-500/20 flex items-center gap-1 backdrop-blur-sm">
              <Sparkles size={11} className="fill-slate-950" />
              Featured
            </span>
          )}
        </div>

        {/* Body */}
        <div className="p-5 flex flex-col flex-1 gap-3">
          <h3 className="text-slate-900 dark:text-white font-semibold text-base leading-snug line-clamp-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
            {video.title}
          </h3>
          {video.description && (
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed line-clamp-2 flex-1">
              {video.description}
            </p>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 mt-auto pt-1">
            <button
              onClick={() => setModalOpen(true)}
              className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-700 dark:hover:bg-emerald-400 text-white dark:text-slate-950 text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors duration-200 cursor-pointer shadow-sm"
            >
              <Play className="w-4 h-4 fill-current" />
              Watch Here
            </button>
            {video.youtube_url || video.url ? (
              <a
                href={video.youtube_url || video.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white text-sm font-medium px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 transition-all duration-200"
              >
                <ExternalLink className="w-4 h-4" />
                YouTube
              </a>
            ) : null}
          </div>
        </div>
      </motion.div>

      {/* Embedded Modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setModalOpen(false)}
            />
            {/* Modal panel */}
            <motion.div
              className="relative z-10 w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-2xl"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
                <h4 className="text-slate-900 dark:text-white font-semibold truncate pr-4">{video.title}</h4>
                <button
                  onClick={() => setModalOpen(false)}
                  className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {/* Iframe */}
              <div className="aspect-video w-full">
                {videoId ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
                    title={video.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    Video unavailable
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
