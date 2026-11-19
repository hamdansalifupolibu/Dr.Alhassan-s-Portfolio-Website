import { useState, useEffect, useRef, useCallback } from 'react';
import { Upload, Trash2, FileText, Loader2, AlertCircle, Download, CheckCircle2, Lock, Unlock } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import API from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { upload as blobUpload } from '@vercel/blob/client';

const formatMB = (bytes) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;
const isPdf = (f) => f && (f.type === 'application/pdf' || /\.pdf$/i.test(f.name));

const inputCls =
  'w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 shadow-sm';

// New papers are PAID unless the lecturer deliberately picks Free
const EMPTY_FORM = { title: '', subject: '', year: '', description: '', access: 'paid' };

const ACCESS_OPTIONS = [
  { value: 'paid', label: 'Paid', hint: 'Unlocked only after Paystack payment', Icon: Lock, tone: 'blue' },
  { value: 'free', label: 'Free', hint: 'Open to anyone who fills the free access form', Icon: Unlock, tone: 'emerald' },
];

export default function ManagePastQuestions() {
  const toast = useToast();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');

  /* form */
  const [form, setForm]           = useState(EMPTY_FORM);
  const [file, setFile]           = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress]   = useState(null); // 0-100 while uploading
  const [formError, setFormError] = useState('');
  const fileRef                   = useRef(null);

  /* delete */
  const [deleteId, setDeleteId]   = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await API.get('/past-questions');
      const list = Array.isArray(data) ? data : (data?.data ?? []);
      setQuestions([...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch (err) {
      const status = err.response?.status;
      const detail = err.response?.data?.error || err.message;
      const msg =
        status === 401 || status === 403
          ? 'Your admin session has expired. Please sign out and log in again.'
          : `Failed to load past questions${status ? ` (${status})` : ''}: ${detail}`;
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchQuestions(); }, [fetchQuestions]);

  /* ── submit ─────────────────────────────────────────────────────── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setFormError('Title is required.');
      toast.error('Please enter a title for the exam paper.');
      return;
    }
    if (!file) {
      setFormError('Please select a PDF file.');
      toast.error('Please choose a PDF file to upload.');
      return;
    }
    if (!isPdf(file)) {
      setFormError('Only PDF files are allowed.');
      toast.error('Only PDF documents are supported.');
      return;
    }

    setSubmitting(true);
    setFormError('');
    setProgress(0);

    try {
      // Ask the server which storage is active (Vercel Blob in production, local disk in development)
      const { data: cfg } = await API.get('/past-questions/upload-config');
      if (cfg?.maxBytes && file.size > cfg.maxBytes) {
        throw new Error(`This PDF is ${formatMB(file.size)}. The maximum allowed size is ${formatMB(cfg.maxBytes)}.`);
      }

      const meta = {
        title:       form.title.trim(),
        subject:     form.subject.trim(),
        year:        form.year,
        description: form.description.trim(),
        access:      form.access,
      };

      if (cfg?.mode === 'blob') {
        // 1) Upload the file straight from the browser to permanent Vercel Blob storage
        const safeName = file.name.replace(/[^\w.()-]+/g, '_').replace(/\.pdf$/i, '') + '.pdf';
        const blob = await blobUpload(`past-questions/${safeName}`, file, {
          access: 'public',
          contentType: 'application/pdf',
          handleUploadUrl: `${API.defaults.baseURL}/past-questions/blob-token`,
          headers: { Authorization: `Bearer ${localStorage.getItem('adminToken') || ''}` },
          multipart: file.size > 5 * 1024 * 1024, // chunked + retried for large files
          onUploadProgress: ({ percentage }) => setProgress(Math.round(percentage)),
        });
        // 2) Record it in the database
        await API.post('/past-questions', { ...meta, blobUrl: blob.url });
      } else {
        const fd = new FormData();
        Object.entries(meta).forEach(([k, v]) => fd.append(k, v));
        fd.append('file', file);
        await API.post('/past-questions', fd, {
          onUploadProgress: (e) => e.total && setProgress(Math.round((e.loaded / e.total) * 100)),
        });
      }

      setForm(EMPTY_FORM);
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
      setSuccess('Past question uploaded successfully.');
      toast.success('Past question paper uploaded successfully!');
      setTimeout(() => setSuccess(''), 3500);
      fetchQuestions();
    } catch (err) {
      let msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Upload failed. Please try again.';
      if (err.response?.status === 401) msg = 'Your admin session has expired. Please log in again.';
      if (err.response?.status === 413) msg = err.response?.data?.error || 'The PDF is too large for the server.';
      setFormError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
      setProgress(null);
    }
  };

  /* ── free ⇄ paid ────────────────────────────────────────────────── */
  const handleToggleAccess = async (q) => {
    const qid = q.id || q._id;
    const next = q.access === 'free' ? 'paid' : 'free';
    setTogglingId(qid);
    try {
      const { data } = await API.patch(`/past-questions/${qid}/access`, { access: next });
      setQuestions((prev) => prev.map((x) => ((x.id || x._id) === qid ? { ...x, access: data.access } : x)));
      toast.success(data.message || `Moved to ${next}.`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not change the access level.');
    } finally {
      setTogglingId(null);
    }
  };

  /* ── delete ─────────────────────────────────────────────────────── */
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this past question? This cannot be undone.')) return;
    setDeleteId(id);
    try {
      await API.delete(`/past-questions/${id}`);
      toast.success('Past question deleted successfully.');
      fetchQuestions();
    } catch {
      setError('Failed to delete past question.');
      toast.error('Failed to delete past question.');
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <span>Manage Past Questions</span>
          <span className="rounded-full bg-slate-200 dark:bg-slate-800 px-2.5 py-0.5 text-xs text-slate-700 dark:text-slate-400 font-mono">
            {questions.length} Total
          </span>
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Upload and manage semester examination question papers (PDF) Mark each paper Free (open to anyone after a short info form) or Paid (unlocked by Paystack payment).
        </p>
      </div>

      {/* ── Upload Form ──────────────────────────────────────────── */}
      <section className="mb-10 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-6 shadow-sm dark:shadow-xl backdrop-blur-sm">
        <h2 className="mb-5 flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-slate-100">
          <Upload size={18} className="text-emerald-500" />
          Upload Past Question Paper
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

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Title */}
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
              Exam Title <span className="text-red-500">*</span>
            </label>
            <input
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="e.g. EE 272 Linear Systems &amp; Signals Mid-Semester 2024"
              className={inputCls}
            />
          </div>

          {/* Subject */}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">Subject / Course Name</label>
            <input
              value={form.subject}
              onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
              placeholder="e.g. Linear Systems, Electrical Machines"
              className={inputCls}
            />
          </div>

          {/* Year */}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">Year</label>
            <input
              type="number"
              value={form.year}
              onChange={(e) => setForm((p) => ({ ...p, year: e.target.value }))}
              placeholder={new Date().getFullYear().toString()}
              min="1900"
              max="2100"
              className={inputCls}
            />
          </div>

          {/* Description */}
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">Description / Solution Notes</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              rows={2}
              placeholder="Optional notes, instructions, or whether solutions are attached…"
              className={`${inputCls} resize-none`}
            />
          </div>

          {/* Access level */}
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
              Access <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Access level">
              {ACCESS_OPTIONS.map(({ value, label, hint, Icon, tone }) => {
                const active = form.access === value;
                const activeCls =
                  tone === 'blue'
                    ? 'border-blue-500 bg-blue-500/10 ring-1 ring-blue-500'
                    : 'border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500';
                return (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    disabled={submitting}
                    onClick={() => setForm((p) => ({ ...p, access: value }))}
                    className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-left transition cursor-pointer ${
                      active ? activeCls : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500'
                    }`}
                  >
                    <Icon size={18} className={tone === 'blue' ? 'mt-0.5 text-blue-500' : 'mt-0.5 text-emerald-500'} />
                    <span>
                      <span className="block text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {label}{value === 'paid' && ' (default)'}
                      </span>
                      <span className="block text-xs text-slate-500 dark:text-slate-400">{hint}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* File picker */}
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
              PDF Document <span className="text-red-500">*</span>
            </label>
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-4 py-4 text-sm text-slate-600 dark:text-slate-400 transition hover:border-emerald-500 hover:text-slate-900 dark:hover:text-slate-200">
              <FileText size={22} className={file ? 'text-emerald-500' : 'text-slate-400'} />
              <span className="truncate font-medium">
                {file ? `${file.name} (${formatMB(file.size)})` : 'Click to select or drag PDF file here…'}
              </span>
              <input
                ref={fileRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => { setFile(e.target.files[0] || null); setFormError(''); }}
                disabled={submitting}
              />
            </label>
          </div>

          <div className="sm:col-span-2 flex items-center justify-end gap-4">
            {progress !== null && (
              <div className="flex flex-1 items-center gap-3" aria-live="polite">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                  <div className="h-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }} />
                </div>
                <span className="w-24 text-right text-xs font-medium text-slate-600 dark:text-slate-400">
                  {progress < 100 ? `Uploading ${progress}%` : 'Saving…'}
                </span>
              </div>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-slate-950 shadow-md shadow-emerald-500/20 hover:bg-emerald-400 disabled:opacity-60 transition cursor-pointer"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              Upload Past Question
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
            Uploaded Exam Papers ({questions.length})
          </h2>
          <span className="text-xs text-slate-500">
            {questions.filter((q) => q.access === 'free').length} free · {questions.filter((q) => q.access !== 'free').length} paid
          </span>
        </div>

        {loading ? (
          <div className="space-y-px p-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 animate-pulse bg-slate-100 dark:bg-slate-800/40 rounded-xl mb-3" />
            ))}
          </div>
        ) : questions.length === 0 ? (
          <p className="px-6 py-12 text-center text-sm text-slate-500">No past questions uploaded yet.</p>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-800/80">
            {questions.map((q) => {
              const qid = q.id || q._id;
              const dateVal = q.created_at || q.createdAt;
              const downloadUrl = `${API.defaults.baseURL}/past-questions/${qid}/download?token=${encodeURIComponent(localStorage.getItem('adminToken') || '')}`;
              return (
                <div key={qid} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-500 border border-red-500/20">
                    <FileText size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">{q.title}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      {q.access === 'free' ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 px-2 py-0.5 font-bold text-emerald-700 dark:text-emerald-400">
                          <Unlock size={11} /> FREE
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md bg-blue-500/15 px-2 py-0.5 font-bold text-blue-700 dark:text-blue-400">
                          <Lock size={11} /> PAID
                        </span>
                      )}
                      {q.subject && (
                        <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-slate-700 dark:text-slate-300 font-medium">
                          {q.subject}
                        </span>
                      )}
                      {q.year && (
                        <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-emerald-700 dark:text-emerald-400 font-medium">
                          {q.year}
                        </span>
                      )}
                      {dateVal && <span>Uploaded {new Date(dateVal).toLocaleDateString()}</span>}
                    </div>
                    {q.description && (
                      <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 line-clamp-1">{q.description}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                    <button
                      onClick={() => handleToggleAccess(q)}
                      disabled={togglingId === qid}
                      title={q.access === 'free' ? 'Move to the paid section' : 'Make this paper free'}
                      className="flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-50 cursor-pointer"
                    >
                      {togglingId === qid ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : q.access === 'free' ? (
                        <Lock size={13} />
                      ) : (
                        <Unlock size={13} />
                      )}
                      {q.access === 'free' ? 'Make Paid' : 'Make Free'}
                    </button>
                    <a
                      href={downloadUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                    >
                      <Download size={13} /> Download
                    </a>
                    <button
                      onClick={() => handleDelete(qid)}
                      disabled={deleteId === qid}
                      className="flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs text-red-600 dark:text-red-400 hover:bg-red-500/20 transition disabled:opacity-50 cursor-pointer"
                    >
                      {deleteId === qid
                        ? <Loader2 size={13} className="animate-spin" />
                        : <Trash2 size={13} />}
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
