import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import API from '../lib/api';

export default function AnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    // Avoid tracking admin pages to keep public stats clean
    if (location.pathname.startsWith('/admin')) return;

    try {
      API.post('/analytics/track', {
        path: location.pathname,
        referrer: document.referrer || '',
      }).catch(() => {});
    } catch (e) {
      // Non-critical tracking error
    }
  }, [location.pathname]);

  return null;
}
