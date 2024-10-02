import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { FaMarkdown, FaCalendar, FaCode, FaClock, FaLock, FaClipboard, FaMoon, FaSun } from 'react-icons/fa';

interface SidebarProps {
  setActiveFeature: (feature: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ setActiveFeature }) => {
  const { theme, toggleTheme } = useTheme();
  const features = [
    { id: 'markdown', icon: FaMarkdown, label: 'Markdown' },
    { id: 'calendar', icon: FaCalendar, label: 'Calendar' },
    { id: 'json', icon: FaCode, label: 'JSON' },
    { id: 'time_converter', icon: FaClock, label: 'TimeConverter' },
    { id: 'hash', icon: FaLock, label: 'Hash' },
    { id: 'clipboard', icon: FaClipboard, label: 'Clipboard' },
  ];

  return (
    <div className="w-16 bg-gray-100 dark:bg-gray-800 flex flex-col items-center py-4">
      {features.map((feature) => (
        <button
          key={feature.id}
          className="w-12 h-12 mb-4 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
          onClick={() => setActiveFeature(feature.id)}
          title={feature.label}
        >
          <feature.icon size={24} />
        </button>
      ))}
      <button
        className="w-12 h-12 mt-auto flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
        onClick={toggleTheme}
        title="Toggle Theme"
      >
        {theme === 'light' ? <FaMoon size={24} /> : <FaSun size={24} />}
      </button>
    </div>
  );
};

export default Sidebar;