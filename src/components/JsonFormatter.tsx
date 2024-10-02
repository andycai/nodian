import React, { useState, useEffect } from 'react';
import { FaExpandAlt, FaCompressAlt } from 'react-icons/fa';

interface JsonFormatterProps {
  initialContent: string;
  onContentChange: (newContent: string) => void;
}

const JsonFormatter: React.FC<JsonFormatterProps> = ({ initialContent, onContentChange }) => {
  const [input, setInput] = useState(initialContent);
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setInput(initialContent);
  }, [initialContent]);

  const formatJson = (compress: boolean) => {
    try {
      // 替换全角双引号为英文双引号
        const normalizedInput = input.replace(/”/g, '"').replace(/“/g, '"');
      const parsedJson = JSON.parse(normalizedInput);
      const formattedJson = JSON.stringify(parsedJson, null, compress ? 0 : 2);
      setOutput(formattedJson);
      onContentChange(formattedJson);
      setError(null);
    } catch (err) {
      setError('Invalid JSON');
      setOutput('');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex space-x-2">
        <button
          onClick={() => formatJson(false)}
          className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center"
          title="Format JSON"
        >
          <FaExpandAlt className="mr-1" /> Format
        </button>
        <button
          onClick={() => formatJson(true)}
          className="p-2 bg-green-500 text-white rounded hover:bg-green-600 flex items-center"
          title="Compress JSON"
        >
          <FaCompressAlt className="mr-1" /> Compress
        </button>
      </div>
      {error && <span className="text-red-500">{error}</span>}
      <div className="flex space-x-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-2">Input</h3>
          <textarea
            value={input}
            onChange={handleInputChange}
            className="w-full h-64 p-2 border rounded resize-none bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
            placeholder="Enter your JSON here"
          />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-2">Output</h3>
          <pre className="w-full h-64 p-2 border rounded overflow-auto bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
            {output}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default JsonFormatter;