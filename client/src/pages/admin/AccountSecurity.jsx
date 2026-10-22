import { useState, useEffect } from 'react';
import {
  KeyRound,
  User,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Lock,
} from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import API from '../../lib/api';
import { useToast } from '../../context/ToastContext';

const inputCls =
  'w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 shadow-sm';

export default function AccountSecurity() {
  const toast = useToast();
  const [currentUser, setCurrentUser] = useState('');
  const [form, setForm] = useState({
    currentPassword: '',
    newUsername: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    // Fetch current admin profile
    API.get('/auth/me')
      .then(({ data }) => {
        if (data?.username) {
          setCurrentUser(data.username);
          setForm((f) => ({ ...f, newUsername: data.username }));
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.currentPassword) {
      setError('Current password is required to verify your authority.');
      toast.error('Current password is required.');
      return;
    }

    if (form.newPassword && form.newPassword !== form.confirmPassword) {
      setError('New password and confirmation do not match.');
      toast.error('New password and confirmation do not match.');
      return;
    }

    if (form.newPassword && form.newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      toast.error('New password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        currentPassword: form.currentPassword,
        newUsername: form.newUsername.trim() || undefined,
        newPassword: form.newPassword.trim() || undefined,
      };

      const { data } = await API.put('/auth/change-credentials', payload);

      if (data.token) {
        localStorage.setItem('adminToken', data.token);
      }
      if (data.username) {
        setCurrentUser(data.username);
      }

      const msg = 'Account credentials updated successfully!';
      setSuccess(msg);
      toast.success(msg);
      setForm((f) => ({
        ...f,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Failed to update credentials. Please check your current password.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
          <KeyRound className="text-emerald-500" size={26} />
          Account Security &amp; Credentials
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Change your administrative username and secure access password.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Form */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm dark:shadow-xl">
            {error && (
              <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-400">
                <AlertCircle size={18} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 size={18} className="shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Username */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Admin Username
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                  <input
                    type="text"
                    value={form.newUsername}
                    onChange={(e) => setForm({ ...form, newUsername: e.target.value })}
                    required
                    className={`${inputCls} pl-10`}
                    placeholder="e.g. Alhassan"
                  />
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  This is the username used to sign in to the admin panel.
                </p>
              </div>

              <div className="border-t border-slate-200 dark:border-slate-800 pt-5">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-200 mb-4 flex items-center gap-2">
                  <Lock size={16} className="text-emerald-500" />
                  Change Password
                </h3>

                <div className="space-y-4">
                  {/* New Password */}
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-400">
                      New Password (leave blank if keeping current)
                    </label>
                    <input
                      type="password"
                      value={form.newPassword}
                      onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                      className={inputCls}
                      placeholder="At least 6 characters"
                    />
                  </div>

                  {/* Confirm Password */}
                  {form.newPassword && (
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-400">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        value={form.confirmPassword}
                        onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                        className={inputCls}
                        placeholder="Re-enter new password"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Current Password Verification */}
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  Verify Current Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={form.currentPassword}
                  onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
                  required
                  className={inputCls}
                  placeholder="Enter your current password to confirm changes"
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  To protect your account, any changes to credentials require your existing password.
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Updating Credentials…
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={16} />
                      Save &amp; Update Credentials
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Security Guidance */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-200 mb-3 flex items-center gap-2">
              <ShieldCheck className="text-emerald-500" size={18} />
              Active Administrator
            </h3>
            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <p>
                Currently logged in as:{' '}
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {currentUser || 'Alhassan'}
                </span>
              </p>
              <p>
                Session token expires every 24 hours. Updating your password automatically refreshes your token seamlessly.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 shadow-sm">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 font-mono">
              Default Credentials Tip
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Your default username is <code className="text-emerald-600 dark:text-emerald-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono">Alhassan</code> and password is <code className="text-emerald-600 dark:text-emerald-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono">Alhassan@123</code>. You can change either of these at any time using this form.
            </p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
