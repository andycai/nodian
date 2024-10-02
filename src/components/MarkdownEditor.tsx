import React, { useState, useEffect } from 'react';
import FileTree from './FileTree';
import Editor from './Editor';

const MarkdownEditor: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [openFiles, setOpenFiles] = useState<string[]>(() => {
    const savedFiles = localStorage.getItem('openFiles');
    return savedFiles ? JSON.parse(savedFiles) : [];
  });

  useEffect(() => {
    localStorage.setItem('openFiles', JSON.stringify(openFiles));
  }, [openFiles]);

  useEffect(() => {
    if (selectedFile && !openFiles.includes(selectedFile)) {
      setOpenFiles(prev => [...prev, selectedFile]);
    }
  }, [selectedFile, openFiles]);

  return (
    <div className="flex h-full">
      <div className="w-64 border-r border-gray-200 dark:border-gray-700">
        <FileTree setSelectedFile={setSelectedFile} selectedFile={selectedFile} />
      </div>
      <div className="flex-1">
        <Editor 
          selectedFile={selectedFile} 
          setSelectedFile={setSelectedFile}
          openFiles={openFiles} 
          setOpenFiles={setOpenFiles}
        />
      </div>
    </div>
  );
};

export default MarkdownEditor;