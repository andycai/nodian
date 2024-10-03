import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';

interface ClipboardRecord {
  id: number;
  content: string;
  timestamp: number;
}

const ClipboardHistory: React.FC = () => {
  const [clipboardHistory, setClipboardHistory] = useState<ClipboardRecord[]>([]);

  const fetchClipboardHistory = async () => {
    try {
      const history = await invoke('get_clipboard_history');
      setClipboardHistory(history as ClipboardRecord[]);
    } catch (error) {
      console.error('Error fetching clipboard history:', error);
    }
  };

  const addClipboardRecord = async (content: string) => {
    try {
      await invoke('add_clipboard_record', { content });
      fetchClipboardHistory();
    } catch (error) {
      console.error('Error adding clipboard record:', error);
    }
  };

  const deleteLatestRecord = async () => {
    try {
      await invoke('delete_latest_clipboard_record');
      fetchClipboardHistory();
    } catch (error) {
      console.error('Error deleting latest clipboard record:', error);
    }
  };

  useEffect(() => {
    fetchClipboardHistory();
  }, []);

  return (
    <div>
      <h2>Clipboard History</h2>
      <button onClick={() => addClipboardRecord('New clipboard content')}>
        Add New Record
      </button>
      <button onClick={deleteLatestRecord}>Delete Latest Record</button>
      <ul>
        {clipboardHistory.map((record) => (
          <li key={record.id}>
            {record.content} - {new Date(record.timestamp * 1000).toLocaleString()}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ClipboardHistory;