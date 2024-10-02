import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import ReactMarkdown from 'react-markdown';

interface EditorProps {
  selectedFile: string | null;
  openFiles: string[];
  setOpenFiles: React.Dispatch<React.SetStateAction<string[]>>;
}

const Editor: React.FC<EditorProps> = ({ selectedFile, openFiles, setOpenFiles }) => {
  const [content, setContent] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(true);

  useEffect(() => {
    if (selectedFile) {
      loadFileContent(selectedFile);
    }
  }, [selectedFile]);

  const loadFileContent = async (filePath: string) => {
    try {
      const fileContent = await invoke('read_file', { path: filePath }) as string;
      setContent(fileContent);
    } catch (error) {
      console.error('Error loading file content:', error);
    }
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  };

  const handleSave = async () => {
    if (selectedFile) {
      try {
        await invoke('write_file', { path: selectedFile, content });
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

  const closeFile = (file: string) => {
    setOpenFiles(openFiles.filter(f => f !== file));
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {openFiles.map(file => (
          <div
            key={file}
            className={`px-4 py-2 cursor-pointer ${
              file === selectedFile ? 'bg-gray-200 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
            onClick={() => loadFileContent(file)}
          >
            {file.split('/').pop()}
            <button className="ml-2" onClick={() => closeFile(file)}>×</button>
          </div>
        ))}
      </div>
      <div className="flex-1 flex">
        <textarea
          className="flex-1 p-4 resize-none outline-none bg-white dark:bg-gray-900 text-black dark:text-white"
          value={content}
          onChange={handleContentChange}
          onKeyDown={handleKeyDown}
          style={{ display: isEditing ? 'block' : 'none' }}
        />
        <div
          className="flex-1 p-4 overflow-auto bg-white dark:bg-gray-900 text-black dark:text-white"
          style={{ display: isEditing ? 'none' : 'block' }}
        >
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
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