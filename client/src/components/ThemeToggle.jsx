import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      type="button"
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label="Toggle visual theme"
      className={`relative inline-flex items-center justify-center h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:border-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-700/70 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 cursor-pointer ${className}`}
    >
      <motion.div
        key={theme}
        initial={{ rotate: -45, scale: 0.7, opacity: 0 }}
        animate={{ rotate: 0, scale: 1, opacity: 1 }}
        exit={{ rotate: 45, scale: 0.7, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="flex items-center justify-center"
      >
        {isDark ? (
          <Sun size={17} className="text-amber-400 hover:text-amber-300 transition-colors" />
        ) : (
          <Moon size={17} className="text-emerald-600 hover:text-emerald-500 transition-colors" />
        )}
      </motion.div>
    </button>
  );
}
