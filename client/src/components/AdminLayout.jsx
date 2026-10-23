import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Video,
  FileQuestion,
  Briefcase,
  Sliders,
  BarChart3,
  KeyRound,
  LogOut,
  ExternalLink,
  Shield,
  Menu,
  X,
  Sparkles,
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';

const navLinks = [
  { label: 'Analytics & Overview', to: '/admin', icon: BarChart3 },
  { label: 'Site Content & Info', to: '/admin/settings', icon: Sliders },
  { label: 'Video Lectures', to: '/admin/videos', icon: Video },
  { label: 'Past Questions', to: '/admin/past-questions', icon: FileQuestion },
  { label: 'Portfolio & Research', to: '/admin/portfolio', icon: Briefcase },
  { label: 'Account & Security', to: '/admin/security', icon: KeyRound },
];

/**
 * AdminLayout – Executive administrative workspace with dual light/dark themes,
 * fixed sidebar, glassmorphic top header, theme toggle, and live status indicator.
 */
export default function AdminLayout({ children }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  const isActive = (to) => {
    if (to === '/admin') return pathname === '/admin';
    return pathname.startsWith(to);
  };

  const activeLinkTitle = navLinks.find((l) => isActive(l.to))?.label || 'Admin Workspace';

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {/* ── Mobile Sidebar Overlay ────────────────────────────────────────── */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* ── Fixed Sidebar ───────────────────────────────────────────── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-transform duration-300 lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 rounded-xl overflow-hidden ring-2 ring-emerald-500/50 shadow-md shadow-emerald-500/20 shrink-0 bg-white p-0.5">
              <img src="/logo.jpg" alt="Dr. Alhassan" className="w-full h-full object-contain" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-bold text-slate-900 dark:text-white">Dr. Alhassan</p>
              <p className="text-[10px] font-mono uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-semibold">
                Executive Portal
              </p>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-1">
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono">
            Administration
          </p>
          {navLinks.map(({ label, to, icon: Icon }) => {
            const active = isActive(to);
            return (
              <Link
                key={to}
                to={to}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold transition-all ${
                  active
                    ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-100 border border-transparent'
                }`}
              >
                <Icon
                  size={17}
                  className={active ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}
                />
                <span className="truncate">{label}</span>
                {active && (
                  <span className="ml-auto h-2 w-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="border-t border-slate-200 dark:border-slate-800 p-3 space-y-1.5 bg-slate-50/50 dark:bg-slate-900/50">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="flex w-full items-center justify-between rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
          >
            <span className="flex items-center gap-2">
              <ExternalLink size={14} />
              <span>Live Public Website</span>
            </span>
            <span className="text-[10px] uppercase font-mono text-emerald-600 dark:text-emerald-400 font-bold">
              Visit ↗
            </span>
          </a>

          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
          >
            <LogOut size={15} />
            <span>Sign Out Session</span>
          </button>
        </div>
      </aside>

      {/* ── Main Workspace Area ────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 px-4 sm:px-8 backdrop-blur-md transition-colors duration-300">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              aria-label="Open sidebar"
            >
              <Menu size={20} />
            </button>

            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>{activeLinkTitle}</span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-4">
            {/* Live Indicator Pill */}
            <div className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>System Live</span>
            </div>

            {/* Dark / Light Mode Switcher */}
            <ThemeToggle />

            {/* Admin Profile Pill */}
            <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200 dark:border-slate-800">
              <div className="h-8 w-8 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold text-xs">
                OA
              </div>
              <div className="hidden md:block text-left text-xs leading-tight">
                <p className="font-bold text-slate-900 dark:text-white">Dr. Alhassan</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">Administrator</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
