import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';

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

//   useEffect(() => {
//     openFiles.forEach(file => {
//       if (!fileContents[file]) {
//         loadFileContent(file);
//       }
//     });
//   }, [openFiles]);

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

  const markdownComponents = {
    h1: ({node, ...props}) => <h1 style={{fontSize: '2.5em', borderBottom: '1px solid #eaecef', paddingBottom: '.3em', marginTop: '24px', marginBottom: '16px'}} {...props}/>,
    h2: ({node, ...props}) => <h2 style={{fontSize: '2em', borderBottom: '1px solid #eaecef', paddingBottom: '.3em', marginTop: '24px', marginBottom: '16px'}} {...props}/>,
    h3: ({node, ...props}) => <h3 style={{fontSize: '1.5em', marginTop: '24px', marginBottom: '16px'}} {...props}/>,
    h4: ({node, ...props}) => <h4 style={{fontSize: '1.25em', marginTop: '24px', marginBottom: '16px'}} {...props}/>,
    h5: ({node, ...props}) => <h5 style={{fontSize: '1em', marginTop: '24px', marginBottom: '16px'}} {...props}/>,
    h6: ({node, ...props}) => <h6 style={{fontSize: '0.875em', marginTop: '24px', marginBottom: '16px'}} {...props}/>,
    p: ({node, ...props}) => <p style={{marginTop: '0', marginBottom: '16px'}} {...props}/>,
    a: ({node, ...props}) => <a style={{color: '#0366d6', textDecoration: 'none'}} {...props}/>,
    ul: ({node, ...props}) => <ul style={{paddingLeft: '2em', marginBottom: '16px'}} {...props}/>,
    ol: ({node, ...props}) => <ol style={{paddingLeft: '2em', marginBottom: '16px'}} {...props}/>,
    li: ({node, ...props}) => <li style={{marginTop: '0.25em'}} {...props}/>,
    blockquote: ({node, ...props}) => <blockquote style={{padding: '0 1em', color: '#6a737d', borderLeft: '0.25em solid #dfe2e5', marginBottom: '16px'}} {...props}/>,
    code: ({node, inline, ...props}) => 
      inline 
        ? <code style={{background: 'rgba(27,31,35,.05)', padding: '.2em .4em', borderRadius: '3px', fontSize: '85%', fontFamily: 'SFMono-Regular,Consolas,Liberation Mono,Menlo,monospace'}} {...props}/>
        : <pre style={{background: '#f6f8fa', padding: '16px', overflow: 'auto', fontSize: '85%', lineHeight: '1.45', borderRadius: '3px', marginBottom: '16px'}}><code style={{fontFamily: 'SFMono-Regular,Consolas,Liberation Mono,Menlo,monospace'}} {...props}/></pre>,
    img: ({node, ...props}) => <img style={{maxWidth: '100%', boxSizing: 'content-box'}} {...props} />
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        {openFiles.map(file => (
          <div
            key={file}
            className={`px-4 py-2 cursor-pointer flex items-center whitespace-nowrap ${
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
      <div className="flex-1 flex overflow-hidden">
        {selectedFile && (
          <>
            <textarea
              className="flex-1 p-4 resize-none outline-none bg-white dark:bg-gray-900 text-black dark:text-white overflow-auto"
              value={fileContents[selectedFile]?.content || ''}
              onChange={handleContentChange}
              onKeyDown={handleKeyDown}
              style={{ display: isEditing ? 'block' : 'none' }}
            />
            <div
              className="flex-1 p-4 overflow-auto bg-white dark:bg-gray-900 text-black dark:text-white"
              style={{ display: isEditing ? 'none' : 'block' }}
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw, rehypeSanitize]}
                components={markdownComponents}
              >
                {fileContents[selectedFile]?.content || ''}
              </ReactMarkdown>
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