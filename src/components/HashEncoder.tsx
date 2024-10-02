import React, { useState } from 'react';
import { FaLock, FaUnlock } from 'react-icons/fa';
import CryptoJS from 'crypto-js';

const HashEncoder: React.FC = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [selectedHash, setSelectedHash] = useState('MD5');
  const [selectedEncode, setSelectedEncode] = useState('Base64');
  const [mode, setMode] = useState<'hash' | 'encode' | 'decode'>('hash');

  const hashAlgorithms = [
    'CRC-16', 'CRC-32', 'MD2', 'MD4', 'MD5', 'SHA1', 'SHA224', 'SHA256', 'SHA384', 'SHA512',
    'SHA512/224', 'SHA512/256', 'SHA3-224', 'SHA3-256', 'SHA3-384', 'SHA3-512',
    'Keccak-224', 'Keccak-256', 'Keccak-384', 'Keccak-512', 'Shake-128', 'Shake-256'
  ];

  const encodeAlgorithms = [
    'Base32', 'Base32 File', 'Base64', 'Base64 File', 'HTML', 'URL'
  ];

  const performHash = () => {
    let result = '';
    switch (selectedHash) {
      case 'CRC-16':
        // CRC-16 implementation needed
        break;
      case 'CRC-32':
        // CRC-32 implementation needed
        break;
      case 'MD2':
        result = CryptoJS.MD2(input).toString();
        break;
      case 'MD4':
        result = CryptoJS.MD4(input).toString();
        break;
      case 'MD5':
        result = CryptoJS.MD5(input).toString();
        break;
      case 'SHA1':
        result = CryptoJS.SHA1(input).toString();
        break;
      case 'SHA224':
        result = CryptoJS.SHA224(input).toString();
        break;
      case 'SHA256':
        result = CryptoJS.SHA256(input).toString();
        break;
      case 'SHA384':
        result = CryptoJS.SHA384(input).toString();
        break;
      case 'SHA512':
        result = CryptoJS.SHA512(input).toString();
        break;
      case 'SHA3-224':
        result = CryptoJS.SHA3(input, { outputLength: 224 }).toString();
        break;
      case 'SHA3-256':
        result = CryptoJS.SHA3(input, { outputLength: 256 }).toString();
        break;
      case 'SHA3-384':
        result = CryptoJS.SHA3(input, { outputLength: 384 }).toString();
        break;
      case 'SHA3-512':
        result = CryptoJS.SHA3(input, { outputLength: 512 }).toString();
        break;
      // Add other hash algorithms as needed
    }
    setOutput(result);
  };

  const performEncode = () => {
    let result = '';
    switch (selectedEncode) {
      case 'Base32':
        // Base32 encoding implementation needed
        break;
      case 'Base64':
        result = btoa(input);
        break;
      case 'HTML':
        result = input.replace(/[&<>"']/g, (match) => {
          const entities: { [key: string]: string } = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
          };
          return entities[match];
        });
        break;
      case 'URL':
        result = encodeURIComponent(input);
        break;
      // Add other encoding algorithms as needed
    }
    setOutput(result);
  };

  const performDecode = () => {
    let result = '';
    switch (selectedEncode) {
      case 'Base32':
        // Base32 decoding implementation needed
        break;
      case 'Base64':
        try {
          result = atob(input);
        } catch (e) {
          result = 'Invalid Base64 input';
        }
        break;
      case 'HTML':
        result = input.replace(/&amp;|&lt;|&gt;|&quot;|&#39;/g, (match) => {
          const entities: { [key: string]: string } = {
            '&amp;': '&',
            '&lt;': '<',
            '&gt;': '>',
            '&quot;': '"',
            '&#39;': "'"
          };
          return entities[match];
        });
        break;
      case 'URL':
        result = decodeURIComponent(input);
        break;
      // Add other decoding algorithms as needed
    }
    setOutput(result);
  };

  const handleProcess = () => {
    switch (mode) {
      case 'hash':
        performHash();
        break;
      case 'encode':
        performEncode();
        break;
      case 'decode':
        performDecode();
        break;
    }
  };

  return (
    <div className="flex flex-col space-y-6 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <div className="flex justify-center space-x-4">
        <button
          onClick={() => setMode('hash')}
          className={`px-4 py-2 rounded ${mode === 'hash' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}
        >
          Hash
        </button>
        <button
          onClick={() => setMode('encode')}
          className={`px-4 py-2 rounded ${mode === 'encode' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}
        >
          Encode
        </button>
        <button
          onClick={() => setMode('decode')}
          className={`px-4 py-2 rounded ${mode === 'decode' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}
        >
          Decode
        </button>
      </div>
      <div className="flex space-x-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">Input</h3>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full h-40 p-2 border rounded resize-none bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
            placeholder="Enter your text here"
          />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">Output</h3>
          <textarea
            value={output}
            readOnly
            className="w-full h-40 p-2 border rounded resize-none bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-200"
          />
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <select
          value={mode === 'hash' ? selectedHash : selectedEncode}
          onChange={(e) => mode === 'hash' ? setSelectedHash(e.target.value) : setSelectedEncode(e.target.value)}
          className="p-2 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
        >
          {mode === 'hash'
            ? hashAlgorithms.map(algo => <option key={algo} value={algo}>{algo}</option>)
            : encodeAlgorithms.map(algo => <option key={algo} value={algo}>{algo}</option>)
          }
        </select>
        <button
          onClick={handleProcess}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 flex items-center"
        >
          {mode === 'decode' ? <FaUnlock className="mr-2" /> : <FaLock className="mr-2" />}
          {mode === 'hash' ? 'Hash' : mode === 'encode' ? 'Encode' : 'Decode'}
        </button>
      </div>
    </div>
  );
};

export default HashEncoder;