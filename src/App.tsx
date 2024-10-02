import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import MarkdownEditor from './components/MarkdownEditor';
import JsonFormatter from './components/JsonFormatter';
import TimeConverter from './components/TimeConverter';
import HashEncoder from './components/HashEncoder';
import ClipboardManager from './components/ClipboardManager';
import Calendar from './components/Calendar';

const App: React.FC = () => {
  const [activeFeature, setActiveFeature] = useState<string>('markdown');

  return (
    <div className="flex h-screen bg-white dark:bg-gray-900">
      <Sidebar setActiveFeature={setActiveFeature} />
      <div className="flex-1 overflow-hidden">
        {activeFeature === 'markdown' && <MarkdownEditor />}
        {activeFeature === 'json' && (
          <div className="p-4">
            <JsonFormatter
              initialContent=""
              onContentChange={(newContent) => {
                // Handle content change if needed
                console.log(newContent);
              }}
            />
          </div>
        )}
        {activeFeature === 'time' && <TimeConverter />}
        {activeFeature === 'hash' && <HashEncoder />}
        {activeFeature === 'clipboard' && <ClipboardManager />}
        {activeFeature === 'calendar' && <Calendar />}
      </div>
    </div>
  );
};

export default App;
