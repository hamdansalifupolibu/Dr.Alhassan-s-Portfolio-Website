import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  PlusCircle, Trash2, Pencil, X, Check,
  Loader2, AlertCircle, ExternalLink, RefreshCw,
  Star, Search, Video, PlaySquare, Sparkles, Filter,
} from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import API from '../../lib/api';
import { useToast } from '../../context/ToastContext';

/* ── shared input style ─────────────────────────────────────────────── */
const inputCls =
  'w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 shadow-sm';

/* ── empty form state ─────────────────────────────────────────────── */
const EMPTY_FORM = {
  title: '',
  youtubeUrl: '',
  description: '',
  category: '',
  is_featured: false,
};

export default function ManageVideos() {
  const toast = useToast();
  const [videos, setVideos]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [success, setSuccess]         = useState('');

  /* filtering & search */
  const [activeTab, setActiveTab]     = useState('all'); // 'all' | 'featured' | 'standard'
  const [searchQuery, setSearchQuery] = useState('');

  /* sync state */
  const [syncing, setSyncing]         = useState(false);

  /* add form */
  const [form, setForm]               = useState(EMPTY_FORM);
  const [submitting, setSubmitting]   = useState(false);
  const [formError, setFormError]     = useState('');

  /* inline edit */
  const [editId, setEditId]           = useState(null);
  const [editData, setEditData]       = useState({});
  const [saving, setSaving]           = useState(false);

  /* delete & feature toggling */
  const [deleteId, setDeleteId]       = useState(null);
  const [togglingId, setTogglingId]   = useState(null);

  /* ── fetch ──────────────────────────────────────────────────────── */
  const fetchVideos = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await API.get('/videos');
      const list = Array.isArray(data) ? data : (data?.data ?? []);
      setVideos(list);
    } catch {
      setError('Failed to load videos.');
      toast.error('Failed to load videos from server.');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  /* ── sync from YouTube ──────────────────────────────────────────── */
  const handleSyncYouTube = async () => {
    setSyncing(true);
    setError('');
    setSuccess('');
    try {
      const res = await API.post('/videos/sync-youtube');
      const msg = res.data?.message || 'YouTube channel synchronized successfully!';
      setSuccess(msg);
      toast.success(msg);
      setTimeout(() => setSuccess(''), 6000);
      await fetchVideos();
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to sync from YouTube channel.';
      setError(msg);
      toast.error(msg);
    } finally {
      setSyncing(false);
    }
  };

  /* ── toggle featured status ─────────────────────────────────────── */
  const handleToggleFeatured = async (v) => {
    const vid = v.id || v._id;
    setTogglingId(vid);
    try {
      const res = await API.patch(`/videos/${vid}/feature`);
      const updated = res.data?.video;
      setVideos((prev) =>
        prev.map((item) => ((item.id || item._id) === vid ? { ...item, ...updated } : item))
      );
      const msg = res.data?.message || 'Featured status updated.';
      setSuccess(msg);
      toast.success(msg);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to toggle featured status.';
      setError(msg);
      toast.error(msg);
    } finally {
      setTogglingId(null);
    }
  };

  /* ── add video ──────────────────────────────────────────────────── */
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.youtubeUrl.trim()) {
      setFormError('Title and YouTube URL are required.');
      toast.error('Title and YouTube URL are required.');
      return;
    }
    setSubmitting(true);
    setFormError('');
    try {
      await API.post('/videos', {
        title: form.title,
        youtube_url: form.youtubeUrl,
        description: form.description,
        category: form.category || 'General',
        is_featured: form.is_featured ? 1 : 0,
      });
      setForm(EMPTY_FORM);
      setSuccess('Video added successfully.');
      toast.success('Lecture video added successfully!');
      setTimeout(() => setSuccess(''), 3500);
      fetchVideos();
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message || 'Failed to add video.';
      setFormError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  /* ── inline edit ────────────────────────────────────────────────── */
  const startEdit = (v) => {
    const vid = v.id || v._id;
    setEditId(vid);
    setEditData({
      title: v.title,
      youtubeUrl: v.youtube_url || v.youtubeUrl || '',
      description: v.description ?? '',
      category: v.category ?? '',
      is_featured: !!v.is_featured,
    });
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditData({});
  };

  const saveEdit = async (id) => {
    if (!editData.title?.trim()) {
      toast.error('Title cannot be empty.');
      return;
    }
    setSaving(true);
    try {
      await API.put(`/videos/${id}`, {
        title: editData.title,
        youtube_url: editData.youtubeUrl,
        description: editData.description,
        category: editData.category,
        is_featured: editData.is_featured ? 1 : 0,
      });
      cancelEdit();
      fetchVideos();
      setSuccess('Changes saved successfully.');
      toast.success('Video updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message || 'Failed to save changes.';
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  /* ── delete ─────────────────────────────────────────────────────── */
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this video permanently?')) return;
    setDeleteId(id);
    try {
      await API.delete(`/videos/${id}`);
      toast.success('Video removed successfully.');
      fetchVideos();
    } catch {
      setError('Failed to delete video.');
      toast.error('Failed to delete video.');
    } finally {
      setDeleteId(null);
    }
  };

  /* ── filtered list ──────────────────────────────────────────────── */
  const featuredCount = useMemo(
    () => videos.filter((v) => Number(v.is_featured) === 1).length,
    [videos]
  );

  const filteredVideos = useMemo(() => {
    const trimmed = searchQuery.trim().toLowerCase();
    const tokens = trimmed ? trimmed.split(/\s+/).filter(Boolean) : [];

    return videos.filter((v) => {
      // Tab filter
      if (activeTab === 'featured' && Number(v.is_featured) !== 1) return false;
      if (activeTab === 'standard' && Number(v.is_featured) === 1) return false;

      // Multi-token search query
      if (tokens.length > 0) {
        const full = `${v.title || ''} ${v.category || ''} ${v.description || ''}`.toLowerCase();
        const matchesAll = tokens.every((t) => full.includes(t));
        if (!matchesAll) return false;
      }

      return true;
    });
  }, [videos, activeTab, searchQuery]);

  return (
    <AdminLayout>
      {/* ── Page Header & YouTube Sync ────────────────────────────── */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            Manage Video Lectures
            <span className="rounded-full bg-slate-200 dark:bg-slate-800 px-2.5 py-0.5 text-xs text-slate-700 dark:text-slate-400 font-mono">
              {videos.length} Total
            </span>
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Automatically sync Dr. Alhassan&apos;s YouTube channel lectures, add custom links, and star featured content for the top showcase.
          </p>
        </div>

        {/* Sync YouTube Button */}
        <button
          onClick={handleSyncYouTube}
          disabled={syncing}
          className="flex items-center justify-center gap-2 rounded-xl border border-red-500/40 bg-gradient-to-r from-red-600/10 to-red-500/10 dark:from-red-600/20 dark:to-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-700 dark:text-red-200 shadow-md shadow-red-500/10 hover:border-red-500 hover:bg-red-500/20 disabled:opacity-60 transition cursor-pointer"
        >
          {syncing ? (
            <Loader2 size={16} className="animate-spin text-red-500" />
          ) : (
            <RefreshCw size={16} className="text-red-500" />
          )}
          <span>{syncing ? 'Syncing Channel…' : 'Sync YouTube Channel'}</span>
        </button>
      </div>

      {/* Global Alerts */}
      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          <AlertCircle size={16} /> {error}
        </div>
      )}
      {success && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-300">
          <Check size={16} /> {success}
        </div>
      )}

      {/* ── Add Video Form ────────────────────────────────────────── */}
      <section className="mb-10 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-6 shadow-sm dark:shadow-xl backdrop-blur-sm">
        <h2 className="mb-5 flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-slate-100">
          <PlusCircle size={18} className="text-emerald-500" />
          Add New Lecture Video
        </h2>

        {formError && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-400">
            <AlertCircle size={15} /> {formError}
          </div>
        )}

        <form onSubmit={handleAdd} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
              Lecture Title <span className="text-red-500">*</span>
            </label>
            <input
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="e.g. Solution to EE 272 Question 1"
              className={inputCls}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
              YouTube URL <span className="text-red-500">*</span>
            </label>
            <input
              value={form.youtubeUrl}
              onChange={(e) => setForm((p) => ({ ...p, youtubeUrl: e.target.value }))}
              placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
              className={inputCls}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">Category</label>
            <input
              value={form.category}
              onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
              placeholder="e.g. Exam Solutions, Electromagnetic Field Theory"
              className={inputCls}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              rows={2}
              placeholder="Brief summary of what this video lecture covers…"
              className={`${inputCls} resize-none`}
            />
          </div>

          {/* Star as Featured Checkbox */}
          <div className="sm:col-span-2 flex items-center justify-between rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.is_featured}
                onChange={(e) => setForm((p) => ({ ...p, is_featured: e.target.checked }))}
                className="h-4 w-4 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-amber-500 focus:ring-amber-500"
              />
              <span className="text-sm font-medium text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                <Star size={15} className="fill-amber-400 text-amber-400" />
                Feature this lecture at the top of the Videos page &amp; Homepage
              </span>
            </label>
            <span className="text-xs text-amber-700 dark:text-amber-300/70 hidden sm:inline">
              Highlighted with gold borders for students
            </span>
          </div>

          <div className="sm:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-slate-950 shadow-md shadow-emerald-500/20 hover:bg-emerald-400 disabled:opacity-60 transition cursor-pointer"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <PlusCircle size={16} />}
              Add Lecture Video
            </button>
          </div>
        </form>
      </section>

      {/* ── Filters & Search Controls ─────────────────────────────── */}
      <div className="mb-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Tab Filters */}
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1 shadow-sm">
          <button
            onClick={() => setActiveTab('all')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
              activeTab === 'all'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            All Videos ({videos.length})
          </button>
          <button
            onClick={() => setActiveTab('featured')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
              activeTab === 'featured'
                ? 'bg-amber-400 text-slate-950 shadow-sm'
                : 'text-amber-600 dark:text-amber-400/80 hover:text-amber-700 dark:hover:text-amber-300'
            }`}
          >
            <Star size={13} className="fill-amber-400" />
            Featured ({featuredCount})
          </button>
          <button
            onClick={() => setActiveTab('standard')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
              activeTab === 'standard'
                ? 'bg-slate-700 text-slate-100 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Unfeatured ({videos.length - featuredCount})
          </button>
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title or category…"
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pl-9 pr-3 py-2 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 outline-none transition focus:border-emerald-500 shadow-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* ── Video List ────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 overflow-hidden shadow-sm dark:shadow-xl">
        <div className="border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>Video Library</span>
            <span className="text-xs text-slate-500 font-normal">
              Showing {filteredVideos.length} of {videos.length}
            </span>
          </h2>
          <span className="text-xs text-slate-500 hidden sm:inline">
            Click the Star on any video to feature or unfeature it
          </span>
        </div>

        {loading ? (
          <div className="space-y-px p-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 animate-pulse bg-slate-100 dark:bg-slate-800/40 rounded-xl mb-3" />
            ))}
          </div>
        ) : filteredVideos.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <PlaySquare size={36} className="mx-auto text-slate-400 dark:text-slate-600 mb-2" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No videos match your filter</p>
            <p className="text-xs text-slate-500 mt-1">Try clearing your search query or sync the YouTube channel.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-800/80">
            {filteredVideos.map((v) => {
              const vid = v.id || v._id;
              const isFeat = Number(v.is_featured) === 1;
              const ytUrl = v.youtube_url || v.youtubeUrl || '';
              const dateVal = v.published_at || v.created_at || v.createdAt;
              const thumb = v.thumbnail_url || (v.youtube_id ? `https://img.youtube.com/vi/${v.youtube_id}/hqdefault.jpg` : null);

              return (
                <div
                  key={vid}
                  className={`p-5 transition hover:bg-slate-50 dark:hover:bg-slate-800/30 ${
                    isFeat ? 'bg-amber-500/[0.04] border-l-4 border-l-amber-400' : ''
                  }`}
                >
                  {editId === vid ? (
                    /* ── Inline Edit Form ── */
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 bg-slate-50 dark:bg-slate-850 p-4 rounded-xl border border-emerald-500/30">
                      <div>
                        <label className="mb-1 block text-xs text-slate-600 dark:text-slate-400">Title</label>
                        <input
                          value={editData.title}
                          onChange={(e) => setEditData((p) => ({ ...p, title: e.target.value }))}
                          placeholder="Title"
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-slate-600 dark:text-slate-400">YouTube URL</label>
                        <input
                          value={editData.youtubeUrl}
                          onChange={(e) => setEditData((p) => ({ ...p, youtubeUrl: e.target.value }))}
                          placeholder="YouTube URL"
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-slate-600 dark:text-slate-400">Category</label>
                        <input
                          value={editData.category}
                          onChange={(e) => setEditData((p) => ({ ...p, category: e.target.value }))}
                          placeholder="Category"
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-slate-600 dark:text-slate-400">Description</label>
                        <textarea
                          value={editData.description}
                          onChange={(e) => setEditData((p) => ({ ...p, description: e.target.value }))}
                          rows={2}
                          placeholder="Description"
                          className={`${inputCls} resize-none`}
                        />
                      </div>

                      <div className="sm:col-span-2 flex items-center justify-between border-t border-slate-200 dark:border-slate-750 pt-3">
                        <label className="flex items-center gap-2 cursor-pointer text-xs text-amber-700 dark:text-amber-200">
                          <input
                            type="checkbox"
                            checked={editData.is_featured}
                            onChange={(e) => setEditData((p) => ({ ...p, is_featured: e.target.checked }))}
                            className="rounded border-slate-300 dark:border-slate-700 text-amber-500 focus:ring-amber-500"
                          />
                          <Star size={13} className="fill-amber-400 text-amber-400 inline" />
                          Featured Lecture at Top
                        </label>

                        <div className="flex gap-2">
                          <button
                            onClick={cancelEdit}
                            className="flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                          >
                            <X size={13} /> Cancel
                          </button>
                          <button
                            onClick={() => saveEdit(vid)}
                            disabled={saving}
                            className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-60 transition cursor-pointer"
                          >
                            {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                            Save
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* ── Row View ── */
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      {/* Left: Thumbnail & Info */}
                      <div className="flex items-start gap-4 min-w-0 flex-1">
                        {thumb ? (
                          <div className="relative shrink-0 w-28 h-18 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700/60 bg-slate-100 dark:bg-slate-950">
                            <img
                              src={thumb}
                              alt={v.title}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                            {isFeat && (
                              <div className="absolute top-1 left-1 rounded bg-amber-500/90 p-0.5 shadow">
                                <Star size={11} className="fill-slate-950 text-slate-950" />
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="shrink-0 w-28 h-18 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                            <Video size={24} className="text-slate-400 dark:text-slate-500" />
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm sm:text-base leading-snug line-clamp-1">
                              {v.title}
                            </h3>
                            {isFeat ? (
                              <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                                <Star size={11} className="fill-amber-400 text-amber-400" />
                                Featured
                              </span>
                            ) : null}
                          </div>

                          <div className="mt-1.5 flex flex-wrap items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400">
                            {v.category && (
                              <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                                {v.category}
                              </span>
                            )}
                            {dateVal && (
                              <span className="text-slate-400 dark:text-slate-500">
                                {new Date(dateVal).toLocaleDateString(undefined, {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </span>
                            )}
                            {ytUrl && (
                              <a
                                href={ytUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition"
                              >
                                <ExternalLink size={11} /> Watch
                              </a>
                            )}
                          </div>

                          {v.description && (
                            <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 line-clamp-1">
                              {v.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
                        {/* Star Feature Button */}
                        <button
                          onClick={() => handleToggleFeatured(v)}
                          disabled={togglingId === vid}
                          title={isFeat ? 'Unfeature this lecture' : 'Feature this lecture at top'}
                          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition cursor-pointer ${
                            isFeat
                              ? 'border border-amber-500/50 bg-amber-500/15 text-amber-700 dark:text-amber-300 hover:bg-amber-500/25'
                              : 'border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:border-amber-500/40 hover:text-amber-500'
                          }`}
                        >
                          {togglingId === vid ? (
                            <Loader2 size={13} className="animate-spin text-amber-500" />
                          ) : (
                            <Star
                              size={13}
                              className={isFeat ? 'fill-amber-400 text-amber-400' : 'text-slate-400'}
                            />
                          )}
                          <span className="hidden sm:inline">
                            {isFeat ? 'Featured' : 'Feature'}
                          </span>
                        </button>

                        {/* Edit Button */}
                        <button
                          onClick={() => startEdit(v)}
                          className="flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
                        >
                          <Pencil size={12} /> Edit
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDelete(vid)}
                          disabled={deleteId === vid}
                          className="flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/10 px-2.5 py-1.5 text-xs text-red-600 dark:text-red-400 hover:bg-red-500/20 transition disabled:opacity-50 cursor-pointer"
                        >
                          {deleteId === vid ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <Trash2 size={12} />
                          )}
                          <span className="hidden sm:inline">Delete</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
