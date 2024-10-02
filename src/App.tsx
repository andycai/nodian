import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import MarkdownEditor from './components/MarkdownEditor';

const App: React.FC = () => {
  const [activeFeature, setActiveFeature] = useState<string>('markdown');

  return (
    <div className="flex h-screen bg-white dark:bg-gray-900">
      <Sidebar setActiveFeature={setActiveFeature} />
      <div className="flex-1 overflow-hidden">
        {activeFeature === 'markdown' && <MarkdownEditor />}
        {/* 其他功能组件将在这里添加 */}
      </div>
    </div>
  );
};

export default App;
