import { createContext, useContext, useState, useEffect } from 'react';

export const ThemeContext = createContext();

const THEME_STORAGE_KEY = 'nexus-connect-theme';

export const THEME_LIST = [
  'nexus',
  'light',
  'cosmic',
  'teal',
  'carbon',
  'nightowl',
  'cyberpunk',
  'sakura',
  'celestia',
  'reddit',
  '4chan',
];

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem(THEME_STORAGE_KEY) || 'nexus';
    } catch {
      return 'nexus';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // ignore
    }
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}

export default ThemeContext;
