import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from './ThemeContext.jsx';
import './ThemeToggle.css';

export default function ThemeToggle({ className = '' }) {
  const { theme, toggle } = useTheme();
  const dark = theme === 'dark';
  return (
    <button
      type="button"
      className={`ox-theme-toggle ${dark ? 'is-dark' : 'is-light'} ${className}`}
      onClick={toggle}
      role="switch"
      aria-checked={dark}
      aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={dark ? 'Light theme' : 'Dark theme'}
    >
      <span className="ox-theme-track">
        <Sun className="ox-theme-sun" size={14} />
        <Moon className="ox-theme-moon" size={14} />
        <span className="ox-theme-thumb" />
      </span>
    </button>
  );
}
