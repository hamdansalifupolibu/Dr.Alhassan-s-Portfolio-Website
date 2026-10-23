import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

function getSystemTheme() {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'dark';
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('dr_theme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {
      // fallback
    }
    // Match device/system preference by default
    return getSystemTheme();
  });

  // Apply theme class to document root
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      root.style.colorScheme = 'light';
    }
  }, [theme]);

  // Listen to device/OS color scheme changes if user hasn't explicitly set a custom theme
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = (e) => {
      const saved = localStorage.getItem('dr_theme');
      // Only auto-switch if user hasn't saved an explicit preference
      if (!saved) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };

    try {
      mediaQuery.addEventListener('change', handleSystemChange);
      return () => mediaQuery.removeEventListener('change', handleSystemChange);
    } catch {
      // Fallback for older browsers
      try {
        mediaQuery.addListener(handleSystemChange);
        return () => mediaQuery.removeListener(handleSystemChange);
      } catch {}
    }
  }, []);

  const toggleTheme = (e) => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';

    // Persist user's explicit preference
    try {
      localStorage.setItem('dr_theme', nextTheme);
    } catch {}

    // Circular expanding wipe if View Transitions API is supported
    if (typeof document !== 'undefined' && document.startViewTransition && e && typeof e.clientX === 'number') {
      const x = e.clientX;
      const y = e.clientY;
      const endRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      );

      const transition = document.startViewTransition(() => {
        setTheme(nextTheme);
      });

      transition.ready.then(() => {
        const isSwitchingToDark = nextTheme === 'dark';
        const clipPath = [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${endRadius}px at ${x}px ${y}px)`,
        ];
        document.documentElement.animate(
          {
            clipPath: isSwitchingToDark ? clipPath : [...clipPath].reverse(),
          },
          {
            duration: 550,
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
            pseudoElement: isSwitchingToDark
              ? '::view-transition-new(root)'
              : '::view-transition-old(root)',
          }
        );
      });
      return;
    }

    setTheme(nextTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
