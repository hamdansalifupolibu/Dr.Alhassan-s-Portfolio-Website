import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, CalendarCheck, BookOpen, Lock } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import ThemeToggle from './ThemeToggle';

const navLinks = [
  { name: 'Home', path: '/' },
  { name: 'About', path: '/about' },
  { name: 'Portfolio', path: '/portfolio' },
  { name: 'Videos', path: '/videos' },
  { name: 'Past Questions', path: '/past-questions' },
  { name: 'Contact', path: '/contact' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { settings } = useSettings();
  const [isAdmin, setIsAdmin] = useState(false);

  const brandName = settings.shortName || 'Dr. Alhassan Osman';

  useEffect(() => {
    setIsAdmin(!!localStorage.getItem('adminToken'));
  }, [location]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => setOpen(false), [location]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 dark:bg-slate-950/95 backdrop-blur-md shadow-lg border-b border-slate-200 dark:border-slate-800/80'
          : 'bg-transparent'
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Brand Logo & Name */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-2xl overflow-hidden ring-2 ring-emerald-500/40 shadow-md shadow-emerald-500/20 group-hover:ring-emerald-400 group-hover:scale-105 transition-all shrink-0 bg-white p-0.5">
              <img
                src="/logo.jpg"
                alt={brandName}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="leading-tight">
              <span className="font-extrabold text-slate-900 dark:text-white text-base sm:text-lg tracking-tight block group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                {brandName}
              </span>
              <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 block -mt-0.5">
                UMaT · Electrical &amp; Electronic Eng.
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1.5">
            <ul className="flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path && !location.search.includes('tab=book');
                return (
                  <li key={link.path}>
                    <Link
                      to={link.path}
                      className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                        isActive
                          ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 shadow-sm'
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      {link.name}
                    </Link>
                  </li>
                );
              })}
            </ul>

            {/* Book Consultation Button */}
            <Link
              to="/contact?tab=book"
              className="ml-1.5 inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 transition-all shadow-sm cursor-pointer"
            >
              <CalendarCheck size={14} />
              <span>Book Me</span>
            </Link>

            {/* Dr. Alhassan Admin / Portal Login Button */}
            <Link
              to={isAdmin ? '/admin' : '/admin/login'}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all shadow-sm ${
                isAdmin
                  ? 'border border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500 hover:text-slate-950 font-bold'
                  : 'border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-500/30'
              }`}
              title={isAdmin ? 'Go to Admin Dashboard' : 'Dr. Alhassan Portal Login'}
            >
              <Lock size={13} className={isAdmin ? 'text-emerald-500' : 'text-slate-400 dark:text-slate-500'} />
              <span>{isAdmin ? 'Dashboard' : 'Dr. Login'}</span>
            </Link>

            {/* Theme Toggle (Light / Dark) */}
            <div className="ml-1.5 pl-2 border-l border-slate-200 dark:border-slate-800">
              <ThemeToggle />
            </div>
          </div>

          {/* Mobile Right Controls: Theme Toggle + Menu Hamburger */}
          <div className="md:hidden flex items-center gap-2">
            <Link
              to={isAdmin ? '/admin' : '/admin/login'}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 hover:text-emerald-500"
              title="Dr. Login"
            >
              <Lock size={16} />
            </Link>
            <ThemeToggle />
            <button
              onClick={() => setOpen(!open)}
              className="text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50"
              aria-label="Toggle navigation menu"
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white/98 dark:bg-slate-950/98 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
          >
            <ul className="px-4 py-4 space-y-1.5">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path;
                return (
                  <li key={link.path}>
                    <Link
                      to={link.path}
                      className={`block px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                        isActive
                          ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                          : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      {link.name}
                    </Link>
                  </li>
                );
              })}
              <li className="pt-2">
                <Link
                  to="/contact?tab=book"
                  className="flex items-center justify-center gap-2 w-full rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition-colors shadow-md shadow-emerald-500/20"
                >
                  <CalendarCheck size={15} />
                  <span>Book Office Hours / Appointment</span>
                </Link>
              </li>
              <li className="pt-1">
                <Link
                  to={isAdmin ? '/admin' : '/admin/login'}
                  className="flex items-center justify-center gap-2 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:border-emerald-500/40 transition-colors"
                >
                  <Lock size={14} className="text-emerald-500" />
                  <span>{isAdmin ? 'Dr. Alhassan Admin Dashboard' : 'Dr. Alhassan Portal Login'}</span>
                </Link>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
