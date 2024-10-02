import React, { useState, useEffect } from 'react';
import { FaFolder, FaFile, FaFolderOpen, FaPlus, FaSync, FaExpandAlt, FaCompressAlt, FaFolderPlus } from 'react-icons/fa';
import { invoke } from '@tauri-apps/api/tauri';
import { open } from '@tauri-apps/api/dialog';

interface FileTreeProps {
  setSelectedFile: (file: string) => void;
}

interface FileNode {
  name: string;
  path: string;
  is_dir: boolean;  // 改为 is_dir 以匹配后端
  children: FileNode[];
}

const FileTree: React.FC<FileTreeProps> = ({ setSelectedFile }) => {
  const [root, setRoot] = useState<FileNode | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [rootPath, setRootPath] = useState<string>('');

  useEffect(() => {
    loadRootFolder();
  }, []);

  const loadRootFolder = async () => {
    try {
      const rootFolder = await invoke('get_root_folder') as string;
      console.log("Root folder:", rootFolder);
      setRootPath(rootFolder);
      await loadFileTree(rootFolder);
    } catch (error) {
      console.error('Error loading root folder:', error);
    }
  };

  const loadFileTree = async (path: string) => {
    try {
      console.log("Loading file tree for path:", path);
      const fileTree = await invoke('get_file_tree', { path }) as FileNode;
      console.log("File tree:", fileTree);
      setRoot(fileTree);
      setExpandedFolders(new Set([fileTree.path]));
    } catch (error) {
      console.error('Error loading file tree:', error);
    }
  };

  const handleFileClick = (file: FileNode) => {
    if (!file.is_dir) {
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

  const changeRootFolder = async () => {
    const selected = await open({
      directory: true,
      multiple: false,
      defaultPath: rootPath,
    });
    if (selected) {
      setRootPath(selected as string);
      console.log("selected: ", selected);
      await loadFileTree(selected as string);
    }
  };

  const createNewFolder = async () => {
    const folderName = prompt("Enter new folder name:");
    if (folderName) {
      try {
        await invoke('create_folder', { path: `${rootPath}/${folderName}` });
        await loadFileTree(rootPath);
      } catch (error) {
        console.error('Error creating new folder:', error);
      }
    }
  };

  const renderTree = (node: FileNode) => (
    <div key={node.path} className="ml-4">
      <div
        className="flex items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 p-1"
        onClick={() => node.is_dir ? toggleFolder(node.path) : handleFileClick(node)}
      >
        {node.is_dir ? (
          expandedFolders.has(node.path) ? <FaFolderOpen className="mr-2" /> : <FaFolder className="mr-2" />
        ) : (
          <FaFile className="mr-2" />
        )}
        <span>{node.name}</span>
      </div>
      {node.is_dir && expandedFolders.has(node.path) && node.children.map(child => renderTree(child))}
    </div>
  );

  return (
    <div className="w-64 h-full border-r border-gray-200 dark:border-gray-700 overflow-auto">
      <div className="flex justify-between p-2 border-b border-gray-200 dark:border-gray-700">
        <button onClick={changeRootFolder} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded" title="Change root folder">
          <FaFolderPlus />
        </button>
        <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded" title="New file">
          <FaPlus />
        </button> 
        <button onClick={createNewFolder} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded" title="New folder">
          <FaFolder />
        </button>
        <button onClick={() => loadFileTree(rootPath)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded" title="Refresh">
          <FaSync />
        </button>
        <button
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
          onClick={() => setExpandedFolders(expandedFolders.size > 0 ? new Set() : new Set(Object.keys(root || {})))}
          title={expandedFolders.size > 0 ? "Collapse all" : "Expand all"}
        >
          {expandedFolders.size > 0 ? <FaCompressAlt /> : <FaExpandAlt />}
        </button>
      </div>
      {root ? renderTree(root) : <div>Loading...</div>}
    </div>
  );
};

export default FileTree;