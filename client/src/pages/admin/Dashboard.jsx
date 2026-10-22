import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Eye,
  TrendingUp,
  FileQuestion,
  Video,
  Briefcase,
  PlusCircle,
  Upload,
  Calendar,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  Globe2,
  Trash2,
  Loader2,
  Sliders,
  MessageSquareQuote,
  GraduationCap,
  MessageCircle,
  CalendarCheck,
  Mail,
  Phone,
  Clock,
  Check,
  CheckCircle2,
  Inbox,
  CreditCard,
  DollarSign,
  Smartphone,
  Monitor,
  Tablet,
  ExternalLink,
  Activity,
  Save,
  AlertCircle,
  Settings,
} from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import API from '../../lib/api';
import { useSettings } from '../../context/SettingsContext';
import { useToast } from '../../context/ToastContext';

export default function Dashboard() {
  const navigate = useNavigate();
  const toast = useToast();
  const { refreshSettings } = useSettings();

  const [summary, setSummary] = useState(null);
  const [paymentsData, setPaymentsData] = useState({ payments: [], totalRevenue: 0, totalCount: 0 });
  const [paymentConfig, setPaymentConfig] = useState({ priceGHS: 20, paymentEnabled: true });
  const [priceInput, setPriceInput] = useState('20');
  const [paymentEnabledInput, setPaymentEnabledInput] = useState(true);
  const [savingPaymentConfig, setSavingPaymentConfig] = useState(false);
  const [paymentConfigMsg, setPaymentConfigMsg] = useState(null);
  const [recentVideos, setRecentVideos] = useState([]);
  const [studentFeedback, setStudentFeedback] = useState([]);
  const [contactSubmissions, setContactSubmissions] = useState([]);
  const [contactFilter, setContactFilter] = useState('all');
  const [updatingContactId, setUpdatingContactId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [analyticsRes, paymentsRes, videosRes, feedbackRes, contactRes, paymentConfigRes] = await Promise.allSettled([
        API.get('/analytics/summary'),
        API.get('/access/payments'),
        API.get('/videos'),
        API.get('/access/feedback'),
        API.get('/contact'),
        API.get('/access/payment-config'),
      ]);

      if (analyticsRes.status === 'fulfilled') {
        setSummary(analyticsRes.value.data);
      }

      if (paymentsRes.status === 'fulfilled') {
        setPaymentsData(paymentsRes.value.data || { payments: [], totalRevenue: 0, totalCount: 0 });
      }

      if (paymentConfigRes.status === 'fulfilled') {
        const pcfg = paymentConfigRes.value.data;
        if (pcfg) {
          setPaymentConfig(pcfg);
          setPriceInput(String(pcfg.priceGHS ?? 20));
          setPaymentEnabledInput(pcfg.paymentEnabled ?? true);
        }
      }

      if (videosRes.status === 'fulfilled') {
        const list = Array.isArray(videosRes.value.data)
          ? videosRes.value.data
          : videosRes.value.data?.data ?? [];
        setRecentVideos(list.slice(0, 5));
      }

      if (feedbackRes.status === 'fulfilled') {
        const fbList = Array.isArray(feedbackRes.value.data)
          ? feedbackRes.value.data
          : [];
        setStudentFeedback(fbList);
      }

      if (contactRes.status === 'fulfilled') {
        const cList = Array.isArray(contactRes.value.data)
          ? contactRes.value.data
          : [];
        setContactSubmissions(cList);
      }
    } catch {
      setError('Failed to load analytics dashboard data.');
      toast.error('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const handleUpdatePaymentConfig = async (e, customPrice = null, customEnabled = null) => {
    if (e && e.preventDefault) e.preventDefault();
    const targetPrice = customPrice !== null ? customPrice : parseFloat(priceInput);
    const targetEnabled = customEnabled !== null ? customEnabled : paymentEnabledInput;

    if (isNaN(targetPrice) || targetPrice < 0) {
      setPaymentConfigMsg({ type: 'error', text: 'Please enter a valid amount (e.g. 20).' });
      toast.error('Please enter a valid price in GHS.');
      return;
    }

    setSavingPaymentConfig(true);
    setPaymentConfigMsg(null);
    try {
      const { data } = await API.put('/access/payment-config', {
        priceGHS: targetPrice,
        paymentEnabled: targetEnabled,
      });

      setPaymentConfig({
        priceGHS: data.priceGHS,
        paymentEnabled: data.paymentEnabled,
      });
      setPriceInput(String(data.priceGHS));
      setPaymentEnabledInput(data.paymentEnabled);
      const msg = `Fee successfully updated to GH₵ ${data.priceGHS.toFixed(2)}${!data.paymentEnabled ? ' (Gate Paused)' : ''}!`;
      setPaymentConfigMsg({
        type: 'success',
        text: msg,
      });
      toast.success(msg);
      refreshSettings();
      setTimeout(() => setPaymentConfigMsg(null), 4000);
    } catch (err) {
      const msg = err?.response?.data?.error || 'Failed to update payment fee. Please try again.';
      setPaymentConfigMsg({
        type: 'error',
        text: msg,
      });
      toast.error(msg);
    } finally {
      setSavingPaymentConfig(false);
    }
  };

  const handleUpdateContactStatus = async (id, newStatus) => {
    setUpdatingContactId(id);
    try {
      await API.patch(`/contact/${id}/status`, { status: newStatus });
      setContactSubmissions((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c))
      );
      toast.success(`Submission marked as ${newStatus}!`);
    } catch {
      toast.error('Failed to update status.');
    } finally {
      setUpdatingContactId(null);
    }
  };

  const handleDeleteContact = async (id) => {
    if (!window.confirm('Are you sure you want to delete this submission?')) return;
    try {
      await API.delete(`/contact/${id}`);
      setContactSubmissions((prev) => prev.filter((c) => c.id !== id));
      toast.success('Inquiry record deleted.');
    } catch {
      toast.error('Failed to delete submission.');
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const maxViewsInWeek = Math.max(
    ...(summary?.last7Days?.map((d) => d.views) ?? [1]),
    1
  );

  const deviceTotal = summary?.deviceStats?.total || 1;
  const mobilePct = Math.round(((summary?.deviceStats?.mobile || 0) / deviceTotal) * 100);
  const desktopPct = Math.round(((summary?.deviceStats?.desktop || 0) / deviceTotal) * 100);
  const tabletPct = Math.round(((summary?.deviceStats?.tablet || 0) / deviceTotal) * 100);

  return (
    <AdminLayout>
      {/* ── Top Header ── */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-2">
            <Sparkles size={13} />
            Live Intelligence &amp; Revenue Analytics
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
            Analytics &amp; Site Overview
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Real-time tracking of visitor traffic, Paystack revenues, student verifications, and resource access.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/settings')}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:border-emerald-500/40 hover:text-emerald-600 dark:hover:text-white transition-all shadow-sm cursor-pointer"
          >
            <Sliders size={15} />
            <span>Edit Site Info</span>
          </button>
          <button
            onClick={() => navigate('/admin/videos')}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-950 shadow-md shadow-emerald-500/20 hover:bg-emerald-400 transition-all cursor-pointer"
          >
            <PlusCircle size={15} />
            <span>Add Video</span>
          </button>
        </div>
      </div>

      {/* ── Metric Cards (5 Cards) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {/* Total Pageviews */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-5 backdrop-blur-sm shadow-sm dark:shadow-lg">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Pageviews</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <Eye size={16} />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            {loading ? '…' : summary?.totalViews ?? 0}
          </p>
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">+{summary?.todayViews ?? 0}</span>
            <span>today</span>
          </p>
        </div>

        {/* Unique Visitors */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-5 backdrop-blur-sm shadow-sm dark:shadow-lg">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Unique Visitors</span>
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
              <Users size={16} />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            {loading ? '…' : summary?.uniqueVisitors ?? 0}
          </p>
          <p className="mt-1.5 text-xs text-slate-500">Unique IP signatures</p>
        </div>

        {/* Total Paystack Revenue */}
        <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-amber-500/5 dark:via-slate-900/90 to-white dark:to-slate-900 p-5 backdrop-blur-sm shadow-sm dark:shadow-lg">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">Revenue (Paystack)</span>
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30">
              <DollarSign size={16} />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-300">
            GH₵ {loading ? '…' : (paymentsData?.totalRevenue ?? summary?.paymentStats?.totalRevenue ?? 0).toFixed(2)}
          </p>
          <div className="mt-1.5 flex items-center justify-between text-xs">
            <span className="text-amber-800 dark:text-amber-200/80 font-medium">
              {paymentsData?.totalCount ?? summary?.paymentStats?.totalPaidCount ?? 0} paid accesses
            </span>
            <a
              href="#payment-settings"
              className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              Fee: GH₵ {paymentConfig?.priceGHS ?? 20} · Edit ↓
            </a>
          </div>
        </div>

        {/* Video Lectures */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-5 backdrop-blur-sm shadow-sm dark:shadow-lg">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Lectures</span>
            <div className="p-2 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
              <Video size={16} />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            {loading ? '…' : summary?.contentCounts?.videos ?? 0}
          </p>
          <p className="mt-1.5 text-xs text-slate-500">Synced from YouTube</p>
        </div>

        {/* Past Questions */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-5 backdrop-blur-sm shadow-sm dark:shadow-lg">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Past Questions</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
              <FileQuestion size={16} />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            {loading ? '…' : summary?.contentCounts?.pastQuestions ?? 0}
          </p>
          <p className="mt-1.5 text-xs text-slate-500">Available to download</p>
        </div>
      </div>

      {/* ── Mid Section: Weekly Traffic Chart & Top Pages ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Weekly Traffic Bar Visualizer */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm dark:shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <TrendingUp size={18} className="text-emerald-500" />
                Visitor Traffic (Last 7 Days)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Daily volume of visits across your portfolio, lectures, and resources.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="h-48 flex items-center justify-center text-slate-500">
              <Loader2 className="animate-spin text-emerald-500" size={22} />
            </div>
          ) : !summary?.last7Days || summary.last7Days.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-center text-slate-500 border border-dashed border-slate-300 dark:border-slate-800 rounded-xl p-4">
              <Globe2 size={28} className="mb-2 text-slate-400 dark:text-slate-600" />
              <p className="text-xs">No traffic data recorded in the last 7 days yet.</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Visits are automatically logged as users browse.</p>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              <div className="flex items-end justify-between gap-3 h-44 px-2">
                {summary.last7Days.map((d) => {
                  const pct = Math.max(Math.round((d.views / maxViewsInWeek) * 100), 8);
                  return (
                    <div key={d.day} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                      <span className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        {d.views}
                      </span>
                      <div
                        style={{ height: `${pct}%` }}
                        className="w-full max-w-[42px] rounded-t-lg bg-gradient-to-t from-emerald-600 to-emerald-400 group-hover:brightness-110 transition-all shadow-md shadow-emerald-500/10"
                      />
                      <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {new Date(d.day).toLocaleDateString(undefined, { weekday: 'short' })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Most Visited Pages & Device Breakdown */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col shadow-sm dark:shadow-xl">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-1">
            <Globe2 size={18} className="text-sky-500" />
            Top Visited Pages
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Breakdown of popular URLs.</p>

          <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[170px] mb-4">
            {loading ? (
              <div className="py-8 flex justify-center text-slate-500">
                <Loader2 className="animate-spin text-emerald-500" size={20} />
              </div>
            ) : !summary?.topPages || summary.topPages.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-500">
                No page visits recorded yet.
              </p>
            ) : (
              summary.topPages.slice(0, 5).map((page, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs"
                >
                  <span className="font-mono text-slate-700 dark:text-slate-200 truncate max-w-[130px]">
                    {page.path === '/' ? 'Home (/)' : page.path}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{page.views} views</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Device Breakdown */}
          <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between mb-2">
              <span>Device Types</span>
              <span className="text-[11px] font-normal text-slate-500">Mobile vs Desktop</span>
            </p>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 flex overflow-hidden">
              <div style={{ width: `${desktopPct}%` }} className="bg-sky-500 h-full" title={`Desktop: ${desktopPct}%`} />
              <div style={{ width: `${mobilePct}%` }} className="bg-emerald-500 h-full" title={`Mobile: ${mobilePct}%`} />
              <div style={{ width: `${tabletPct}%` }} className="bg-purple-500 h-full" title={`Tablet: ${tabletPct}%`} />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-2">
              <span className="flex items-center gap-1">
                <Monitor size={11} className="text-sky-500" /> Desktop {desktopPct}%
              </span>
              <span className="flex items-center gap-1">
                <Smartphone size={11} className="text-emerald-500" /> Mobile {mobilePct}%
              </span>
              {tabletPct > 0 && (
                <span className="flex items-center gap-1">
                  <Tablet size={11} className="text-purple-500" /> Tablet {tabletPct}%
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Payment & Access Fee Configuration (Admin Setting) ── */}
      <div id="payment-settings" className="rounded-2xl border border-emerald-500/40 bg-gradient-to-br from-emerald-500/5 via-white dark:via-slate-900 to-emerald-950/10 dark:to-emerald-950/20 p-6 sm:p-7 shadow-sm dark:shadow-xl mb-8 scroll-mt-24">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                <DollarSign size={20} />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                Past Questions Payment &amp; Access Fee Control
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
              Set or update the one-time access fee charged to Non-UMaT students to unlock exam papers, PDF solutions, and marking guides. Updates apply immediately to the Paystack checkout.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-400 font-mono">
              Current Live Fee: GH₵ {Number(paymentConfig.priceGHS || 20).toFixed(2)}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${
                paymentConfig.paymentEnabled
                  ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                  : 'border-amber-500/30 bg-amber-500/15 text-amber-700 dark:text-amber-300'
              }`}
            >
              {paymentConfig.paymentEnabled ? '● Gateway Active' : '⏸ Gateway Paused'}
            </span>
          </div>
        </div>

        {/* Message Alert */}
        {paymentConfigMsg && (
          <div
            className={`mt-5 flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${
              paymentConfigMsg.type === 'success'
                ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-800 dark:text-emerald-300'
                : 'border-red-500/40 bg-red-500/15 text-red-800 dark:text-red-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {paymentConfigMsg.type === 'success' ? (
                <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle size={16} className="text-red-600 dark:text-red-400 shrink-0" />
              )}
              <span className="font-medium text-xs sm:text-sm">{paymentConfigMsg.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setPaymentConfigMsg(null)}
              className="text-slate-500 hover:text-slate-800 dark:hover:text-white text-xs cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Form controls */}
        <form onSubmit={handleUpdatePaymentConfig} className="mt-6 space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-end">
            {/* Amount input */}
            <div className="lg:col-span-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                New Access Fee (GH₵)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                  GH₵
                </span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={priceInput}
                  onChange={(e) => setPriceInput(e.target.value)}
                  placeholder="20"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/90 pl-14 pr-4 py-3 text-base font-mono font-bold text-emerald-600 dark:text-emerald-400 placeholder-slate-400 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition shadow-sm"
                />
              </div>
            </div>

            {/* Quick Presets */}
            <div className="lg:col-span-5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Quick Fee Presets
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {[10, 15, 20, 25, 30, 50].map((preset) => {
                  const isCurrent = Number(priceInput) === preset;
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setPriceInput(String(preset))}
                      className={`px-3 py-2 rounded-xl text-xs font-mono font-semibold transition border cursor-pointer ${
                        isCurrent
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600'
                      }`}
                    >
                      GH₵ {preset}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Save Button */}
            <div className="lg:col-span-3 flex justify-start lg:justify-end">
              <button
                type="submit"
                disabled={savingPaymentConfig}
                className="w-full lg:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold px-6 py-3 text-sm shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
              >
                {savingPaymentConfig ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Updating Fee…</span>
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    <span>Update Payment Fee</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Gateway Status & Paystack Live Notice */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400">
            <label className="flex items-center gap-2.5 cursor-pointer text-slate-700 dark:text-slate-300 font-medium">
              <input
                type="checkbox"
                checked={paymentEnabledInput}
                onChange={(e) => setPaymentEnabledInput(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-emerald-500 focus:ring-emerald-500 bg-white dark:bg-slate-800 cursor-pointer"
              />
              <span>Collect payments via Paystack (Uncheck to temporarily pause paid access)</span>
            </label>

            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
              Live Paystack Key: ••••••••••••60db2
            </span>
          </div>
        </form>
      </div>

      {/* ── Paystack Payments & Transactions Ledger ── */}
      <div className="rounded-2xl border border-amber-500/30 bg-white dark:bg-slate-900 overflow-hidden mb-8 shadow-sm dark:shadow-xl">
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-amber-500/[0.04] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <CreditCard size={18} className="text-amber-500" />
                Paystack Payments &amp; Revenue Transactions
              </h2>
              <span className="rounded-full bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
                {paymentsData?.totalCount ?? 0} Completed
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Official audit log of all Non-UMaT students and external visitors who paid for past questions access.
            </p>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs text-slate-500 dark:text-slate-400 block">Total Revenue Recorded</span>
            <span className="text-lg font-bold text-amber-600 dark:text-amber-400 font-mono">
              GH₵ {(paymentsData?.totalRevenue ?? 0).toFixed(2)}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center text-slate-500">
            <Loader2 className="animate-spin text-amber-500" size={20} />
          </div>
        ) : !paymentsData?.payments || paymentsData.payments.length === 0 ? (
          <div className="px-6 py-12 text-center text-slate-500">
            <CreditCard size={32} className="mx-auto mb-2 text-slate-400 dark:text-slate-600" />
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400">No Paystack transactions recorded yet.</p>
            <p className="text-[11px] text-slate-400 dark:text-slate-600 mt-0.5">
              When external visitors pay the access fee on the Past Questions page, transactions will automatically appear here in real-time.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-3">Reference</th>
                  <th className="px-6 py-3">Student / Payer</th>
                  <th className="px-6 py-3">Amount</th>
                  <th className="px-6 py-3">Channel</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Date &amp; Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {paymentsData.payments.map((p) => (
                  <tr key={p.id || p.reference} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-3 font-mono font-medium text-amber-600 dark:text-amber-300">
                      {p.reference}
                    </td>
                    <td className="px-6 py-3">
                      <div className="font-medium text-slate-900 dark:text-slate-200">{p.customer_name || 'Guest Student'}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{p.email}</div>
                    </td>
                    <td className="px-6 py-3 font-bold text-slate-900 dark:text-white font-mono">
                      GH₵ {Number(p.amount).toFixed(2)}
                    </td>
                    <td className="px-6 py-3 text-slate-500 uppercase text-[11px]">
                      {p.channel || 'Paystack'}
                    </td>
                    <td className="px-6 py-3">
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                        <Check size={11} className="stroke-[3]" />
                        Success
                      </span>
                    </td>
                    <td className="px-6 py-3 text-slate-500">
                      {new Date(p.paid_at).toLocaleString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Inquiries & Office Hour Bookings Section ── */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden mb-8 shadow-sm dark:shadow-xl">
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Inbox size={18} className="text-emerald-500" />
                Inquiries &amp; Office Hour Bookings
              </h2>
              <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                {contactSubmissions.length} total
              </span>
              {contactSubmissions.some((c) => c.status === 'pending') && (
                <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
                  {contactSubmissions.filter((c) => c.status === 'pending').length} pending
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Messages and consultation appointments submitted through your website and &ldquo;Book Me&rdquo; portal.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs">
            <button
              onClick={() => setContactFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                contactFilter === 'all'
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All ({contactSubmissions.length})
            </button>
            <button
              onClick={() => setContactFilter('booking')}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                contactFilter === 'booking'
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Bookings ({contactSubmissions.filter((c) => c.type === 'booking').length})
            </button>
            <button
              onClick={() => setContactFilter('inquiry')}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                contactFilter === 'inquiry'
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Messages ({contactSubmissions.filter((c) => c.type === 'inquiry').length})
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center text-slate-500">
            <Loader2 className="animate-spin text-emerald-500" size={20} />
          </div>
        ) : contactSubmissions.length === 0 ? (
          <div className="px-6 py-12 text-center text-slate-500">
            <Mail size={32} className="mx-auto mb-2 text-slate-400 dark:text-slate-600" />
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400">No submissions received yet.</p>
            <p className="text-[11px] text-slate-400 dark:text-slate-600 mt-0.5">
              When students or colleagues submit messages or book office hours on the Contact page, they will show up here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {contactSubmissions
              .filter((c) => contactFilter === 'all' || c.type === contactFilter)
              .map((c) => {
                const isBooking = c.type === 'booking';
                return (
                  <div key={c.id} className="p-5 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                              isBooking
                                ? 'bg-purple-500/15 text-purple-700 dark:text-purple-400 border border-purple-500/30'
                                : 'bg-sky-500/15 text-sky-700 dark:text-sky-400 border border-sky-500/30'
                            }`}
                          >
                            {isBooking ? 'Office Hour Booking' : 'General Inquiry'}
                          </span>
                          <span
                            className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                              c.status === 'confirmed'
                                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                                : c.status === 'dismissed'
                                ? 'bg-slate-200 dark:bg-slate-700/60 text-slate-600 dark:text-slate-400'
                                : 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {c.status}
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1">{c.name}</h4>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          <a href={`mailto:${c.email}`} className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1">
                            <Mail size={12} /> {c.email}
                          </a>
                          {c.phone && (
                            <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                              <Phone size={12} /> {c.phone}
                            </span>
                          )}
                          {c.student_id && (
                            <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[11px] text-slate-700 dark:text-slate-300">
                              ID: {c.student_id}
                            </span>
                          )}
                          <span className="text-slate-400">
                            {new Date(c.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        {c.status !== 'confirmed' && (
                          <button
                            onClick={() => handleUpdateContactStatus(c.id, 'confirmed')}
                            disabled={updatingContactId === c.id}
                            className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors cursor-pointer"
                          >
                            <CheckCircle2 size={13} />
                            <span>Mark Confirmed</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteContact(c.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                          title="Delete submission"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    {isBooking && (
                      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-3 mb-2 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                        <div>
                          <span className="text-slate-500 block text-[11px] uppercase font-semibold">Preferred Date</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1 mt-0.5">
                            <Calendar size={13} className="text-emerald-500" />
                            {c.preferred_date || 'Not specified'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[11px] uppercase font-semibold">Time Slot</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1 mt-0.5">
                            <Clock size={13} className="text-sky-500" />
                            {c.preferred_time || 'Office Hours'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[11px] uppercase font-semibold">Topic</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1 mt-0.5">
                            <GraduationCap size={13} className="text-purple-500" />
                            {c.purpose || 'Academic Advising'}
                          </span>
                        </div>
                      </div>
                    )}

                    {c.message && (
                      <div className="rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-750/40 p-3 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                        <p className="italic">&ldquo;{c.message}&rdquo;</p>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* ── Student Feedback Section ── */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm dark:shadow-xl">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <MessageSquareQuote size={18} className="text-emerald-500" />
                Student Feedback &amp; Suggestions
              </h2>
              <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                {studentFeedback.length} responses
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Feedback submitted by UMaT students upon past question verification.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center text-slate-500">
            <Loader2 className="animate-spin text-emerald-500" size={20} />
          </div>
        ) : studentFeedback.length === 0 ? (
          <div className="px-6 py-12 text-center text-slate-500">
            <MessageCircle size={28} className="mx-auto mb-2 text-slate-400 dark:text-slate-600" />
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400">No student feedback submitted yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-800 max-h-[400px] overflow-y-auto">
            {studentFeedback.map((fb) => (
              <div key={fb.id} className="p-5 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                      <GraduationCap size={16} />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {fb.name || 'Anonymous UMaT Student'}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {fb.programme || 'Programme not specified'}
                        {fb.level ? ` · ${fb.level}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    {fb.student_identifier && (
                      <span className="font-mono bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300">
                        {fb.student_identifier}
                      </span>
                    )}
                    {fb.created_at && <span>{new Date(fb.created_at).toLocaleDateString()}</span>}
                  </div>
                </div>

                {fb.suggestions && (
                  <div className="mt-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 p-3 text-xs text-slate-700 dark:text-slate-200">
                    <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">
                      Suggestion:
                    </p>
                    <p className="italic text-slate-600 dark:text-slate-300">&ldquo;{fb.suggestions}&rdquo;</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
