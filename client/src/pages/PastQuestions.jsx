import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  GraduationCap,
  CreditCard,
  ShieldCheck,
  Download,
  Loader2,
  FileQuestion,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Filter,
  Mail,
  HelpCircle,
  ExternalLink,
  Lock,
  Sparkles,
  User,
} from 'lucide-react';
import API from '../lib/api';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import CongratulatorySurveyModal from '../components/CongratulatorySurveyModal';

// ─── Animation variants ────────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
};

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

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

// ─── Access Gate ──────────────────────────────────────────────────────────────
function AccessGate({ onAccessGranted }) {
  const { settings } = useSettings();
  const toast = useToast();

  // UMaT Student Verification States
  const [identifier, setIdentifier] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');

  // Non-UMaT Paid Access States (Paystack)
  const [payerEmail, setPayerEmail] = useState('');
  const [payerName, setPayerName] = useState('');
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState('');
  const [paySuccess, setPaySuccess] = useState('');
  const [paystackKey, setPaystackKey] = useState(
    import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_live_31edc9824f6209e93c2ec11b860d8899f6400db2'
  );
  const [priceGHS, setPriceGHS] = useState(20);
  const [paymentEnabled, setPaymentEnabled] = useState(true);

  // Congratulatory modal state for UMaT students
  const [modalOpen, setModalOpen] = useState(false);
  const [verifiedTokenData, setVerifiedTokenData] = useState(null);

  // Load public config & Paystack SDK
  useEffect(() => {
    loadPaystackScript();
    API.get('/access/public-config')
      .then(({ data }) => {
        if (data.paystackPublicKey) setPaystackKey(data.paystackPublicKey);
        if (data.priceGHS !== undefined) setPriceGHS(data.priceGHS);
        if (data.paymentEnabled !== undefined) setPaymentEnabled(data.paymentEnabled);
      })
      .catch(() => {});
  }, []);

  /* ── 1. Handle UMaT Student Verification ── */
  const handleStudentVerify = async (e) => {
    e.preventDefault();
    if (!identifier.trim()) return;
    setVerifying(true);
    setError('');
    try {
      const { data } = await API.post('/access/verify-student', { identifier: identifier.trim() });
      const token = data.token || data.accessToken;
      if (token) {
        localStorage.setItem('accessToken', token);
        setVerifiedTokenData({
          type: 'student',
          token,
          identifier: data.identifier || identifier.trim(),
          detectedLabel: data.detectedLabel || 'UMaT Student Credentials',
        });
        toast.success(`Identity verified! Complimentary access unlocked.`);
        setModalOpen(true);
      } else {
        const errMsg = 'Verification succeeded but no session token was returned. Please try again.';
        setError(errMsg);
        toast.error(errMsg);
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Verification failed. Please check your credentials or contact Dr. Alhassan Osman.';
      setError(msg);
      toast.error(msg, 'Verification Failed');
    } finally {
      setVerifying(false);
    }
  };

  const handleModalClose = () => {
    setModalOpen(false);
    if (verifiedTokenData) {
      onAccessGranted(verifiedTokenData);
    }
  };

  /* ── 2. Handle Live Paystack Payment ── */
  const handlePayAccess = async (e) => {
    e.preventDefault();
    setPayError('');

    if (!payerEmail.trim() || !payerEmail.includes('@')) {
      setPayError('Please enter a valid email address to receive your payment receipt & access token.');
      return;
    }

    setPaying(true);

    const scriptLoaded = await loadPaystackScript();
    if (!scriptLoaded || !window.PaystackPop) {
      setPayError('Could not initialize Paystack payment gateway. Please check your internet connection.');
      setPaying(false);
      return;
    }

    const currentPrice = settings.nonUmatPrice ? Number(settings.nonUmatPrice) : priceGHS || 20;
    const amountInPesewas = Math.round(currentPrice * 100);
    const reference = 'PQ_' + Date.now() + '_' + Math.floor(Math.random() * 10000);

    try {
      const handler = window.PaystackPop.setup({
        key: paystackKey,
        email: payerEmail.trim(),
        amount: amountInPesewas,
        currency: 'GHS',
        ref: reference,
        channels: ['card', 'mobile_money', 'bank', 'qr'],
        metadata: {
          custom_fields: [
            {
              display_name: 'Student / Customer Name',
              variable_name: 'customer_name',
              value: payerName.trim() || 'Non-UMaT Visitor',
            },
            {
              display_name: 'Access Type',
              variable_name: 'access_type',
              value: 'Past Examination Questions Full Portal Access',
            },
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

                setTimeout(() => {
                  onAccessGranted({
                    type: 'paid',
                    token: verifyRes.data.token,
                    identifier: payerEmail.trim(),
                    payment: verifyRes.data.payment,
                  });
                }, 1200);
              } else {
                setPayError('Payment was processed but token issuance failed. Please contact Dr. Alhassan.');
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col transition-colors">
      {/* Hero */}
      <section className="relative py-20 px-4 overflow-hidden border-b border-slate-200 dark:border-slate-800/80">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[650px] h-[350px] bg-emerald-500/10 rounded-full blur-[140px]" />
        </div>
        <div className="relative max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm font-semibold px-4 py-1.5 rounded-full mb-6"
          >
            <BookOpen className="w-4 h-4" />
            Official Academic Past Questions &amp; Solutions
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-4 tracking-tight text-slate-900 dark:text-white"
          >
            Past Questions Portal
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.2 }}
            className="text-slate-600 dark:text-slate-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed"
          >
            Access official semester examination papers, section walkthroughs, and solutions.
            Verify your UMaT student credentials for free access, or unlock complete access via Paystack.
          </motion.p>
        </div>
      </section>

      {/* Gate cards */}
      <section className="flex-1 max-w-5xl mx-auto w-full px-4 py-12">
        <div className="grid md:grid-cols-2 gap-8 items-stretch">
          {/* ── Option A: UMAT Student card ── */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-xl shadow-slate-200/50 dark:shadow-none hover:border-emerald-500/40 transition-all duration-300"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-slate-900 dark:text-white font-bold text-lg">UMaT Students</h2>
                    <p className="text-emerald-600 dark:text-emerald-400 text-xs font-semibold">100% Free Access</p>
                  </div>
                </div>
                <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  Verified Free
                </span>
              </div>

              <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm leading-relaxed mb-6">
                Active UMaT engineering students have full complimentary access to all course past questions and marking guides.
              </p>

              {/* Supported ID formats hint */}
              <div className="rounded-2xl bg-slate-100 dark:bg-slate-850 p-4 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 mb-6 space-y-1.5">
                <p className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-emerald-500" /> Acceptable Verification Formats:
                </p>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-500 dark:text-slate-400 pl-1">
                  <li><strong>Student Email:</strong> ending in <code className="text-emerald-600 dark:text-emerald-400 font-mono">@st.umat.edu.gh</code></li>
                  <li><strong>10-Digit ID / Ref:</strong> e.g. <code className="text-emerald-600 dark:text-emerald-400 font-mono">4100813923</code></li>
                  <li><strong>Department Index:</strong> e.g. <code className="text-emerald-600 dark:text-emerald-400 font-mono">FCM4100813923</code> or <code className="text-emerald-600 dark:text-emerald-400 font-mono">FCM.41.008.139.23</code></li>
                </ul>
              </div>
            </div>

            <form onSubmit={handleStudentVerify} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Enter UMaT Email, Student ID, or Index Number
                </label>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="e.g. 4100813923 or FCM4100813923"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                  disabled={verifying}
                />
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-600 dark:text-red-400"
                  >
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold">Verification Unsuccessful</p>
                        <p className="mt-0.5 text-[11px] leading-relaxed">{error}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="submit"
                disabled={verifying || !identifier.trim()}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold py-3.5 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
              >
                {verifying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Credentials…</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verify &amp; Unlock Free Access</span>
                  </>
                )}
              </button>
            </form>
          </motion.div>

          {/* ── Option B: Non-UMAT / Paid card (Live Paystack) ── */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-xl shadow-slate-200/50 dark:shadow-none hover:border-blue-500/40 transition-all duration-300"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-slate-900 dark:text-white font-bold text-lg">External / Non-UMaT</h2>
                    <p className="text-blue-600 dark:text-blue-400 text-xs font-semibold">Instant Paystack Access</p>
                  </div>
                </div>
                <span className="rounded-full bg-blue-500/10 border border-blue-500/30 px-3 py-1 text-xs font-bold text-blue-600 dark:text-blue-400 font-mono">
                  MoMo &amp; Cards
                </span>
              </div>

              <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm leading-relaxed mb-4">
                Not a UMaT student? Unlock all past question PDFs, worked exam solutions, and future updates with a secure one-time payment.
              </p>

              {/* Price Display */}
              <div className="bg-slate-100 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-center mb-5">
                <p className="text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wider font-semibold">
                  Full 1-Year Access Fee
                </p>
                <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                  GH₵ <span className="text-blue-600 dark:text-blue-400">{settings.nonUmatPrice || priceGHS || '20'}</span>
                </p>
                <p className="text-slate-500 text-xs mt-1">Instant unlock via MTN MoMo, Telecel Cash, or Visa/Mastercard</p>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 mb-6">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-blue-500 shrink-0" />
                  <span>Immediate access to all course examination papers</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-blue-500 shrink-0" />
                  <span>Direct PDF downloads with no restrictions</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-blue-500 shrink-0" />
                  <span>Secured by Paystack Official Ghana Gateway</span>
                </div>
              </div>
            </div>

            <form onSubmit={handlePayAccess} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Your Email Address <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  value={payerEmail}
                  onChange={(e) => setPayerEmail(e.target.value)}
                  placeholder="student@example.com"
                  required
                  disabled={paying}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Your Full Name <span className="text-slate-400 text-[11px]">(optional)</span>
                </label>
                <input
                  type="text"
                  value={payerName}
                  onChange={(e) => setPayerName(e.target.value)}
                  placeholder="e.g. Kwame Mensah"
                  disabled={paying}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                />
              </div>

              {payError && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-600 dark:text-red-400">
                  {payError}
                </div>
              )}
              {paySuccess && (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-600 dark:text-emerald-400">
                  {paySuccess}
                </div>
              )}

              <button
                type="submit"
                disabled={paying}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-3.5 shadow-lg shadow-blue-500/25 transition-all cursor-pointer"
              >
                {paying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing Paystack Checkout…</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    <span>Pay GH₵ {settings.nonUmatPrice || priceGHS || '20'} with Paystack</span>
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      </section>

      {/* Congratulatory Modal for UMaT students */}
      <CongratulatorySurveyModal
        isOpen={modalOpen}
        studentIdentifier={verifiedTokenData?.identifier}
        detectedLabel={verifiedTokenData?.detectedLabel}
        onClose={handleModalClose}
      />
    </div>
  );
}

// ─── Resources View ────────────────────────────────────────────────────────────
function ResourcesView({ accessInfo, onLogout }) {
  const [questions, setQuestions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [activeSubject, setActiveSubject] = useState('All');
  const [loading, setLoading] = useState(true);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const params = activeSubject !== 'All' ? { subject: activeSubject } : {};
      const { data } = await API.get('/past-questions', { params });
      const list = Array.isArray(data) ? data : data.questions ?? data.pastQuestions ?? [];
      setQuestions(list);

      if (subjects.length === 0) {
        const uniqueSubjects = [...new Set(list.map((q) => q.subject).filter(Boolean))];
        setSubjects(uniqueSubjects);
      }
    } catch (err) {
      console.error('Failed to fetch past questions:', err);
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  }, [activeSubject]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const handleDownload = (question) => {
    const token = localStorage.getItem('accessToken');
    const apiBase = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api');
    const url = `${apiBase}/past-questions/${question._id || question.id}/download${token ? `?token=${token}` : ''}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const allSubjects = ['All', ...subjects];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors">
      {/* Hero */}
      <section className="relative py-20 px-4 overflow-hidden border-b border-slate-200 dark:border-slate-800/80">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-emerald-500/10 rounded-full blur-[140px]" />
        </div>
        <div className="relative max-w-4xl mx-auto text-center">
          {/* Access badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className={`inline-flex items-center gap-2 text-xs sm:text-sm font-semibold px-4 py-1.5 rounded-full border mb-5 ${
              accessInfo?.type === 'student'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                : 'bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>
              {accessInfo?.type === 'student'
                ? `UMaT Student Access: ${accessInfo?.identifier || 'Verified'}`
                : `Paid Access: ${accessInfo?.identifier || 'Paystack Verified'}`}
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1 }}
            className="text-4xl sm:text-5xl font-extrabold mb-4 tracking-tight text-slate-900 dark:text-white"
          >
            Examination Resource Archive
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.2 }}
            className="text-slate-600 dark:text-slate-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed mb-6"
          >
            Download past examination question PDFs and worked solution walkthroughs.
          </motion.p>

          {/* Logout button */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            onClick={onLogout}
            className="inline-flex items-center gap-2 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs font-semibold px-4 py-2 rounded-full transition-all shadow-sm cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Exit Session</span>
          </motion.button>
        </div>
      </section>

      {/* Subject filter */}
      {allSubjects.length > 1 && (
        <section className="sticky top-16 sm:top-20 z-20 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
              {allSubjects.map((sub) => (
                <button
                  key={sub}
                  onClick={() => setActiveSubject(sub)}
                  className={`flex-shrink-0 text-xs sm:text-sm font-semibold px-4 py-2 rounded-xl border transition-all cursor-pointer ${
                    activeSubject === sub
                      ? 'bg-emerald-500 border-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-emerald-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Resources grid */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="spinner"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-32 gap-4 text-slate-500"
            >
              <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
              <p className="text-sm">Loading past questions…</p>
            </motion.div>
          ) : questions.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-28 gap-4 text-slate-500 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-8 text-center"
            >
              <FileQuestion className="w-14 h-14 text-slate-400" />
              <p className="text-base font-bold text-slate-700 dark:text-slate-300">No past questions found</p>
              <p className="text-xs text-slate-500 max-w-sm">
                {activeSubject !== 'All'
                  ? `No questions uploaded for "${activeSubject}" yet.`
                  : 'No past question papers have been uploaded yet.'}
              </p>
              {activeSubject !== 'All' && (
                <button
                  onClick={() => setActiveSubject('All')}
                  className="mt-2 text-emerald-600 dark:text-emerald-400 hover:underline text-xs font-semibold"
                >
                  View all subjects
                </button>
              )}
            </motion.div>
          ) : (
            <motion.div
              key={activeSubject}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {questions.map((q) => (
                <motion.div
                  key={q._id || q.id}
                  variants={cardVariants}
                  className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-6 flex flex-col justify-between shadow-lg shadow-slate-200/50 dark:shadow-none hover:border-emerald-500/40 transition-all group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        {q.subject || 'Engineering'}
                      </span>
                      {q.year && (
                        <span className="text-xs font-mono text-slate-500 dark:text-slate-400 font-semibold">
                          {q.year}
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base leading-snug group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {q.title}
                    </h3>
                    {q.description && (
                      <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
                        {q.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      PDF Document
                    </span>
                    <button
                      onClick={() => handleDownload(q)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3.5 py-2 text-xs transition-colors shadow-md shadow-emerald-500/20 cursor-pointer"
                    >
                      <Download size={13} />
                      <span>Download PDF</span>
                    </button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
}

// ─── Main PastQuestions Page Component ─────────────────────────────────────────
export default function PastQuestions() {
  const [accessInfo, setAccessInfo] = useState(null);
  const [checking, setChecking] = useState(true);

  // Check stored token on initial render
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setChecking(false);
      return;
    }

    API.post('/access/verify-token', { token })
      .then(({ data }) => {
        if (data.valid) {
          setAccessInfo({ type: data.type, token, identifier: data.identifier });
        } else {
          localStorage.removeItem('accessToken');
        }
      })
      .catch(() => {
        localStorage.removeItem('accessToken');
      })
      .finally(() => setChecking(false));
  }, []);

  const handleAccessGranted = (info) => {
    setAccessInfo(info);
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    setAccessInfo(null);
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-3 text-emerald-500">
        <Loader2 className="w-10 h-10 animate-spin" />
        <span className="text-xs font-mono text-slate-400">Verifying session…</span>
      </div>
    );
  }

  return accessInfo ? (
    <ResourcesView accessInfo={accessInfo} onLogout={handleLogout} />
  ) : (
    <AccessGate onAccessGranted={handleAccessGranted} />
  );
}
