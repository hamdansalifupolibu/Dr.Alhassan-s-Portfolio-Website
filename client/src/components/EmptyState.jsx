/**
 * EmptyState.jsx
 * A centered empty-state card used when a list has no items to display.
 *
 * Props:
 *  - icon       : a Lucide React component (e.g. VideoOff)
 *  - title      : short headline string
 *  - description: supporting text string
 */
import { motion } from 'framer-motion';

export default function EmptyState({ icon: Icon, title, description }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex w-full flex-col items-center justify-center gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 px-8 py-20 text-center backdrop-blur-sm"
    >
      {Icon && (
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/30">
          <Icon className="h-8 w-8 text-emerald-400" strokeWidth={1.5} />
        </div>
      )}
      <h3 className="text-xl font-semibold text-slate-100">{title}</h3>
      {description && (
        <p className="max-w-sm text-sm leading-relaxed text-slate-400">{description}</p>
      )}
    </motion.div>
  );
}
