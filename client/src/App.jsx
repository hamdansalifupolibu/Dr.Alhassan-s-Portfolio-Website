import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import { SettingsProvider } from './context/SettingsContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import AnalyticsTracker from './components/AnalyticsTracker';
import PageLoader from './components/PageLoader';

// Lazy-loaded public pages for fast initial load and production performance
const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const Portfolio = lazy(() => import('./pages/Portfolio'));
const Videos = lazy(() => import('./pages/Videos'));
const PastQuestions = lazy(() => import('./pages/PastQuestions'));
const Contact = lazy(() => import('./pages/Contact'));

// Lazy-loaded admin portal pages
const AdminLogin = lazy(() => import('./pages/admin/Login'));
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const ManageVideos = lazy(() => import('./pages/admin/ManageVideos'));
const ManagePastQuestions = lazy(() => import('./pages/admin/ManagePastQuestions'));
const ManagePortfolio = lazy(() => import('./pages/admin/ManagePortfolio'));
const SiteSettings = lazy(() => import('./pages/admin/SiteSettings'));
const AccountSecurity = lazy(() => import('./pages/admin/AccountSecurity'));

function App() {
  return (
    <ThemeProvider>
      <SettingsProvider>
        <ToastProvider>
          <BrowserRouter>
            <AnalyticsTracker />
            <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Admin Portal Routes */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/settings"
                element={
                  <ProtectedRoute>
                    <SiteSettings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/security"
                element={
                  <ProtectedRoute>
                    <AccountSecurity />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/videos"
                element={
                  <ProtectedRoute>
                    <ManageVideos />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/past-questions"
                element={
                  <ProtectedRoute>
                    <ManagePastQuestions />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/portfolio"
                element={
                  <ProtectedRoute>
                    <ManagePortfolio />
                  </ProtectedRoute>
                }
              />

              {/* Public Website Routes */}
              <Route
                path="/*"
                element={
                  <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
                    <Navbar />
                    <main className="flex-1 pt-16 sm:pt-20">
                      <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/about" element={<About />} />
                        <Route path="/portfolio" element={<Portfolio />} />
                        <Route path="/videos" element={<Videos />} />
                        <Route path="/past-questions" element={<PastQuestions />} />
                        <Route path="/contact" element={<Contact />} />
                      </Routes>
                    </main>
                    <Footer />
                  </div>
                }
              />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </ToastProvider>
    </SettingsProvider>
  </ThemeProvider>
  );
}

export default App;
