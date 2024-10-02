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
      <FileTree setSelectedFile={setSelectedFile} />
      <Editor selectedFile={selectedFile} openFiles={openFiles} setOpenFiles={setOpenFiles} />
    </div>
  );
};

export default MarkdownEditor;