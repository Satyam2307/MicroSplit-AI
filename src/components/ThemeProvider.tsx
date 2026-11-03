'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import VaultCurtainTransition from './VaultCurtainTransition';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  isCurtainActive: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  toggleTheme: () => {},
  isCurtainActive: false,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');
  const [isCurtainActive, setIsCurtainActive] = useState(false);
  const [targetTheme, setTargetTheme] = useState<Theme>('dark');

  // Load initial theme from localStorage or system preference
  useEffect(() => {
    const saved = localStorage.getItem('microsplit-theme') as Theme | null;
    const initial = saved || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    setTheme(initial);
    setTargetTheme(initial);
    document.documentElement.setAttribute('data-theme', initial);
  }, []);

  const toggleTheme = useCallback(() => {
    if (isCurtainActive) return;
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTargetTheme(next);
    setIsCurtainActive(true);

    // Swap theme attribute halfway through curtain closure
    setTimeout(() => {
      setTheme(next);
      localStorage.setItem('microsplit-theme', next);
      document.documentElement.setAttribute('data-theme', next);
    }, 320);

    // Retract curtains
    setTimeout(() => {
      setIsCurtainActive(false);
    }, 750);
  }, [theme, isCurtainActive]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isCurtainActive }}>
      {children}
      <VaultCurtainTransition
        isActive={isCurtainActive}
        targetTheme={targetTheme}
        onComplete={() => setIsCurtainActive(false)}
      />
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
export default ThemeProvider;
