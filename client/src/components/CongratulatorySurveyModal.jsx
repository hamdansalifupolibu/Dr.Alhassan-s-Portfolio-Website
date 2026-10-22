import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PartyPopper,
  Sparkles,
  CheckCircle2,
  X,
  Send,
  BookOpen,
  ArrowRight,
  GraduationCap,
} from 'lucide-react';
import API from '../lib/api';

/**
 * Congratulatory Pop-up & Mini Feedback Survey
 * Displays on successful UMaT student validation.
 * It's optional: students can submit feedback or click "Skip & Access Questions".
 */
export default function CongratulatorySurveyModal({
  isOpen,
  studentIdentifier,
  detectedLabel,
  onClose,
}) {
  const [form, setForm] = useState({
    name: '',
    programme: '',
    level: 'Level 200',
    reason: 'Exam Preparation & Revision',
    suggestions: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await API.post('/access/feedback', {
        studentIdentifier,
        name: form.name.trim() || undefined,
        programme: form.programme.trim() || undefined,
        level: form.level,
        reason: form.reason,
        suggestions: form.suggestions.trim() || undefined,
      });
      setSubmitted(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      // Non-blocking: proceed even if feedback fails
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/85 backdrop-blur-md"
        />

        {/* Modal Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ type: 'spring', duration: 0.5, bounce: 0.2 }}
          className="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl border border-emerald-500/30 bg-slate-900 shadow-2xl shadow-emerald-500/10"
        >
          {/* Top Banner with Glow */}
          <div className="relative bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 px-6 py-6 text-slate-950">
            <button
              onClick={onClose}
              className="absolute right-4 top-4 rounded-full bg-black/10 p-1.5 text-slate-900 hover:bg-black/20 transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-emerald-400 shadow-lg">
                <PartyPopper size={24} />
              </div>
              <div>
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-950/20 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-slate-950">
                  <CheckCircle2 size={12} /> Verified UMaT Student
                </span>
                <h3 className="text-xl font-extrabold text-white mt-0.5">
                  Congratulations! Access Granted 🎉
                </h3>
              </div>
            </div>
            <p className="mt-2 text-xs font-medium text-emerald-950/90 leading-relaxed">
              {detectedLabel || 'Your student credentials'}: Full complimentary access to all solved past questions, solutions, and lecture study material is now unlocked!
            </p>
          </div>

          {/* Form Content */}
          <div className="p-6 sm:p-7">
            {submitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-10 text-center space-y-3"
              >
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400">
                  <CheckCircle2 size={32} />
                </div>
                <h4 className="text-lg font-bold text-white">Thank You for Your Feedback!</h4>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Your inputs help Dr. Alhassan Osman tailor upcoming study sets and solved tutorials. Opening resource vault…
                </p>
              </motion.div>
            ) : (
              <div>
                <div className="mb-5 flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                      <GraduationCap size={16} className="text-emerald-400" />
                      Help Us Improve (Quick &amp; Optional)
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Tell us a bit about your programme to help curate relevant solutions.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                        Your Name (Optional)
                      </label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="e.g. Kwame Mensah"
                        className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-emerald-500 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                        Academic Level
                      </label>
                      <select
                        value={form.level}
                        onChange={(e) => setForm({ ...form, level: e.target.value })}
                        className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs text-slate-100 outline-none focus:border-emerald-500 transition"
                      >
                        <option value="Level 100">Level 100 (Freshman)</option>
                        <option value="Level 200">Level 200 (Sophomore)</option>
                        <option value="Level 300">Level 300 (Junior)</option>
                        <option value="Level 400">Level 400 (Final Year)</option>
                        <option value="Postgraduate">Postgraduate (MSc / PhD)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      Programme of Study (Optional)
                    </label>
                    <input
                      type="text"
                      value={form.programme}
                      onChange={(e) => setForm({ ...form, programme: e.target.value })}
                      placeholder="e.g. BSc Electrical and Electronic Engineering / Computer Science"
                      className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-emerald-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      Primary Purpose
                    </label>
                    <select
                      value={form.reason}
                      onChange={(e) => setForm({ ...form, reason: e.target.value })}
                      className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs text-slate-100 outline-none focus:border-emerald-500 transition"
                    >
                      <option value="Exam Preparation & Revision">End of Semester Exam Revision</option>
                      <option value="Mid-Semester Quiz Preparation">Mid-Semester Quiz &amp; Tests</option>
                      <option value="Lecture Topic Understanding">Better Understanding of Lecture Material</option>
                      <option value="Personal Study & Research">Personal Research &amp; Self-Paced Learning</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      Suggestions / Questions for Dr. Alhassan (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={form.suggestions}
                      onChange={(e) => setForm({ ...form, suggestions: e.target.value })}
                      placeholder="Any specific past paper or topic explanation you'd like him to solve on YouTube?"
                      className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-emerald-500 transition resize-none"
                    />
                  </div>

                  {/* Actions */}
                  <div className="pt-2 flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="w-full sm:w-auto text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors py-2"
                    >
                      Skip &amp; Access Questions Now &rarr;
                    </button>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-md shadow-emerald-500/20 hover:bg-emerald-400 transition-colors cursor-pointer"
                    >
                      <Send size={13} />
                      <span>{submitting ? 'Submitting…' : 'Submit & Open Questions'}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
