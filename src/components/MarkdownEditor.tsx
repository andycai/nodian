import React, { useState, useEffect } from 'react';
import FileTree from './FileTree';
import Editor from './Editor';
import { invoke } from '@tauri-apps/api/tauri';

const MarkdownEditor: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [openFiles, setOpenFiles] = useState<string[]>(() => {
    const savedFiles = localStorage.getItem('openFiles');
    return savedFiles ? JSON.parse(savedFiles) : [];
  });
  const [rootPath, setRootPath] = useState<string>('');

  useEffect(() => {
    const loadInitialRootPath = async () => {
      const savedRootPath = localStorage.getItem('currentWorkingDirectory');
      if (savedRootPath) {
        setRootPath(savedRootPath);
      } else {
        const defaultRootPath = await invoke('get_root_folder') as string;
        setRootPath(defaultRootPath);
      }
    };
    loadInitialRootPath();
  }, []);

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