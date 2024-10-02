import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, addDays } from 'date-fns';
import { FaChevronLeft, FaChevronRight, FaPlus } from 'react-icons/fa';

interface Event {
  id: number;
  title: string;
  description: string;
  date: string;
}

const Calendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDescription, setNewEventDescription] = useState('');

  useEffect(() => {
    fetchEvents();
  }, [selectedDate]);

  const fetchEvents = async () => {
    try {
      const fetchedEvents = await invoke<Event[]>('get_events', { date: format(selectedDate, 'yyyy-MM-dd') });
      setEvents(fetchedEvents);
    } catch (error) {
      console.error('Failed to fetch events:', error);
    }
  };

  const addEvent = async () => {
    if (newEventTitle.trim() === '') return;
    try {
      await invoke('add_event', {
        title: newEventTitle,
        description: newEventDescription,
        date: format(selectedDate, 'yyyy-MM-dd')
      });
      setNewEventTitle('');
      setNewEventDescription('');
      fetchEvents();
    } catch (error) {
      console.error('Failed to add event:', error);
    }
  };

  const deleteEvent = async (id: number) => {
    try {
      await invoke('delete_event', { id });
      fetchEvents();
      setSelectedEvent(null);
    } catch (error) {
      console.error('Failed to delete event:', error);
    }
  };

  const renderCalendar = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = monthStart;
    const endDate = monthEnd;

    const dateFormat = "d";
    const rows = [];

    let days = [];
    let day = startDate;
    let formattedDate = "";

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, dateFormat);
        const cloneDay = day;
        days.push(
          <div
            className={`p-2 border ${
              !isSameMonth(day, monthStart)
                ? "text-gray-400"
                : isSameDay(day, selectedDate)
                ? "bg-blue-500 text-white"
                : ""
            } cursor-pointer hover:bg-gray-200`}
            key={day.toString()}
            onClick={() => setSelectedDate(cloneDay)}
          >
            <span>{formattedDate}</span>
            {events.some(event => isSameDay(new Date(event.date), day)) && (
              <div className="w-2 h-2 bg-green-500 rounded-full mx-auto mt-1"></div>
            )}
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }
    return <div className="bg-white rounded-lg shadow p-4">{rows}</div>;
  };

  return (
    <div className="flex h-full">
      <div className="w-2/3 p-4">
        <div className="flex justify-between items-center mb-4">
          <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-2">
            <FaChevronLeft />
          </button>
          <h2 className="text-xl font-bold">{format(currentDate, 'MMMM yyyy')}</h2>
          <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-2">
            <FaChevronRight />
          </button>
        </div>
        {renderCalendar()}
      </div>
      <div className="w-1/3 p-4 border-l">
        <h3 className="text-lg font-semibold mb-2">
          Events for {format(selectedDate, 'MMMM d, yyyy')}
        </h3>
        <div className="mb-4">
          <input
            type="text"
            value={newEventTitle}
            onChange={(e) => setNewEventTitle(e.target.value)}
            placeholder="Event title"
            className="w-full p-2 border rounded mb-2"
          />
          <textarea
            value={newEventDescription}
            onChange={(e) => setNewEventDescription(e.target.value)}
            placeholder="Event description"
            className="w-full p-2 border rounded mb-2"
          />
          <button
            onClick={addEvent}
            className="bg-blue-500 text-white p-2 rounded flex items-center"
          >
            <FaPlus className="mr-2" /> Add Event
          </button>
        </div>
        <ul>
          {events.map(event => (
            <li
              key={event.id}
              className="mb-2 p-2 border rounded cursor-pointer hover:bg-gray-100"
              onClick={() => setSelectedEvent(event)}
            >
              {event.title}
            </li>
          ))}
        </ul>
        {selectedEvent && (
          <div className="mt-4 p-4 border rounded">
            <h4 className="font-semibold">{selectedEvent.title}</h4>
            <p>{selectedEvent.description}</p>
            <button
              onClick={() => deleteEvent(selectedEvent.id)}
              className="mt-2 bg-red-500 text-white p-2 rounded"
            >
              Delete Event
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Calendar;