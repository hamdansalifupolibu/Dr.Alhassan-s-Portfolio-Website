/**
 * About.jsx
 * About page for Dr. Alhassan Osman — biography, academic credentials, research interests, and teaching philosophy.
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  GraduationCap,
  Cpu,
  Zap,
  BatteryCharging,
  Sun,
  Activity,
  Layers,
  Award,
  ExternalLink,
  BookOpen,
  Mail,
  Building2,
  Calendar,
  CheckCircle2,
  Camera,
  Briefcase,
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

// ─── Animation helper ─────────────────────────────────────────────────────────
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-40px' },
  transition: { duration: 0.5, delay, ease: 'easeOut' },
});

// ─── Verified Academic Degrees ────────────────────────────────────────────────
const DEGREES = [
  {
    icon: GraduationCap,
    degree: 'Ph.D. in Control Engineering',
    institution: 'Gaziantep University, Turkey',
    year: '2022',
    accent: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },
  {
    icon: GraduationCap,
    degree: 'M.Sc. in Electrical and Electronics Engineering',
    institution: 'Boumerdes University, Algeria',
    year: '2014',
    accent: 'border-sky-500/40 bg-sky-500/10 text-sky-600 dark:text-sky-400',
  },
  {
    icon: GraduationCap,
    degree: 'B.Sc. in Electrical and Electronics Engineering',
    institution: 'Boumerdes University, Algeria',
    year: '2012',
    accent: 'border-purple-500/40 bg-purple-500/10 text-purple-600 dark:text-purple-400',
  },
];

// ─── Core Research Interest Tags ─────────────────────────────────────────────
const RESEARCH_TOPICS = [
  { icon: Cpu, label: 'Control Systems', desc: 'Nonlinear control, feedback observers, and stability analysis' },
  { icon: Activity, label: 'Optimization Algorithms', desc: 'Real-time convex optimization and predictive control' },
  { icon: Layers, label: 'Machine Learning', desc: 'Reinforcement learning and intelligent forecasting models' },
  { icon: Zap, label: 'Smart Grids', desc: 'Microgrid dispatch, frequency regulation, and power distribution' },
  { icon: BatteryCharging, label: 'Energy Storage Systems (ESS)', desc: 'Battery management, state-of-charge tracking, and sizing' },
  { icon: Sun, label: 'Variable Renewable Energy (VRE)', desc: 'Intermittency mitigation and seamless grid integration' },
  { icon: Activity, label: 'Electric Motors & Drives', desc: 'Vector control, drive efficiency, and dynamic load torque' },
  { icon: Zap, label: 'Capacitor Banks & Power Factor', desc: 'Reactive power compensation and harmonic filtration' },
];

export default function About() {
  const { settings } = useSettings();
  const [photoMode, setPhotoMode] = useState('passport'); // 'passport' | 'office'

  const fullName = settings.fullName || 'Dr. Alhassan Osman';
  const department = settings.department || 'Department of Electrical and Electronic Engineering';
  const institution = settings.institution || 'University of Mines and Technology (UMaT), Tarkwa';
  const email = settings.email || 'aosman@umat.edu.gh';
  const directoryUrl = settings.staffDirectoryLink || 'https://umat.edu.gh/staffinfo/staffDetailed.php?contactID=857';

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-emerald-500 selection:text-slate-950 transition-colors">
      {/* ── Background Gradients ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-emerald-500/10 rounded-full blur-[140px]" />
        <div className="absolute top-[40%] right-[-10%] w-[500px] h-[500px] bg-sky-500/5 rounded-full blur-[150px]" />
      </div>

      {/* ── Hero Section ── */}
      <section className="relative pt-20 pb-14 px-4 sm:px-6 lg:px-8 border-b border-slate-200 dark:border-slate-800/80">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: -14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs sm:text-sm font-semibold text-emerald-600 dark:text-emerald-400 mb-6"
          >
            <GraduationCap className="w-4 h-4" />
            <span>Faculty Profile · {department}</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-4"
          >
            {fullName}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.2 }}
            className="text-emerald-600 dark:text-emerald-400 text-lg sm:text-xl font-semibold tracking-wide mb-3"
          >
            Lecturer in Electrical &amp; Electronic Engineering (2023 – Present)
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.3 }}
            className="text-slate-600 dark:text-slate-400 text-sm sm:text-base max-w-2xl mx-auto mb-8"
          >
            {institution}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.35 }}
            className="flex flex-wrap items-center justify-center gap-3"
          >
            <a
              href={`mailto:${email}`}
              className="inline-flex items-center gap-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2.5 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-white hover:border-emerald-500/50 shadow-sm transition-all"
            >
              <Mail className="w-4 h-4 text-emerald-500" />
              <span>{email}</span>
            </a>

            <a
              href={directoryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-4 py-2.5 text-xs sm:text-sm font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 shadow-sm transition-all"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Official UMaT Staff Directory Profile</span>
            </a>
          </motion.div>
        </div>
      </section>

      {/* ── Biography & Autobiography ── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* Left Avatar / Academic Card (4 cols) */}
          <motion.div
            {...fadeUp(0.1)}
            className="lg:col-span-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-6 backdrop-blur-md shadow-xl text-center"
          >
            {/* Photo mode switcher */}
            <div className="flex items-center justify-center gap-1 mb-4 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-750 text-xs">
              <button
                type="button"
                onClick={() => setPhotoMode('passport')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                  photoMode === 'passport'
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Camera size={13} />
                <span>Academic Headshot</span>
              </button>
              <button
                type="button"
                onClick={() => setPhotoMode('office')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                  photoMode === 'office'
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Briefcase size={13} />
                <span>Faculty Office</span>
              </button>
            </div>

            {/* High-Definition 4:5 Portrait Container */}
            <div className="relative mx-auto mb-5 aspect-[4/5] w-full max-w-[260px] rounded-2xl bg-gradient-to-br from-emerald-500/40 via-slate-800 to-slate-900 p-1 shadow-xl shadow-emerald-500/10 overflow-hidden group">
              <img
                src={
                  photoMode === 'passport'
                    ? '/images/dr-alhassan-passport-clean.jpg'
                    : '/images/dr-alhassan-office-clean.jpg'
                }
                alt={fullName}
                className="h-full w-full rounded-xl object-cover object-top transition-transform duration-700 group-hover:scale-105"
              />
              <div
                className="absolute bottom-2.5 right-2.5 rounded-full bg-emerald-500 p-1.5 text-slate-950 shadow-lg ring-2 ring-white dark:ring-slate-900"
                title="Verified Faculty at UMaT"
              >
                <CheckCircle2 size={16} className="stroke-[3]" />
              </div>
            </div>

            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">{fullName}</h3>
            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
              Ph.D. in Control Engineering
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-mono">
              Lecturer @ UMaT (2023–Present)
            </p>

            <div className="mt-6 border-t border-slate-200 dark:border-slate-800 pt-4 space-y-2 text-left text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-2">
                <Building2 size={14} className="text-emerald-500 shrink-0" />
                <span>{department}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-emerald-500 shrink-0" />
                <span>Office: {settings.officeHours || 'Mon & Wed: 10:00 AM – 12:00 PM | Fri: 2:00 PM – 4:00 PM'}</span>
              </div>
            </div>
          </motion.div>

          {/* Right Bio narrative (7 cols) */}
          <motion.div {...fadeUp(0.2)} className="lg:col-span-7 space-y-6">
            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 sm:p-8 backdrop-blur-md shadow-xl shadow-slate-200/50 dark:shadow-none">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <BookOpen className="text-emerald-500 w-5 h-5" />
                Academic Biography
              </h2>
              <p className="text-slate-700 dark:text-slate-300 text-sm sm:text-base leading-relaxed mb-4">
                {settings.bio || "Dr. Alhassan Osman received both his Bachelor and Master's degrees in Electrical and Electronics Engineering from the University of Boumerdes, Algeria, and his Ph.D. degree in Control Engineering from Gaziantep University, Turkey. Since 2023, he serves as Lecturer in the Department of Electrical and Electronic Engineering at the University of Mines and Technology (UMaT), Tarkwa, Ghana."}
              </p>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                His research program centers on the intersection of mathematical Control Theory, Optimization Frameworks, and Machine Learning algorithms with targeted industrial applications across Smart Grids, Battery Energy Storage Systems (BESS), Variable Renewable Energy (VRE) integration, and the high-efficiency control of electric motors and capacitor banks.
              </p>
            </div>

            {/* Teaching Philosophy */}
            <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/5 p-6 sm:p-8 backdrop-blur-md shadow-md">
              <h3 className="text-base font-bold text-emerald-700 dark:text-emerald-400 mb-2 flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-500" />
                Teaching Philosophy
              </h3>
              <p className="text-slate-700 dark:text-slate-200 text-sm leading-relaxed italic">
                &ldquo;{settings.teachingPhilosophy || 'Engineering education is about bridging rigorous mathematical control theory and real-world energy infrastructure. I empower students to build resilient smart grids, optimize renewable energy systems, and master control algorithms for contemporary technological and sustainable development.'}&rdquo;
              </p>
            </div>

            {/* Secondary Office Photo Showcase */}
            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 overflow-hidden shadow-xl group">
              <div className="relative h-60 sm:h-68 w-full overflow-hidden">
                <img
                  src="/images/dr-alhassan-office-clean.jpg"
                  alt="Dr. Alhassan Osman at UMaT Faculty Office"
                  className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs text-white">
                  <div>
                    <p className="font-bold">Faculty Office &amp; Research Workspace</p>
                    <p className="text-slate-300 text-[11px]">Department of Electrical &amp; Electronic Engineering · UMaT</p>
                  </div>
                  <span className="rounded-md bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-slate-950">
                    Active Faculty
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Verified Academic Degrees Timeline ── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto border-t border-slate-200 dark:border-slate-800/80">
        <motion.div {...fadeUp(0.1)} className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-2">
            Higher Education &amp; Credentials
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">Academic Degrees</h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {DEGREES.map((deg, idx) => {
            const Icon = deg.icon;
            return (
              <motion.div
                key={deg.degree}
                {...fadeUp(0.12 * idx)}
                className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-6 flex flex-col justify-between shadow-lg shadow-slate-200/50 dark:shadow-none hover:border-emerald-500/40 transition-all duration-300 group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1 text-xs font-bold font-mono ${deg.accent}`}>
                      {deg.year}
                    </span>
                    <div className="h-9 w-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 group-hover:text-emerald-500 transition-colors">
                      <Icon size={18} />
                    </div>
                  </div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base leading-snug group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {deg.degree}
                  </h3>
                  <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 font-medium">
                    {deg.institution}
                  </p>
                </div>
                <div className="mt-6 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  <CheckCircle2 size={13} />
                  <span>Verified Qualification</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ── Research Interests Matrix ── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto border-t border-slate-200 dark:border-slate-800/80">
        <motion.div {...fadeUp(0.1)} className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-2">
            Research Specializations &amp; Industrial Applications
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">Research Focus</h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-2">
            Advanced engineering and computational control frameworks for next-generation power infrastructure.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {RESEARCH_TOPICS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.label}
                {...fadeUp(0.05 * idx)}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 hover:border-emerald-500/40 shadow-md shadow-slate-200/50 dark:shadow-none transition-all duration-300 group"
              >
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-colors">
                  <Icon size={18} />
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1.5 leading-snug">
                  {item.label}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {item.desc}
                </p>
              </motion.div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
