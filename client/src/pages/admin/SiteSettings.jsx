import { useState, useEffect } from 'react';
import {
  Sliders,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Globe,
  Video,
  Mail,
  Building,
  GraduationCap,
  DollarSign,
} from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import API from '../../lib/api';
import { useSettings } from '../../context/SettingsContext';
import { useToast } from '../../context/ToastContext';

const inputCls =
  'w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 shadow-sm';

export default function SiteSettings() {
  const toast = useToast();
  const { refreshSettings } = useSettings();
  const [form, setForm] = useState({
    fullName: '',
    shortName: '',
    tagline: '',
    institution: '',
    department: '',
    email: '',
    youtubeChannel: '',
    officeLocation: '',
    officeHours: '',
    bio: '',
    teachingPhilosophy: '',
    nonUmatPrice: '20',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    API.get('/settings')
      .then(({ data }) => {
        if (data && typeof data === 'object') {
          setForm((prev) => ({ ...prev, ...data }));
        }
      })
      .catch(() => {
        setError('Failed to load current settings.');
        toast.error('Failed to load settings.');
      })
      .finally(() => setLoading(false));
  }, [toast]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await API.put('/settings', form);
      const msg = 'Site content and information updated successfully!';
      setSuccess(msg);
      toast.success(msg);
      refreshSettings();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to save settings.';
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <Sliders className="text-emerald-500" size={26} />
            Site Content &amp; Settings Authority
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Control the lecturer profile, institutional details, YouTube channel, and access fees.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 disabled:opacity-50 transition-all cursor-pointer self-start sm:self-auto"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          <span>Save All Changes</span>
        </button>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          <AlertCircle size={18} /> <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-300">
          <CheckCircle2 size={18} /> <span>{success}</span>
        </div>
      )}

      {loading ? (
        <div className="py-24 flex items-center justify-center text-slate-500 gap-3">
          <Loader2 className="animate-spin text-emerald-500" size={24} />
          <span>Loading settings…</span>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-8">
          {/* Card 1: Identity & Branding */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm dark:shadow-xl">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-4 border-b border-slate-200 dark:border-slate-800 pb-3">
              <GraduationCap className="text-emerald-500" size={20} />
              Identity &amp; Academic Title
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Full Display Name / Title
                </label>
                <input
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  className={inputCls}
                  placeholder="e.g. Dr. Alhassan Wiela, Ph.D."
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Short Brand Name
                </label>
                <input
                  name="shortName"
                  value={form.shortName}
                  onChange={handleChange}
                  className={inputCls}
                  placeholder="e.g. Dr. Alhassan"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Tagline / Subheading
                </label>
                <input
                  name="tagline"
                  value={form.tagline}
                  onChange={handleChange}
                  className={inputCls}
                  placeholder="e.g. Lecturer · Researcher · Educator"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Social & Official Channels */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm dark:shadow-xl">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-4 border-b border-slate-200 dark:border-slate-800 pb-3">
              <Globe className="text-emerald-500" size={20} />
              Channels &amp; Communications
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Official YouTube Channel Link
                </label>
                <input
                  name="youtubeChannel"
                  value={form.youtubeChannel}
                  onChange={handleChange}
                  className={inputCls}
                  placeholder="https://www.youtube.com/@AlhassanWielaPh.D"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Official Lecturer Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className={inputCls}
                  placeholder="alhassan@umat.edu.gh"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  University / Institution
                </label>
                <input
                  name="institution"
                  value={form.institution}
                  onChange={handleChange}
                  className={inputCls}
                  placeholder="University for Mines and Technology (UMaT), Tarkwa"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Academic Department
                </label>
                <input
                  name="department"
                  value={form.department}
                  onChange={handleChange}
                  className={inputCls}
                  placeholder="Department of Electrical and Electronic Engineering"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Office Location
                </label>
                <input
                  name="officeLocation"
                  value={form.officeLocation}
                  onChange={handleChange}
                  className={inputCls}
                  placeholder="Department of Electrical and Electronic Engineering, UMaT, Tarkwa, Ghana"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Office Hours
                </label>
                <input
                  name="officeHours"
                  value={form.officeHours}
                  onChange={handleChange}
                  className={inputCls}
                  placeholder="Mon & Wed: 10:00 AM – 12:00 PM | Fri: 2:00 PM – 4:00 PM (or by appointment)"
                />
              </div>
            </div>
          </div>

          {/* Card 3: Biography & Philosophy */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm dark:shadow-xl">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-4 border-b border-slate-200 dark:border-slate-800 pb-3">
              <Building className="text-emerald-500" size={20} />
              Biography &amp; Philosophy
            </h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Overview Biography (appears on About &amp; Home)
                </label>
                <textarea
                  name="bio"
                  rows={4}
                  value={form.bio}
                  onChange={handleChange}
                  className={`${inputCls} resize-y`}
                  placeholder="Overview about your academic journey..."
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Teaching Philosophy Statement
                </label>
                <textarea
                  name="teachingPhilosophy"
                  rows={3}
                  value={form.teachingPhilosophy}
                  onChange={handleChange}
                  className={`${inputCls} resize-y`}
                  placeholder="Your perspective on educating university students..."
                />
              </div>
            </div>
          </div>

          {/* Card 4: Access Pricing */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm dark:shadow-xl">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-4 border-b border-slate-200 dark:border-slate-800 pb-3">
              <DollarSign className="text-emerald-500" size={20} />
              Past Questions Access Fee (Non-UMaT)
            </h2>
            <div className="max-w-xs">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Non-UMaT Student Access Fee (GH₵)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 font-bold text-xs">
                  GH₵
                </span>
                <input
                  type="number"
                  name="nonUmatPrice"
                  value={form.nonUmatPrice}
                  onChange={handleChange}
                  className={`${inputCls} pl-12 font-mono font-bold`}
                  placeholder="20"
                />
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Price displayed on the past questions paywall for non-students.
              </p>
            </div>
          </div>

          {/* Bottom Save Bar */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-7 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 disabled:opacity-50 transition-all cursor-pointer"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              <span>Save &amp; Apply Changes</span>
            </button>
          </div>
        </form>
      )}
    </AdminLayout>
  );
}
