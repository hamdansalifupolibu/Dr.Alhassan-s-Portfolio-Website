import { useState, useEffect, useCallback } from 'react';
import {
  PlusCircle, Trash2, Pencil, X, Check,
  Loader2, AlertCircle, ExternalLink, Briefcase, CheckCircle2,
} from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import API from '../../lib/api';
import { useToast } from '../../context/ToastContext';

/* ── constants ─────────────────────────────────────────────────────── */
const inputCls =
  'w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 shadow-sm';

const TYPES = ['publication', 'research', 'award', 'other'];

const TYPE_BADGE = {
  publication: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30',
  research:    'bg-violet-500/15 text-violet-600 dark:text-violet-400 border border-violet-500/30',
  award:       'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30',
  other:       'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300',
};

const EMPTY_FORM = { title: '', type: 'publication', year: '', description: '', link: '' };

export default function ManagePortfolio() {
  const toast = useToast();
  const [items, setItems]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');

  /* add form */
  const [form, setForm]           = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  /* inline edit */
  const [editId, setEditId]       = useState(null);
  const [editData, setEditData]   = useState({});
  const [saving, setSaving]       = useState(false);

  /* delete */
  const [deleteId, setDeleteId]   = useState(null);

  /* ── fetch ──────────────────────────────────────────────────────── */
  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await API.get('/portfolio');
      const list = Array.isArray(data) ? data : (data?.data ?? []);
      setItems([...list].sort((a, b) => (b.year ?? 0) - (a.year ?? 0)));
    } catch {
      setError('Failed to load portfolio items.');
      toast.error('Failed to load portfolio items from server.');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  /* ── add ────────────────────────────────────────────────────────── */
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setFormError('Title is required.');
      toast.error('Title is required.');
      return;
    }
    setSubmitting(true);
    setFormError('');
    try {
      await API.post('/portfolio', form);
      setForm(EMPTY_FORM);
      setSuccess('Portfolio item added.');
      toast.success('Portfolio item created successfully!');
      setTimeout(() => setSuccess(''), 3500);
      fetchItems();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to add item.';
      setFormError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  /* ── edit ───────────────────────────────────────────────────────── */
  const startEdit = (item) => {
    const itemId = item.id || item._id;
    setEditId(itemId);
    setEditData({
      title:       item.title,
      type:        item.type ?? 'publication',
      year:        item.year ?? '',
      description: item.description ?? '',
      link:        item.link ?? '',
    });
  };

  const cancelEdit = () => { setEditId(null); setEditData({}); };

  const saveEdit = async (id) => {
    if (!editData.title?.trim()) {
      toast.error('Title is required.');
      return;
    }
    setSaving(true);
    try {
      await API.put(`/portfolio/${id}`, editData);
      cancelEdit();
      fetchItems();
      toast.success('Portfolio item updated successfully!');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save changes.';
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  /* ── delete ─────────────────────────────────────────────────────── */
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this portfolio item? This cannot be undone.')) return;
    setDeleteId(id);
    try {
      await API.delete(`/portfolio/${id}`);
      toast.success('Portfolio item deleted.');
      fetchItems();
    } catch {
      setError('Failed to delete item.');
      toast.error('Failed to delete item.');
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <span>Manage Portfolio</span>
          <span className="rounded-full bg-slate-200 dark:bg-slate-800 px-2.5 py-0.5 text-xs text-slate-700 dark:text-slate-400 font-mono">
            {items.length} Total
          </span>
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Add, edit, or remove publications, research projects, awards, and professional milestones.
        </p>
      </div>

      {/* ── Add Form ─────────────────────────────────────────────── */}
      <section className="mb-10 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-6 shadow-sm dark:shadow-xl backdrop-blur-sm">
        <h2 className="mb-5 flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-slate-100">
          <PlusCircle size={18} className="text-emerald-500" />
          Add Portfolio Item
        </h2>

        {formError && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-400">
            <AlertCircle size={15} /> {formError}
          </div>
        )}
        {success && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 size={15} /> {success}
          </div>
        )}

        <form onSubmit={handleAdd} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Title */}
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              value={form.title}
              onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))}
              placeholder="e.g. Robust Secondary Frequency Control for Islanded Microgrids"
              className={inputCls}
            />
          </div>

          {/* Type */}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">Category Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm(p => ({ ...p, type: e.target.value }))}
              className={inputCls}
            >
              {TYPES.map((t) => (
                <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>
              ))}
            </select>
          </div>

          {/* Year */}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">Year</label>
            <input
              type="number"
              value={form.year}
              onChange={(e) => setForm(p => ({ ...p, year: e.target.value }))}
              placeholder={new Date().getFullYear().toString()}
              min="1900"
              max="2100"
              className={inputCls}
            />
          </div>

          {/* Link */}
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">Publication Link / DOI (URL)</label>
            <input
              type="url"
              value={form.link}
              onChange={(e) => setForm(p => ({ ...p, link: e.target.value }))}
              placeholder="https://doi.org/10.1016/j.epsr..."
              className={inputCls}
            />
          </div>

          {/* Description */}
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">Abstract / Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))}
              rows={3}
              placeholder="Brief summary of the paper, journal name, citation details, or award significance…"
              className={`${inputCls} resize-none`}
            />
          </div>

          <div className="sm:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-slate-950 shadow-md shadow-emerald-500/20 hover:bg-emerald-400 disabled:opacity-60 transition cursor-pointer"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <PlusCircle size={16} />}
              Add Item
            </button>
          </div>
        </form>
      </section>

      {/* ── List ─────────────────────────────────────────────────── */}
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          <AlertCircle size={15} /> {error}
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 overflow-hidden shadow-sm dark:shadow-xl">
        <div className="border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            All Portfolio Entries ({items.length})
          </h2>
          <span className="text-xs text-slate-500">Live on public Portfolio page</span>
        </div>

        {loading ? (
          <div className="space-y-px p-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 animate-pulse bg-slate-100 dark:bg-slate-800/40 rounded-xl mb-3" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="px-6 py-12 text-center text-sm text-slate-500">No portfolio items yet. Add one above.</p>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-800/80">
            {items.map((item) => {
              const itemId = item.id || item._id;
              return (
                <div key={itemId} className="px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  {editId === itemId ? (
                    /* ── Inline edit ── */
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 bg-slate-50 dark:bg-slate-850 p-4 rounded-xl border border-emerald-500/30">
                      <div className="sm:col-span-2">
                        <label className="mb-1 block text-xs text-slate-600 dark:text-slate-400">Title</label>
                        <input
                          value={editData.title}
                          onChange={(e) => setEditData(p => ({ ...p, title: e.target.value }))}
                          placeholder="Title"
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-slate-600 dark:text-slate-400">Type</label>
                        <select
                          value={editData.type}
                          onChange={(e) => setEditData(p => ({ ...p, type: e.target.value }))}
                          className={inputCls}
                        >
                          {TYPES.map((t) => (
                            <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-slate-600 dark:text-slate-400">Year</label>
                        <input
                          type="number"
                          value={editData.year}
                          onChange={(e) => setEditData(p => ({ ...p, year: e.target.value }))}
                          placeholder="Year"
                          className={inputCls}
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="mb-1 block text-xs text-slate-600 dark:text-slate-400">Link URL</label>
                        <input
                          type="url"
                          value={editData.link}
                          onChange={(e) => setEditData(p => ({ ...p, link: e.target.value }))}
                          placeholder="Link URL"
                          className={inputCls}
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="mb-1 block text-xs text-slate-600 dark:text-slate-400">Description</label>
                        <textarea
                          value={editData.description}
                          onChange={(e) => setEditData(p => ({ ...p, description: e.target.value }))}
                          rows={2}
                          placeholder="Description"
                          className={`${inputCls} resize-none`}
                        />
                      </div>
                      <div className="sm:col-span-2 flex gap-2 justify-end border-t border-slate-200 dark:border-slate-750 pt-3">
                        <button
                          onClick={cancelEdit}
                          className="flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                        >
                          <X size={13} /> Cancel
                        </button>
                        <button
                          onClick={() => saveEdit(itemId)}
                          disabled={saving}
                          className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-60 transition cursor-pointer"
                        >
                          {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                          Save Changes
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* ── Row view ── */
                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                        <Briefcase size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">{item.title}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                          <span className={`rounded-full px-2.5 py-0.5 capitalize font-medium text-[11px] ${TYPE_BADGE[item.type] ?? TYPE_BADGE.other}`}>
                            {item.type}
                          </span>
                          {item.year && <span className="text-slate-500 dark:text-slate-400">{item.year}</span>}
                          {item.link && (
                            <a
                              href={item.link}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline"
                            >
                              <ExternalLink size={11} /> View Link
                            </a>
                          )}
                        </div>
                        {item.description && (
                          <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 line-clamp-2">{item.description}</p>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          onClick={() => startEdit(item)}
                          className="flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
                        >
                          <Pencil size={12} /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(itemId)}
                          disabled={deleteId === itemId}
                          className="flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/10 px-2.5 py-1.5 text-xs text-red-600 dark:text-red-400 hover:bg-red-500/20 transition disabled:opacity-50 cursor-pointer"
                        >
                          {deleteId === itemId
                            ? <Loader2 size={12} className="animate-spin" />
                            : <Trash2 size={12} />}
                          Delete
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
