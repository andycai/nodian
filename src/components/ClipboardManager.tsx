import React, { useState, useEffect } from 'react';
import { FaCopy, FaTrash } from 'react-icons/fa';
import { invoke } from '@tauri-apps/api/core';

interface ClipboardItem {
  id: number;
  content: string;
  timestamp: number;
}

const MAX_CLIPBOARD_ITEMS = 100;

const ClipboardManager: React.FC = () => {
  const [clipboardItems, setClipboardItems] = useState<ClipboardItem[]>([]);
  const [currentClipboard, setCurrentClipboard] = useState<string>('');

  useEffect(() => {
    // 从 localStorage 加载保存的剪贴板项目
    const savedItems = localStorage.getItem('clipboardItems');
    if (savedItems) {
      setClipboardItems(JSON.parse(savedItems).slice(0, MAX_CLIPBOARD_ITEMS));
    }

    const intervalId = setInterval(checkClipboard, 1000);
    return () => clearInterval(intervalId);
  }, []);

  const checkClipboard = async () => {
    try {
      const content = await invoke<string>('get_clipboard_content');

      // 如果当前的剪贴板内容已经被删除，则不进行任何操作
      if (localStorage.getItem("deletedCurrentClipboard") === content) {
        return;
      }

      // 如果当前的剪贴板内容发生变化，则更新当前剪贴板内容
      if (content !== currentClipboard && content.trim() !== '') {
        setCurrentClipboard(content);
        addClipboardItem(content);
      }
    } catch (error) {
      console.error('Failed to get clipboard content:', error);
    }
  };

  const addClipboardItem = (content: string) => {
    setClipboardItems(prevItems => {
      const existingItemIndex = prevItems.findIndex(item => item.content === content);
      let newItems;

      if (existingItemIndex !== -1) {
        // 如果项目已存在，更新其时间戳并将其移到顶部
        const updatedItem = { ...prevItems[existingItemIndex], timestamp: Date.now() };
        newItems = [updatedItem, ...prevItems.filter((_, index) => index !== existingItemIndex)];
      } else {
        // 如果是新项目，添加到顶部
        const newItem: ClipboardItem = {
          id: Date.now(),
          content,
          timestamp: Date.now(),
        };
        newItems = [newItem, ...prevItems];
      }

      // 只保留最近的100个项目
      newItems = newItems.slice(0, MAX_CLIPBOARD_ITEMS);

      // 保存到 localStorage
      localStorage.setItem('clipboardItems', JSON.stringify(newItems));

      return newItems;
    });
  };

  const copyToClipboard = async (content: string) => {
    try {
      await invoke('set_clipboard_content', { content });
      setCurrentClipboard(content);
      addClipboardItem(content); // 更新列表顺序
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const deleteClipboardItem = (id: number, content: string) => {
    setClipboardItems(items => {
      const newItems = items.filter(item => item.id !== id);
     
      if (content === currentClipboard && content.trim() !== '') {
        localStorage.setItem('deletedCurrentClipboard', content);
      }
      localStorage.setItem('clipboardItems', JSON.stringify(newItems));
      return newItems;
    });
  };

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">Clipboard Manager</h2>
      {clipboardItems.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-400">No clipboard history yet. Copy something to see it here!</p>
      ) : (
        <ul className="space-y-2">
          {clipboardItems.map(item => (
            <li key={item.id} className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-700 rounded">
              <span className="text-gray-800 dark:text-gray-200 truncate flex-grow mr-2">{item.content}</span>
              <div className="flex items-center">
                <button
                  onClick={() => copyToClipboard(item.content)}
                  className="p-1 text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
                  title="Copy to clipboard"
                >
                  <FaCopy />
                </button>
                <button
                  onClick={() => deleteClipboardItem(item.id, item.content)}
                  className="p-1 text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 ml-2"
                  title="Delete item"
                >
                  <FaTrash />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ClipboardManager;