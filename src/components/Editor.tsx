import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import ReactMarkdown from 'react-markdown';

interface EditorProps {
  selectedFile: string | null;
  setSelectedFile: React.Dispatch<React.SetStateAction<string | null>>;
  openFiles: string[];
  setOpenFiles: React.Dispatch<React.SetStateAction<string[]>>;
}

interface FileContent {
  content: string;
  isModified: boolean;
}

const Editor: React.FC<EditorProps> = ({ selectedFile, setSelectedFile, openFiles, setOpenFiles }) => {
  const [fileContents, setFileContents] = useState<Record<string, FileContent>>({});
  const [isEditing, setIsEditing] = useState<boolean>(true);

  useEffect(() => {
    if (selectedFile && !fileContents[selectedFile]) {
      loadFileContent(selectedFile);
    }
  }, [selectedFile]);

  const loadFileContent = async (filePath: string) => {
    try {
      const content = await invoke('read_file', { path: filePath }) as string;
      setFileContents(prev => ({
        ...prev,
        [filePath]: { content, isModified: false }
      }));
    } catch (error) {
      console.error('Error loading file content:', error);
    }
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (selectedFile) {
      setFileContents(prev => ({
        ...prev,
        [selectedFile]: { content: e.target.value, isModified: true }
      }));
    }
  };

  const handleSave = async () => {
    if (selectedFile) {
      try {
        await invoke('write_file', { path: selectedFile, content: fileContents[selectedFile].content });
        setFileContents(prev => ({
          ...prev,
          [selectedFile]: { ...prev[selectedFile], isModified: false }
        }));
        console.log('File saved successfully');
      } catch (error) {
        console.error('Error saving file:', error);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      handleSave();
    }
  };

  const closeFile = (file: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenFiles(prev => prev.filter(f => f !== file));
    setFileContents(prev => {
      const newContents = { ...prev };
      delete newContents[file];
      return newContents;
    });
    if (selectedFile === file) {
      const index = openFiles.indexOf(file);
      if (index > 0) {
        setSelectedFile(openFiles[index - 1]);
      } else if (openFiles.length > 1) {
        setSelectedFile(openFiles[1]);
      } else {
        setSelectedFile(null);
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {openFiles.map(file => (
          <div
            key={file}
            className={`px-4 py-2 cursor-pointer flex items-center ${
              file === selectedFile ? 'bg-gray-200 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
            onClick={() => setSelectedFile(file)}
          >
            <span>{file.split('/').pop()}</span>
            {fileContents[file]?.isModified && <span className="ml-2 text-red-500">*</span>}
            <button 
              className="ml-2 px-1 rounded hover:bg-red-500 hover:text-white"
              onClick={(e) => closeFile(file, e)}
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <div className="flex-1 flex">
        {selectedFile && (
          <>
            <textarea
              className="flex-1 p-4 resize-none outline-none bg-white dark:bg-gray-900 text-black dark:text-white"
              value={fileContents[selectedFile]?.content || ''}
              onChange={handleContentChange}
              onKeyDown={handleKeyDown}
              style={{ display: isEditing ? 'block' : 'none' }}
            />
            <div
              className="flex-1 p-4 overflow-auto bg-white dark:bg-gray-900 text-black dark:text-white"
              style={{ display: isEditing ? 'none' : 'block' }}
            >
              <ReactMarkdown>{fileContents[selectedFile]?.content || ''}</ReactMarkdown>
            </div>
          </>
        )}
      </div>
      <div className="flex justify-between p-2 border-t border-gray-200 dark:border-gray-700">
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? 'Preview' : 'Edit'}
        </button>
        <button
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          onClick={handleSave}
        >
          Save
        </button>
      </div>
    </div>
  );
};

export default Editor;