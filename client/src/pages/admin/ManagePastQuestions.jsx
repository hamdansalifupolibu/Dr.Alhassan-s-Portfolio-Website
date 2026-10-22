import { useState, useEffect, useRef, useCallback } from 'react';
import { Upload, Trash2, FileText, Loader2, AlertCircle, Download, CheckCircle2 } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import API from '../../lib/api';
import { useToast } from '../../context/ToastContext';

const inputCls =
  'w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 shadow-sm';

const EMPTY_FORM = { title: '', subject: '', year: '', description: '' };

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
  const [formError, setFormError] = useState('');
  const fileRef                   = useRef(null);

  /* delete */
  const [deleteId, setDeleteId]   = useState(null);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await API.get('/past-questions');
      const list = Array.isArray(data) ? data : (data?.data ?? []);
      setQuestions([...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch {
      setError('Failed to load past questions.');
      toast.error('Failed to load past questions.');
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
    if (file.type !== 'application/pdf') {
      setFormError('Only PDF files are allowed.');
      toast.error('Only PDF documents are supported.');
      return;
    }

    setSubmitting(true);
    setFormError('');

    const fd = new FormData();
    fd.append('title',       form.title.trim());
    fd.append('subject',     form.subject.trim());
    fd.append('year',        form.year);
    fd.append('description', form.description.trim());
    fd.append('file',        file);

    try {
      await API.post('/past-questions', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setForm(EMPTY_FORM);
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
      setSuccess('Past question uploaded successfully.');
      toast.success('Past question paper uploaded successfully!');
      setTimeout(() => setSuccess(''), 3500);
      fetchQuestions();
    } catch (err) {
      const msg = err.response?.data?.message || 'Upload failed. Please try again.';
      setFormError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
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
          Upload and manage semester examination question papers (PDF) accessible by verified students and paid users.
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

          {/* File picker */}
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
              PDF Document <span className="text-red-500">*</span>
            </label>
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-4 py-4 text-sm text-slate-600 dark:text-slate-400 transition hover:border-emerald-500 hover:text-slate-900 dark:hover:text-slate-200">
              <FileText size={22} className={file ? 'text-emerald-500' : 'text-slate-400'} />
              <span className="truncate font-medium">
                {file ? file.name : 'Click to select or drag PDF file here…'}
              </span>
              <input
                ref={fileRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => { setFile(e.target.files[0] || null); setFormError(''); }}
              />
            </label>
          </div>

          <div className="sm:col-span-2 flex justify-end">
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
          <span className="text-xs text-slate-500">Available to students with valid token</span>
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
              const downloadUrl = `/api/past-questions/${qid}/download`;
              return (
                <div key={qid} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-500 border border-red-500/20">
                    <FileText size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">{q.title}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
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
                  <div className="flex shrink-0 items-center gap-2">
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
