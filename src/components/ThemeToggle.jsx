import React, { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(null);

  useEffect(() => {
    const system = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const userPref = localStorage.theme;
    setIsDark(
      userPref === 'dark' ? true :
      userPref === 'light' ? false :
      system
    );
  }, []);

  useEffect(() => {
    if (isDark === null) return;
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.theme = isDark ? 'dark' : 'light';
  }, [isDark]);

  if (isDark === null) return null;

  return (
    <button
      onClick={() => setIsDark((d) => !d)}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      
      className={`
        flex items-center justify-center ml-1 p-2 transition
        rounded-full border border-gray-300 dark:border-gray-700
        shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500
        bg-white bg-opacity-80 dark:bg-gray-900 dark:bg-opacity-80
      `}
      style={{
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
      }}
    >
      {isDark ? (
        <Sun className="w-5 h-5 text-yellow-400" aria-hidden="true" />
      ) : (
        <Moon className="w-5 h-5 text-violet-600" aria-hidden="true" />
      )}
    </button>
  );
}
