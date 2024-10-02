import React, { useState, useEffect } from 'react';
import FileTree from './FileTree';
import Editor from './Editor';

const MarkdownEditor: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [openFiles, setOpenFiles] = useState<string[]>([]);

  useEffect(() => {
    if (selectedFile && !openFiles.includes(selectedFile)) {
      setOpenFiles(prev => [...prev, selectedFile]);
    }
  }, [selectedFile, openFiles]);

  return (
    <div className="flex h-full">
      <div className="w-64 border-r border-gray-200 dark:border-gray-700">
        <FileTree setSelectedFile={setSelectedFile} />
      </div>
      <div className="flex-1">
        <Editor selectedFile={selectedFile} openFiles={openFiles} setOpenFiles={setOpenFiles} />
      </div>
    </div>
  );
};

export default MarkdownEditor;