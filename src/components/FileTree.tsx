import React, { useState, useEffect } from 'react';
import { FaFolder, FaFile, FaFolderOpen, FaPlus, FaSync, FaExpandAlt, FaCompressAlt } from 'react-icons/fa';
import { invoke } from '@tauri-apps/api/tauri';

interface FileTreeProps {
  setSelectedFile: (file: string) => void;
}

interface FileNode {
  name: string;
  path: string;
  isDir: boolean;
  children?: FileNode[];
}

const FileTree: React.FC<FileTreeProps> = ({ setSelectedFile }) => {
  const [root, setRoot] = useState<FileNode | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadRootFolder();
  }, []);

  const loadRootFolder = async () => {
    try {
      const rootFolder = await invoke('get_root_folder') as string;
      const fileTree = await invoke('get_file_tree', { path: rootFolder }) as FileNode;
      setRoot(fileTree);
    } catch (error) {
      console.error('Error loading root folder:', error);
    }
  };

  const handleFileClick = (file: FileNode) => {
    if (!file.isDir) {
      setSelectedFile(file.path);
    }
  };

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  };

  const renderTree = (node: FileNode) => (
    <div key={node.path} className="ml-4">
      <div
        className="flex items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 p-1"
        onClick={() => node.isDir ? toggleFolder(node.path) : handleFileClick(node)}
      >
        {node.isDir ? (
          expandedFolders.has(node.path) ? <FaFolderOpen className="mr-2" /> : <FaFolder className="mr-2" />
        ) : (
          <FaFile className="mr-2" />
        )}
        <span>{node.name}</span>
      </div>
      {node.isDir && expandedFolders.has(node.path) && node.children?.map(child => renderTree(child))}
    </div>
  );

  return (
    <div className="w-64 h-full border-r border-gray-200 dark:border-gray-700 overflow-auto">
      <div className="flex justify-between p-2 border-b border-gray-200 dark:border-gray-700">
        <button onClick={loadRootFolder} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
          <FaFolder />
        </button>
        <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
          <FaPlus />
        </button>
        <button onClick={loadRootFolder} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
          <FaSync />
        </button>
        <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
          {expandedFolders.size > 0 ? <FaCompressAlt /> : <FaExpandAlt />}
        </button>
      </div>
      {root && renderTree(root)}
    </div>
  );
};

export default FileTree;