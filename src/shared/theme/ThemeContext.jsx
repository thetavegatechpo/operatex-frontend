import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const KEY = 'operatex.theme.v1';
const ThemeContext = createContext({ theme: 'light', setTheme: () => {}, toggle: () => {} });

export function resolveInitialTheme() {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch { /* storage blocked */ }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/** Call once BEFORE React renders (main.jsx) so the first paint is already themed. */
export function applyInitialTheme() {
  document.documentElement.setAttribute('data-theme', resolveInitialTheme());
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(resolveInitialTheme);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    root.style.colorScheme = theme;
    try { localStorage.setItem(KEY, theme); } catch { /* ignore */ }
  }, [theme]);

  const setTheme = useCallback(t => setThemeState(t === 'dark' ? 'dark' : 'light'), []);

  // Smooth cross-fade between themes (skipped when the user prefers reduced motion).
  const toggle = useCallback(() => {
    const root = document.documentElement;
    if (!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      root.classList.add('ox-theme-switching');
      window.setTimeout(() => root.classList.remove('ox-theme-switching'), 450);
    }
    setThemeState(t => (t === 'dark' ? 'light' : 'dark'));
  }, []);

  const value = useMemo(() => ({ theme, setTheme, toggle }), [theme, setTheme, toggle]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
