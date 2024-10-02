import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface SidebarProps {
  setActiveFeature: (feature: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ setActiveFeature }) => {
  const { theme, toggleTheme } = useTheme();
  const features = [
    { id: 'markdown', icon: '📝', label: 'Markdown' },
    { id: 'calendar', icon: '📅', label: 'Calendar' },
    { id: 'json', icon: '🔧', label: 'JSON' },
    { id: 'timestamp', icon: '⏱️', label: 'Timestamp' },
    { id: 'hash', icon: '🔒', label: 'Hash' },
    { id: 'clipboard', icon: '📋', label: 'Clipboard' },
  ];

  return (
    <div className="w-16 bg-gray-100 dark:bg-gray-800 p-2">
      {features.map((feature) => (
        <button
          key={feature.id}
          className="w-full p-2 mb-2 text-center hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
          onClick={() => setActiveFeature(feature.id)}
        >
          <span role="img" aria-label={feature.label}>
            {feature.icon}
          </span>
        </button>
      ))}
      <button
        className="w-full p-2 mb-2 text-center hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
        onClick={toggleTheme}
      >
        <span role="img" aria-label="Theme">
          {theme === 'light' ? '🌙' : '☀️'}
        </span>
      </button>
    </div>
  );
};

export default Sidebar;