import { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({ type = 'success', message, title, duration = 4500 }) => {
      const id = Date.now() + Math.random().toString(36).substring(2, 6);
      setToasts((prev) => [...prev, { id, type, message, title }]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const toast = {
    success: (message, title = 'Success') => addToast({ type: 'success', message, title }),
    error: (message, title = 'Error') => addToast({ type: 'error', message, title }),
    info: (message, title = 'Notice') => addToast({ type: 'info', message, title }),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}

      {/* Floating Toasts Viewport */}
      <div
        aria-live="polite"
        className="fixed top-5 right-5 z-[99999] flex flex-col gap-3 max-w-sm sm:max-w-md w-full pointer-events-none p-4"
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => {
            const isSuccess = t.type === 'success';
            const isError = t.type === 'error';

            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: -20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
                transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border shadow-2xl backdrop-blur-xl transition-all ${
                  isSuccess
                    ? 'bg-white/95 dark:bg-slate-900/95 border-emerald-500/40 text-slate-800 dark:text-slate-100 shadow-emerald-500/10'
                    : isError
                    ? 'bg-white/95 dark:bg-slate-900/95 border-rose-500/40 text-slate-800 dark:text-slate-100 shadow-rose-500/10'
                    : 'bg-white/95 dark:bg-slate-900/95 border-sky-500/40 text-slate-800 dark:text-slate-100 shadow-sky-500/10'
                }`}
              >
                <div
                  className={`p-2 rounded-xl shrink-0 ${
                    isSuccess
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                      : isError
                      ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                      : 'bg-sky-500/15 text-sky-600 dark:text-sky-400'
                  }`}
                >
                  {isSuccess && <CheckCircle2 size={18} />}
                  {isError && <AlertCircle size={18} />}
                  {!isSuccess && !isError && <Info size={18} />}
                </div>

                <div className="flex-1 min-w-0 pr-1">
                  {t.title && (
                    <h5 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-0.5">
                      {t.title}
                    </h5>
                  )}
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-snug">
                    {t.message}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => removeToast(t.id)}
                  className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg transition cursor-pointer"
                >
                  <X size={15} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
