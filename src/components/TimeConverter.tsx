import React, { useState } from 'react';
import { FaExchangeAlt, FaClock, FaCalendarAlt } from 'react-icons/fa';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

const TimeConverter: React.FC = () => {
  const [timestamp, setTimestamp] = useState('');
  const [dateTime, setDateTime] = useState<Date | null>(null);
  const [isMilliseconds, setIsMilliseconds] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const convertTimestampToDateTime = () => {
    try {
      const ts = parseInt(timestamp);
      if (isNaN(ts)) {
        throw new Error('Invalid timestamp');
      }
      const date = new Date(isMilliseconds ? ts : ts * 1000);
      setDateTime(date);
      setError(null);
    } catch (err) {
      setError('Invalid timestamp');
      setDateTime(null);
    }
  };

  const convertDateTimeToTimestamp = () => {
    if (!dateTime) {
      setError('Please select a date and time');
      setTimestamp('');
      return;
    }
    try {
      const ts = isMilliseconds ? dateTime.getTime() : Math.floor(dateTime.getTime() / 1000);
      setTimestamp(ts.toString());
      setError(null);
    } catch (err) {
      setError('Invalid date/time');
      setTimestamp('');
    }
  };

  return (
    <div className="flex flex-col space-y-6 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <div className="flex items-center justify-center space-x-4">
        <label className="flex items-center cursor-pointer">
          <input
            type="radio"
            checked={isMilliseconds}
            onChange={() => setIsMilliseconds(true)}
            className="form-radio text-blue-600"
          />
          <span className="ml-2 text-gray-700 dark:text-gray-300">Milliseconds</span>
        </label>
        <label className="flex items-center cursor-pointer">
          <input
            type="radio"
            checked={!isMilliseconds}
            onChange={() => setIsMilliseconds(false)}
            className="form-radio text-blue-600"
          />
          <span className="ml-2 text-gray-700 dark:text-gray-300">Seconds</span>
        </label>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center">
            <FaClock className="mr-2" /> Timestamp
          </h3>
          <input
            type="text"
            value={timestamp}
            onChange={(e) => setTimestamp(e.target.value)}
            className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500"
            placeholder="Enter timestamp"
          />
          <button
            onClick={convertTimestampToDateTime}
            className="w-full mt-2 p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition duration-300 flex items-center justify-center"
          >
            <FaExchangeAlt className="mr-2" /> Convert to Date/Time
          </button>
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center">
            <FaCalendarAlt className="mr-2" /> Date/Time
          </h3>
          <DatePicker
            selected={dateTime}
            onChange={(date: Date) => setDateTime(date)}
            showTimeInput
            timeInputLabel="Time:"
            dateFormat="yyyy-MM-dd HH:mm:ss"
            className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500"
            placeholderText="Select date and time"
          />
          <button
            onClick={convertDateTimeToTimestamp}
            className="w-full mt-2 p-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition duration-300 flex items-center justify-center"
          >
            <FaExchangeAlt className="mr-2" /> Convert to Timestamp
          </button>
        </div>
      </div>
      {error && <p className="text-red-500 text-center">{error}</p>}
    </div>
  );
};

export default TimeConverter;