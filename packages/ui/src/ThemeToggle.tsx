'use client';

import { useEffect, useState } from 'react';
import { cn } from './utils';
import { Sun, Moon } from 'lucide-react';

export interface ThemeToggleProps {
  theme?: 'light' | 'dark';
  onThemeToggle?: (newTheme: 'light' | 'dark') => void;
  className?: string;
}

export function ThemeToggle({ theme: controlledTheme, onThemeToggle, className }: ThemeToggleProps) {
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Read persisted theme on mount
    const saved = localStorage.getItem('grievease_theme') as 'light' | 'dark' | null;
    const initial = saved || (document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    setCurrentTheme(initial);
    if (initial === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    setMounted(true);
  }, []);

  const activeTheme = controlledTheme !== undefined ? controlledTheme : currentTheme;

  const handleToggle = () => {
    const nextTheme: 'light' | 'dark' = activeTheme === 'dark' ? 'light' : 'dark';
    if (controlledTheme === undefined) {
      setCurrentTheme(nextTheme);
      localStorage.setItem('grievease_theme', nextTheme);
      if (nextTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    onThemeToggle?.(nextTheme);
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={activeTheme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
      className={cn(
        'min-h-[44px] min-w-[44px] p-2.5 rounded-2xl flex items-center justify-center transition-all',
        'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700',
        'hover:text-teal-600 dark:hover:text-teal-400 hover:border-teal-400/50 shadow-xs',
        'focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-1',
        className
      )}
    >
      {mounted && activeTheme === 'dark' ? (
        <Sun className="w-5 h-5 text-amber-400" aria-hidden="true" />
      ) : (
        <Moon className="w-5 h-5 text-slate-600 dark:text-slate-300" aria-hidden="true" />
      )}
    </button>
  );
}
