import React, { useState, useEffect, useRef } from 'react';
import { FaFolder, FaFile, FaFolderOpen, FaPlus, FaSync, FaExpandAlt, FaCompressAlt, FaFolderPlus, FaEdit, FaTrash } from 'react-icons/fa';
import { invoke } from '@tauri-apps/api/tauri';
import { open } from '@tauri-apps/api/dialog';

interface FileTreeProps {
  setSelectedFile: (file: string | null) => void;
  selectedFile: string | null;
  openFiles: string[];
  setOpenFiles: React.Dispatch<React.SetStateAction<string[]>>;
  rootPath: string;
  setRootPath: React.Dispatch<React.SetStateAction<string>>;
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

const FileTree: React.FC<FileTreeProps> = ({ setSelectedFile, selectedFile, openFiles, setOpenFiles, rootPath, setRootPath }) => {
  const [root, setRoot] = useState<FileNode | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [creationState, setCreationState] = useState<CreationState>({ type: null, parentPath: null });
  const [newItemName, setNewItemName] = useState<string>('');
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [renamingNode, setRenamingNode] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadRootFolder();
  }, []);

  useEffect(() => {
    if (rootPath) {
      loadFileTree(rootPath);
    }
  }, [rootPath]);

  useEffect(() => {
    if (creationState.type && inputRef.current) {
      inputRef.current.focus();
    }
  }, [creationState]);

  const loadRootFolder = async () => {
    try {
      // 尝试从 localStorage 获取上次保存的工作区目录
      const savedRootFolder = localStorage.getItem('currentWorkingDirectory');
      const rootFolder = savedRootFolder || await invoke('get_root_folder') as string;
      console.log("Root folder:", rootFolder);
      setRootPath(rootFolder);
    } catch (error) {
      console.error('Error loading root folder:', error);
    }
  };

  const loadFileTree = async (path: string) => {
    try {
      console.log("Loading file tree for path:", path);
      const fileTree = await invoke('get_file_tree', { path }) as FileNode;
    //   console.log("File tree:", fileTree);
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
      // 关闭所有打开的文件
      setOpenFiles([]);
      setSelectedFile(null);
      // 保存新的工作区目录到 localStorage
      localStorage.setItem('currentWorkingDirectory', selected as string);
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

  const startRenaming = (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRenamingNode(path);
    setNewItemName(path.split('/').pop() || '');
  };

  const handleRename = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newItemName.trim() !== '' && renamingNode) {
      const newPath = `${renamingNode.substring(0, renamingNode.lastIndexOf('/'))}/${newItemName}`;
      try {
        await invoke('rename_item', { oldPath: renamingNode, newPath });
        await loadFileTree(rootPath);
        setRenamingNode(null);
        
        // 更新打开的文件列表和选中的文件
        setOpenFiles(prev => prev.map(file => file === renamingNode ? newPath : file));
        if (selectedFile === renamingNode) {
          setSelectedFile(newPath);
        }
      } catch (error) {
        console.error('Error renaming item:', error);
      }
    } else if (e.key === 'Escape') {
      setRenamingNode(null);
    }
  };

  const deleteItem = async (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await invoke('delete_item', { path });
        await loadFileTree(rootPath);
        
        // 从打开的文件列表中移除被删除的文件
        setOpenFiles(prev => prev.filter(file => file !== path));
        if (selectedFile === path) {
          setSelectedFile(null);
        }
      } catch (error) {
        console.error('Error deleting item:', error);
      }
    }
  };

  const truncateName = (name: string, maxLength: number = 18) => {
    if (name.length <= maxLength) return name;
    return name.substring(0, maxLength - 3) + '...';
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
        {renamingNode === node.path ? (
          <input
            type="text"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            onKeyDown={handleRename}
            onClick={(e) => e.stopPropagation()}
            className="w-full p-1 border rounded"
          />
        ) : (
          <span title={node.name}>{truncateName(node.name)}</span>
        )}
        <div className="ml-auto">
          {/* <button onClick={(e) => startRenaming(node.path, e)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
            <FaEdit size={12} />
          </button>
          <button onClick={(e) => deleteItem(node.path, e)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
            <FaTrash size={12} />
          </button> */}
          {/* {node.is_dir && (
            <>
              <button onClick={(e) => { e.stopPropagation(); startCreating('file'); }} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
                <FaPlus size={12} />
              </button>
              <button onClick={(e) => { e.stopPropagation(); startCreating('folder'); }} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
                <FaFolderPlus size={12} />
              </button>
            </>
          )} */}
        </div>
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

  const toggleAllFolders = () => {
    if (expandedFolders.size > 0) {
      // 如果有展开的文件夹，则全部收起
      setExpandedFolders(new Set());
    } else if (root) {
      // 如果全部收起，则展开所有文件夹
      const allFolders = getAllFolderPaths(root);
      setExpandedFolders(new Set(allFolders));
    }
  };

  const getAllFolderPaths = (node: FileNode): string[] => {
    let paths: string[] = [];
    if (node.is_dir) {
      paths.push(node.path);
      node.children.forEach(child => {
        paths = paths.concat(getAllFolderPaths(child));
      });
    }
    return paths;
  };

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
          onClick={toggleAllFolders}
          title={expandedFolders.size > 0 ? "Collapse all" : "Expand all"}
        >
          {expandedFolders.size > 0 ? <FaCompressAlt /> : <FaExpandAlt />}
        </button>
        {selectedNode && (
          <>
            <button onClick={(e) => startRenaming(selectedNode, e)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded" title="Rename">
              <FaEdit />
            </button>
            <button onClick={(e) => deleteItem(selectedNode, e)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded" title="Delete">
              <FaTrash />
            </button>
          </>
        )}
      </div>
      {root ? renderTree(root) : <div>Loading...</div>}
    </div>
  );
};

export default FileTree;