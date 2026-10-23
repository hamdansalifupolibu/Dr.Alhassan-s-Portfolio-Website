import { Link } from 'react-router-dom';
import { BookOpen, Video, Mail, ExternalLink, Lock } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

export default function Footer() {
  const year = new Date().getFullYear();
  const { settings } = useSettings();

  const youtubeUrl = settings.youtubeChannel || 'https://www.youtube.com/@AlhassanWielaPh.D';
  const email = settings.email || 'aosman@umat.edu.gh';
  const shortName = settings.shortName || 'Dr. Alhassan Osman';

  return (
    <footer className="bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-850 mt-auto transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-3 mb-3 group">
              <div className="w-10 h-10 rounded-2xl overflow-hidden ring-1 ring-emerald-500/40 shadow-sm shrink-0">
                <img src="/logo.jpg" alt={shortName} className="w-full h-full object-cover" />
              </div>
              <span className="font-extrabold text-slate-900 dark:text-white text-base group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                {shortName}
              </span>
            </Link>
            <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm leading-relaxed">
              Lecturer in Electrical &amp; Electronic Engineering at UMaT, Tarkwa. Advancing Control Systems, Smart Grids, Machine Learning, and democratizing engineering study resources.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white mb-3 text-sm">Quick Links</h4>
            <ul className="space-y-2">
              {[
                { name: 'About', path: '/about' },
                { name: 'Videos', path: '/videos' },
                { name: 'Portfolio', path: '/portfolio' },
                { name: 'Past Questions', path: '/past-questions' },
                { name: 'Contact & Book Me', path: '/contact' },
              ].map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 text-xs sm:text-sm transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white mb-3 text-sm">Connect</h4>
            <ul className="space-y-2.5">
              <li>
                <a
                  href={`mailto:${email}`}
                  className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 text-xs sm:text-sm transition-colors"
                >
                  <Mail size={15} />
                  <span>{email}</span>
                </a>
              </li>
              <li>
                <a
                  href={youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-red-500 text-xs sm:text-sm transition-colors group"
                >
                  <Video size={15} className="text-red-500" />
                  <span className="font-medium text-slate-800 dark:text-slate-200 group-hover:text-red-500">
                    Alhassan Wiela, Ph. D
                  </span>
                  <ExternalLink size={12} className="opacity-60" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-200 dark:border-slate-800/80 mt-8 pt-6 flex flex-col sm:flex-row justify-between items-center gap-2">
          <p className="text-slate-500 text-xs">
            © {year} {settings.fullName || 'Dr. Alhassan Osman'}. All rights reserved. University of Mines and Technology.
          </p>
          <Link
            to="/admin/login"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-500/30 text-xs font-medium transition-all shadow-sm"
          >
            <Lock size={12} className="text-emerald-500" />
            <span>Dr. Alhassan Faculty Portal</span>
          </Link>
        </div>
      </div>
    </footer>
  );
}
