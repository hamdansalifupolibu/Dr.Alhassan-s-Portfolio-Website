import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen,
  CreditCard,
  Download,
  Loader2,
  FileQuestion,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Filter,
  Lock,
  Unlock,
  Gift,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import API from '../lib/api';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';

// ─── Animation variants ────────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
};
const containerVariants = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };
const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

const inputCls =
  'w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-1 transition';

const LEVELS = ['Level 100', 'Level 200', 'Level 300', 'Level 400', 'Postgraduate', 'Not a student / Other'];

const apiBase = () => import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api');

// ─── Dynamic Paystack script loader ───────────────────────────────────────────
function loadPaystackScript() {
  return new Promise((resolve) => {
    if (window.PaystackPop) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

// ─── Option tabs ──────────────────────────────────────────────────────────────
function OptionTab({ active, onClick, tone, Icon, title, subtitle, badge }) {
  const activeCls =
    tone === 'emerald'
      ? 'border-emerald-500 ring-2 ring-emerald-500/40 bg-emerald-500/5'
      : 'border-blue-500 ring-2 ring-blue-500/40 bg-blue-500/5';
  const iconCls =
    tone === 'emerald'
      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
      : 'bg-blue-500/15 border-blue-500/30 text-blue-600 dark:text-blue-400';
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`flex w-full items-center gap-4 rounded-3xl border bg-white dark:bg-slate-900/90 p-5 sm:p-6 text-left shadow-lg shadow-slate-200/50 dark:shadow-none transition-all cursor-pointer ${
        active ? activeCls : 'border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600'
      }`}
    >
      <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${iconCls}`}>
        <Icon className="h-6 w-6" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-base sm:text-lg font-bold text-slate-900 dark:text-white">{title}</span>
        <span className="block text-xs sm:text-sm text-slate-500 dark:text-slate-400">{subtitle}</span>
      </span>
      {badge && (
        <span
          className={`hidden sm:inline-flex shrink-0 rounded-full border px-3 py-1 text-xs font-bold ${
            tone === 'emerald'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              : 'border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400'
          }`}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

// ─── Paper grid (shared by both sections) ─────────────────────────────────────
function PaperGrid({ papers, tone, emptyText }) {
  const [activeSubject, setActiveSubject] = useState('All');
  const subjects = useMemo(() => ['All', ...new Set(papers.map((q) => q.subject).filter(Boolean))], [papers]);
  const shown = activeSubject === 'All' ? papers : papers.filter((q) => q.subject === activeSubject);
  const accent = tone === 'emerald' ? 'emerald' : 'blue';

  const handleDownload = (q) => {
    const token = localStorage.getItem('accessToken');
    const url = `${apiBase()}/past-questions/${q.id}/download${token ? `?token=${encodeURIComponent(token)}` : ''}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (papers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 px-6 py-20 text-center text-slate-500">
        <FileQuestion className="h-12 w-12 text-slate-400" />
        <p className="text-base font-bold text-slate-700 dark:text-slate-300">Nothing here yet</p>
        <p className="max-w-sm text-xs">{emptyText}</p>
      </div>
    );
  }

  return (
    <div>
      {subjects.length > 2 && (
        <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-1">
          <Filter className="h-4 w-4 shrink-0 text-slate-400" />
          {subjects.map((sub) => (
            <button
              key={sub}
              onClick={() => setActiveSubject(sub)}
              className={`shrink-0 rounded-xl border px-4 py-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeSubject === sub
                  ? accent === 'emerald'
                    ? 'border-emerald-500 bg-emerald-500 text-slate-950'
                    : 'border-blue-600 bg-blue-600 text-white'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {sub}
            </button>
          ))}
        </div>
      )}

      <motion.div
        key={activeSubject}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
      >
        {shown.map((q) => (
          <motion.div
            key={q.id}
            variants={cardVariants}
            className="flex flex-col justify-between rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-6 shadow-lg shadow-slate-200/50 dark:shadow-none"
          >
            <div>
              <div className="mb-3 flex items-center justify-between gap-2">
                <span
                  className={`rounded-md border px-2.5 py-0.5 text-xs font-semibold ${
                    accent === 'emerald'
                      ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400'
                  }`}
                >
                  {q.subject || 'Engineering'}
                </span>
                {q.year && <span className="font-mono text-xs font-semibold text-slate-500 dark:text-slate-400">{q.year}</span>}
              </div>
              <h3 className="text-base font-bold leading-snug text-slate-900 dark:text-white">{q.title}</h3>
              {q.description && (
                <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-slate-600 dark:text-slate-400">{q.description}</p>
              )}
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
              <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">PDF Document</span>
              {q.unlocked ? (
                <button
                  onClick={() => handleDownload(q)}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-colors cursor-pointer ${
                    accent === 'emerald'
                      ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                      : 'bg-blue-600 text-white hover:bg-blue-500'
                  }`}
                >
                  <Download size={13} />
                  <span>Download PDF</span>
                </button>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-500">
                  <Lock size={13} /> Locked
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

// ─── Free access form ─────────────────────────────────────────────────────────
function FreeAccessForm({ freeCount, onGranted }) {
  const toast = useToast();
  const [form, setForm] = useState({ name: '', email: '', programme: '', level: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) return setError('Please enter your full name.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) return setError('Please enter a valid email address.');

    setSubmitting(true);
    try {
      const { data } = await API.post('/access/free-signup', {
        name: form.name.trim(),
        email: form.email.trim(),
        programme: form.programme.trim(),
        level: form.level,
      });
      localStorage.setItem('accessToken', data.token);
      toast.success(data.message || 'Free past questions unlocked!');
      onGranted();
    } catch (err) {
      const msg = err.response?.data?.error || 'Could not open the free past questions. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className="mx-auto max-w-2xl rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-6 sm:p-8 shadow-xl shadow-slate-200/50 dark:shadow-none"
    >
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
          <Gift className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Open the free past questions</h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            {freeCount > 0 ? `${freeCount} free paper${freeCount === 1 ? '' : 's'} available. ` : ''}
            Tell us a little about yourself once. No payment needed, for UMaT and non-UMaT students alike.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
            Full Name <span className="text-red-400">*</span>
          </label>
          <input value={form.name} onChange={set('name')} placeholder="e.g. Kwame Mensah" disabled={submitting}
            className={`${inputCls} focus:border-emerald-500 focus:ring-emerald-500`} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
            Email Address <span className="text-red-400">*</span>
          </label>
          <input type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" disabled={submitting}
            className={`${inputCls} focus:border-emerald-500 focus:ring-emerald-500`} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">Programme</label>
          <input value={form.programme} onChange={set('programme')} placeholder="e.g. BSc Electrical & Electronic Eng." disabled={submitting}
            className={`${inputCls} focus:border-emerald-500 focus:ring-emerald-500`} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">Level</label>
          <select value={form.level} onChange={set('level')} disabled={submitting}
            className={`${inputCls} focus:border-emerald-500 focus:ring-emerald-500`}>
            <option value="">Select your level</option>
            {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>

        {error && (
          <div className="sm:col-span-2 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-600 dark:text-red-400">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="sm:col-span-2 flex items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3.5 font-bold text-slate-950 shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-400 disabled:opacity-50 cursor-pointer"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Unlock className="h-4 w-4" />}
          {submitting ? 'Opening…' : 'Access Free Past Questions'}
        </button>
      </form>
    </motion.div>
  );
}

// ─── Paid access (Paystack) ───────────────────────────────────────────────────
function PaidAccessCard({ paidCount, onGranted }) {
  const { settings } = useSettings();
  const [payerEmail, setPayerEmail] = useState('');
  const [payerName, setPayerName] = useState('');
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState('');
  const [paySuccess, setPaySuccess] = useState('');
  const [paystackKey, setPaystackKey] = useState(
    import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_live_31edc9824f6209e93c2ec11b860d8899f6400db2'
  );
  const [priceGHS, setPriceGHS] = useState(null); // live fee from /access/public-config

  useEffect(() => {
    loadPaystackScript();
    API.get('/access/public-config')
      .then(({ data }) => {
        if (data.paystackPublicKey) setPaystackKey(data.paystackPublicKey);
        if (data.priceGHS !== undefined) setPriceGHS(data.priceGHS);
      })
      .catch(() => {});
  }, []);

  const handlePayAccess = async (e) => {
    e.preventDefault();
    setPayError('');

    if (!payerEmail.trim() || !payerEmail.includes('@')) {
      setPayError('Please enter a valid email address to receive your payment receipt & access.');
      return;
    }
    if (!payerName.trim()) {
      setPayError('Please enter your full name.');
      return;
    }

    setPaying(true);

    const scriptLoaded = await loadPaystackScript();
    if (!scriptLoaded || !window.PaystackPop) {
      setPayError('Could not initialize Paystack payment gateway. Please check your internet connection.');
      setPaying(false);
      return;
    }

    // Always charge the fee currently saved by the admin (fetched fresh, never a cached/default value)
    let currentPrice;
    try {
      const { data: liveCfg } = await API.get('/access/public-config', { params: { _: Date.now() } });
      currentPrice = Number(liveCfg.priceGHS);
      setPriceGHS(currentPrice);
      if (liveCfg.paymentEnabled === false) {
        setPayError('Online payment is currently paused by the administrator. Please try again later.');
        setPaying(false);
        return;
      }
    } catch {
      setPayError('Could not load the current access fee. Please check your connection and try again.');
      setPaying(false);
      return;
    }
    if (!Number.isFinite(currentPrice) || currentPrice <= 0) {
      setPayError('The access fee is not configured correctly. Please contact the administrator.');
      setPaying(false);
      return;
    }

    const reference = 'PQ_' + Date.now() + '_' + Math.floor(Math.random() * 10000);

    try {
      const handler = window.PaystackPop.setup({
        key: paystackKey,
        email: payerEmail.trim(),
        amount: Math.round(currentPrice * 100),
        currency: 'GHS',
        ref: reference,
        channels: ['card', 'mobile_money', 'bank', 'qr'],
        metadata: {
          custom_fields: [
            { display_name: 'Student / Customer Name', variable_name: 'customer_name', value: payerName.trim() },
            { display_name: 'Access Type', variable_name: 'access_type', value: 'Paid Past Questions & Solutions (1 year)' },
          ],
        },
        callback: function (response) {
          const verifiedRef = (response && response.reference) || reference;
          setPaySuccess('Payment received! Verifying transaction with Paystack…');

          (async function verifyPayment() {
            try {
              const verifyRes = await API.post('/access/paystack-verify', {
                reference: verifiedRef,
                email: payerEmail.trim(),
                name: payerName.trim(),
              });
              if (verifyRes.data.ok && verifyRes.data.token) {
                localStorage.setItem('accessToken', verifyRes.data.token);
                setPaySuccess(verifyRes.data.message || 'Payment verified! Access granted.');
                setTimeout(onGranted, 1000);
              } else {
                setPayError('Payment was processed but access could not be issued. Please contact Dr. Alhassan.');
              }
            } catch (vErr) {
              setPayError(
                vErr.response?.data?.message ||
                  vErr.response?.data?.error ||
                  'Transaction verification encountered an issue. Contact Dr. Alhassan Osman.'
              );
            } finally {
              setPaying(false);
            }
          })();
        },
        onClose: function () {
          setPaying(false);
        },
      });
      handler.openIframe();
    } catch (err) {
      setPayError('Paystack initialization error: ' + err.message);
      setPaying(false);
    }
  };

  const price = priceGHS ?? settings.nonUmatPrice ?? '…';

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className="mx-auto grid max-w-4xl gap-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-6 sm:p-8 shadow-xl shadow-slate-200/50 dark:shadow-none md:grid-cols-2"
    >
      <div>
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-blue-500/30 bg-blue-500/15 text-blue-600 dark:text-blue-400">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Unlock paid papers &amp; solutions</h2>
            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">For all students: UMaT and non-UMaT</p>
          </div>
        </div>

        <div className="mb-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-850 p-4 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">One-time fee · 1 year access</p>
          <p className="mt-0.5 text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
            GH₵ <span className="text-blue-600 dark:text-blue-400">{price}</span>
          </p>
          <p className="mt-1 text-xs text-slate-500">MTN MoMo, Telecel Cash, or Visa/Mastercard</p>
        </div>

        <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
          {[
            `${paidCount > 0 ? `All ${paidCount} paid paper${paidCount === 1 ? '' : 's'}` : 'Every paid paper'} plus worked solutions`,
            'New paid papers added during your year are included',
            'Free papers are included too',
            'Secured by the official Paystack Ghana gateway',
          ].map((t) => (
            <li key={t} className="flex items-center gap-2">
              <CheckCircle2 size={14} className="shrink-0 text-blue-500" /> {t}
            </li>
          ))}
        </ul>
      </div>

      <form onSubmit={handlePayAccess} className="flex flex-col justify-end space-y-3.5">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
            Full Name <span className="text-red-400">*</span>
          </label>
          <input value={payerName} onChange={(e) => setPayerName(e.target.value)} placeholder="e.g. Kwame Mensah" disabled={paying}
            className={`${inputCls} focus:border-blue-500 focus:ring-blue-500`} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
            Email Address <span className="text-red-400">*</span>
          </label>
          <input type="email" value={payerEmail} onChange={(e) => setPayerEmail(e.target.value)} placeholder="you@example.com" disabled={paying}
            className={`${inputCls} focus:border-blue-500 focus:ring-blue-500`} />
        </div>

        {payError && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-600 dark:text-red-400">{payError}</div>
        )}
        {paySuccess && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-600 dark:text-emerald-400">{paySuccess}</div>
        )}

        <button
          type="submit"
          disabled={paying}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 font-bold text-white shadow-lg shadow-blue-500/25 transition-all hover:bg-blue-500 disabled:opacity-50 cursor-pointer"
        >
          {paying ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
          {paying ? 'Processing Paystack Checkout…' : `Pay GH₵ ${price} with Paystack`}
        </button>
      </form>
    </motion.div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function PastQuestions() {
  const [session, setSession] = useState(null); // { type, identifier, covers: { free, paid } }
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [tab, setTab] = useState(() => {
    try {
      return localStorage.getItem('pqTab') === 'paid' ? 'paid' : 'free';
    } catch {
      return 'free';
    }
  });

  const chooseTab = (t) => {
    setTab(t);
    try {
      localStorage.setItem('pqTab', t);
    } catch {
      /* storage unavailable — tab just won't be remembered */
    }
  };

  // Re-check the stored pass and reload the catalogue (titles + per-paper `unlocked` from the server)
  const refresh = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    const token = localStorage.getItem('accessToken');
    try {
      if (token) {
        const { data } = await API.post('/access/verify-token', { token });
        if (data.valid) {
          setSession({ type: data.type, identifier: data.identifier, covers: data.covers || { free: false, paid: false } });
        } else {
          localStorage.removeItem('accessToken');
          setSession(null);
        }
      } else {
        setSession(null);
      }
      const { data: list } = await API.get('/past-questions');
      setPapers(Array.isArray(list) ? list : []);
    } catch (err) {
      setLoadError(err.response?.data?.error || 'Could not load past questions. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    refresh();
  };

  const freePapers = papers.filter((q) => q.access === 'free');
  const paidPapers = papers.filter((q) => q.access !== 'free');
  const covers = session?.covers || { free: false, paid: false };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-slate-200 dark:border-slate-800/80 px-4 py-16 sm:py-20">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-[350px] w-[650px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[140px]" />
        </div>
        <div className="relative mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs sm:text-sm font-semibold text-emerald-600 dark:text-emerald-400"
          >
            <BookOpen className="h-4 w-4" />
            Official Academic Past Questions &amp; Solutions
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1 }}
            className="mb-4 text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white"
          >
            Past Questions Portal
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.2 }}
            className="mx-auto max-w-2xl text-sm sm:text-base leading-relaxed text-slate-600 dark:text-slate-400"
          >
            Open the free past questions with a quick sign-up, or unlock the full collection of paid papers and
            worked solutions with a one-time payment.
          </motion.p>

          {session && (
            <div className="mt-6 inline-flex flex-wrap items-center justify-center gap-2">
              <span
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold ${
                  covers.paid
                    ? 'border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400'
                    : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                }`}
              >
                <ShieldCheck className="h-4 w-4" />
                {covers.paid ? 'Paid access' : 'Free access'}: {session.identifier}
              </span>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" /> Exit session
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Two options */}
      <section className="mx-auto max-w-5xl px-4 pt-10">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2" role="tablist" aria-label="Past question options">
          <OptionTab
            active={tab === 'free'}
            onClick={() => chooseTab('free')}
            tone="emerald"
            Icon={Gift}
            title="Access Free Past Questions"
            subtitle={covers.free ? 'Unlocked: download any free paper' : 'Quick sign-up, no payment'}
            badge={`${freePapers.length} free`}
          />
          <OptionTab
            active={tab === 'paid'}
            onClick={() => chooseTab('paid')}
            tone="blue"
            Icon={Sparkles}
            title="Paid Past Questions & Solutions"
            subtitle={covers.paid ? 'Unlocked: full collection for 1 year' : 'One payment unlocks every paid paper'}
            badge={`${paidPapers.length} paid`}
          />
        </div>
      </section>

      {/* Selected section */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24 text-slate-500">
            <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
            <p className="text-sm">Loading past questions…</p>
          </div>
        ) : loadError ? (
          <div className="mx-auto flex max-w-xl items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-400">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p>{loadError}</p>
              <button onClick={refresh} className="mt-2 text-xs font-semibold underline cursor-pointer">Try again</button>
            </div>
          </div>
        ) : (
          // Keyed fade-in only (no exit wait): switching tabs must never depend on an animation finishing
          <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
              {tab === 'free' ? (
                covers.free ? (
                  <PaperGrid papers={freePapers} tone="emerald" emptyText="No free papers have been published yet. Check back soon, or see the paid collection." />
                ) : (
                  <div className="space-y-10">
                    <FreeAccessForm freeCount={freePapers.length} onGranted={refresh} />
                    {freePapers.length > 0 && <PaperGrid papers={freePapers} tone="emerald" emptyText="" />}
                  </div>
                )
              ) : covers.paid ? (
                <PaperGrid papers={paidPapers} tone="blue" emptyText="No paid papers have been published yet. Your access will include them as soon as they are added." />
              ) : (
                <div className="space-y-10">
                  <PaidAccessCard paidCount={paidPapers.length} onGranted={refresh} />
                  {paidPapers.length > 0 && (
                    <div>
                      <p className="mb-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Included in paid access
                      </p>
                      <PaperGrid papers={paidPapers} tone="blue" emptyText="" />
                    </div>
                  )}
                </div>
              )}
          </motion.div>
        )}
      </section>
    </div>
  );
}
