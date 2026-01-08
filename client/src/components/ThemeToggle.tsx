import React from 'react';
import useTheme from '../hooks/useTheme'; // Generate hook

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  return (
    <button onClick={toggleTheme} className="text-2xl hover:scale-110 active:scale-95 transition-premium p-2 rounded-full hover:bg-white/10">
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
};

export default ThemeToggle;