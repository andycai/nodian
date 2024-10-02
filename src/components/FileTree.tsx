import React, { useState, useEffect, useRef } from 'react';
import { FaFolder, FaFile, FaFolderOpen, FaPlus, FaSync, FaExpandAlt, FaCompressAlt, FaFolderPlus } from 'react-icons/fa';
import { invoke } from '@tauri-apps/api/tauri';
import { open } from '@tauri-apps/api/dialog';

interface FileTreeProps {
  setSelectedFile: (file: string) => void;
  selectedFile: string | null;
}

interface FileNode {
  name: string;
  path: string;
  is_dir: boolean;
  children: FileNode[];
}

interface CreationState {
  type: 'file' | 'folder' | null;
  parentPath: string | null;
}

const FileTree: React.FC<FileTreeProps> = ({ setSelectedFile, selectedFile }) => {
  const [root, setRoot] = useState<FileNode | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [rootPath, setRootPath] = useState<string>('');
  const [creationState, setCreationState] = useState<CreationState>({ type: null, parentPath: null });
  const [newItemName, setNewItemName] = useState<string>('');
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadRootFolder();
  }, []);

  useEffect(() => {
    if (creationState.type && inputRef.current) {
      inputRef.current.focus();
    }
  }, [creationState]);

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

  const handleNodeClick = (node: FileNode) => {
    if (node.is_dir) {
      toggleFolder(node.path);
    } else {
      setSelectedFile(node.path);
    }
    setSelectedNode(node.path);
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

  const startCreating = (type: 'file' | 'folder') => {
    const parentPath = selectedNode && root?.is_dir ? selectedNode : rootPath;
    setCreationState({ type, parentPath });
    setNewItemName('');
  };

  const handleCreation = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newItemName.trim() !== '') {
      const newPath = `${creationState.parentPath}/${newItemName}`;
      try {
        if (creationState.type === 'file') {
          await invoke('create_file', { path: newPath });
        } else {
          await invoke('create_folder', { path: newPath });
        }
        await loadFileTree(rootPath);
        setExpandedFolders(prev => new Set(prev).add(creationState.parentPath!));
      } catch (error) {
        console.error(`Error creating ${creationState.type}:`, error);
      }
      setCreationState({ type: null, parentPath: null });
    } else if (e.key === 'Escape') {
      setCreationState({ type: null, parentPath: null });
    }
  };

  const sortNodes = (nodes: FileNode[]): FileNode[] => {
    return nodes.sort((a, b) => {
      if (a.is_dir && !b.is_dir) return -1;
      if (!a.is_dir && b.is_dir) return 1;
      return a.name.localeCompare(b.name);
    });
  };

  const renderTree = (node: FileNode) => (
    <div key={node.path} className="ml-4">
      <div
        className={`flex items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 p-1 ${
          node.path === selectedNode ? 'bg-blue-200 dark:bg-blue-700' : ''
        }`}
        onClick={() => handleNodeClick(node)}
      >
        {node.is_dir ? (
          expandedFolders.has(node.path) ? <FaFolderOpen className="mr-2" /> : <FaFolder className="mr-2" />
        ) : (
          <FaFile className="mr-2" />
        )}
        <span>{node.name}</span>
        {node.is_dir && (
          <>
            <button onClick={(e) => { e.stopPropagation(); startCreating('file'); }} className="ml-2 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
              <FaPlus size={12} />
            </button>
            <button onClick={(e) => { e.stopPropagation(); startCreating('folder'); }} className="ml-1 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
              <FaFolderPlus size={12} />
            </button>
          </>
        )}
      </div>
      {node.is_dir && expandedFolders.has(node.path) && (
        <>
          {sortNodes(node.children).map(child => renderTree(child))}
          {creationState.parentPath === node.path && (
            <div className="ml-4 mt-1">
              <input
                ref={inputRef}
                type="text"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                onKeyDown={handleCreation}
                className="w-full p-1 border rounded"
                placeholder={`New ${creationState.type} name...`}
              />
            </div>
          )}
        </>
      )}
    </div>
  );

  return (
    <div className="w-64 h-full border-r border-gray-200 dark:border-gray-700 overflow-auto">
      <div className="flex justify-between p-2 border-b border-gray-200 dark:border-gray-700">
        <button onClick={changeRootFolder} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded" title="Change root folder">
          <FaFolderPlus />
        </button>
        <button onClick={() => startCreating('file')} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded" title="New file">
          <FaPlus />
        </button>
        <button onClick={() => startCreating('folder')} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded" title="New folder">
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