import React, { useState, useEffect } from 'react';
import FileTree from './FileTree';
import Editor from './Editor';
import { invoke } from '@tauri-apps/api/core';

const MarkdownEditor: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [openFiles, setOpenFiles] = useState<string[]>(() => {
    const savedFiles = localStorage.getItem('openFiles');
    return savedFiles ? JSON.parse(savedFiles) : [];
  });
  const [rootPath, setRootPath] = useState<string>('');

  useEffect(() => {
    const loadInitialState = async () => {
      const savedRootPath = localStorage.getItem('currentWorkingDirectory');
      const savedOpenFiles = localStorage.getItem('openFiles');
      const savedSelectedFile = localStorage.getItem('selectedFile');

      if (savedRootPath) {
        setRootPath(savedRootPath);
      } else {
        const defaultRootPath = await invoke('get_root_folder') as string;
        setRootPath(defaultRootPath);
      }

      if (savedSelectedFile) {
        setSelectedFile(savedSelectedFile);
      }
    };
    loadInitialState();
  }, []);

  useEffect(() => {
    localStorage.setItem('openFiles', JSON.stringify(openFiles));
  }, [openFiles]);

  useEffect(() => {
    if (selectedFile) {
      localStorage.setItem('selectedFile', selectedFile);
      if (!openFiles.includes(selectedFile)) {
        setOpenFiles(prev => [...prev, selectedFile]);
      }
    }
  }, [selectedFile]);

  return (
    <div className="flex h-full">
      <div className="w-64 border-r border-gray-200 dark:border-gray-700">
        <FileTree 
          setSelectedFile={setSelectedFile} 
          selectedFile={selectedFile}
          openFiles={openFiles}
          setOpenFiles={setOpenFiles}
          rootPath={rootPath}
          setRootPath={setRootPath}
        />
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