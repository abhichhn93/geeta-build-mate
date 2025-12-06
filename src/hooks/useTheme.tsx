import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ThemeName = 'mint' | 'blue' | 'orange' | 'dark';

interface ThemeContextType {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  themes: { name: ThemeName; label: string; color: string }[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEMES = [
  { name: 'mint' as const, label: 'Mint (Default)', color: '#2d9d8f' },
  { name: 'blue' as const, label: 'Deep Blue', color: '#2874f0' },
  { name: 'orange' as const, label: 'Warm Orange', color: '#e65100' },
  { name: 'dark' as const, label: 'Charcoal Dark', color: '#1a1a2e' },
];

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>(() => {
    const saved = localStorage.getItem('app-theme');
    return (saved as ThemeName) || 'mint';
  });

  const setTheme = (newTheme: ThemeName) => {
    setThemeState(newTheme);
    localStorage.setItem('app-theme', newTheme);
  };

  useEffect(() => {
    // Remove all theme classes
    document.documentElement.classList.remove('theme-mint', 'theme-blue', 'theme-orange', 'theme-dark');
    // Add current theme class
    document.documentElement.classList.add(`theme-${theme}`);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES }}>
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
