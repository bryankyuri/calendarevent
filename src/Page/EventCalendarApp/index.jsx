import React, { useState, useRef } from "react";
import { Calendar, Plus, ChevronLeft, ChevronRight } from "lucide-react";

// Generate hours for dropdown
const generateHours = () => {
  return Array.from(
    { length: 24 },
    (_, i) => i.toString().padStart(2, "0") + ":00"
  );
};

// Days of the week
const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Initial event data (without duration)
const initialEvents = {
  unscheduled: [
    { id: "1", title: "Team Meeting" },
    { id: "2", title: "Client Presentation" },
    { id: "3", title: "Project Review" },
  ],
  scheduled: {},
};

const EventCalendarApp = () => {
  const [events, setEvents] = useState(initialEvents);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [durationModal, setDurationModal] = useState(null);
  const draggedItem = useRef(null);
  const hours = generateHours();

  // Generate calendar days for the current month
  const generateCalendarDays = () => {
    const date = new Date(currentMonth);
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const days = [];
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  // Navigate to previous month
  const goToPreviousMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() - 1);

    // Compare full dates to allow navigation to any previous month
    const today = new Date();
    today.setDate(1); // Set to first of the month for fair comparison

    if (newDate >= today) {
      setCurrentMonth(newDate);
    }
  };

  // Navigate to next month
  const goToNextMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentMonth(newDate);
  };

  const handleDragStart = (e, item, source) => {
    draggedItem.current = { item, source };
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, day) => {
    // Disable drag over for past dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (day && day < today) {
      e.preventDefault();
      return false;
    }

    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e, target) => {
    e.preventDefault();
    if (!draggedItem.current) return;

    // Prevent dropping on past dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (target !== "unscheduled" && target < today) {
      return;
    }

    const { item, source } = draggedItem.current;

    // If dropping into calendar, open duration modal
    if (target !== "unscheduled") {
      setDurationModal({
        item,
        source,
        target,
      });
      return;
    }

    const newEvents = { ...events };

    // Remove from source
    if (source !== "unscheduled") {
      const sourceDate = source.toISOString().split("T")[0];
      newEvents.scheduled[sourceDate] = newEvents.scheduled[sourceDate].filter(
        (i) => i.id !== item.id
      );
    }

    // Add to unscheduled (without duration)
    const { ...itemWithoutDuration } = item;
    newEvents.unscheduled.push(itemWithoutDuration);
    // Remove from source and add to unscheduled
    setEvents(newEvents);

    draggedItem.current = null;
  };

  const handleDurationSubmit = (startTime, endTime) => {
    if (!durationModal) return;

    const { item, source, target } = durationModal;
    let newEvents = { ...events };

    // Add to target with duration
    const targetDate = target.toISOString().split("T")[0];
    const eventWithDuration = {
      ...item,
      duration: `${startTime} - ${endTime}`,
    };
    console.log(eventWithDuration);

    newEvents.scheduled[targetDate] = [
      ...(newEvents.scheduled[targetDate] || []),
      eventWithDuration,
    ];

    if (source === "unscheduled") {
      newEvents.unscheduled = newEvents.unscheduled.filter(
        (i) => i.id !== item.id
      );
    } else {
      const sourceDate = source.toISOString().split("T")[0];
      newEvents.scheduled[sourceDate] = newEvents.scheduled[sourceDate].filter(
        (i) => i.id !== item.id
      );
    }

    setEvents(newEvents);
    // Remove from source

    setDurationModal(null);
  };

  // Format month and year for display
  const formatMonthYear = (date) => {
    return date.toLocaleString("default", { month: "long", year: "numeric" });
  };

  // Check if previous month button should be disabled
  const isPrevMonthDisabled = () => {
    const today = new Date();
    today.setDate(1); // Set to first of the month
    const prevMonth = new Date(currentMonth);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    return prevMonth < today;
  };

  // Determine if a day is within the current month's view
  const isDayInCurrentMonth = (day) => {
    return (
      day.getMonth() === currentMonth.getMonth() &&
      day.getFullYear() === currentMonth.getFullYear()
    );
  };

  return (
    <div className="flex h-screen relative">
      {/* Sidebar for Unscheduled Events */}
      <div
        className="w-1/4 bg-gray-100 p-4"
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, "unscheduled")}
      >
        <h2 className="text-xl font-bold mb-4 flex items-center">
          Unscheduled Events
        </h2>
        <div className="space-y-2">
          {events.unscheduled.map((event) => (
            <div
              key={event.id}
              draggable
              onDragStart={(e) => handleDragStart(e, event, "unscheduled")}
              className="bg-white p-3 rounded shadow cursor-move"
            >
              <h3 className="font-semibold">{event.title}</h3>
            </div>
          ))}
        </div>
      </div>

      {/* Calendar View */}
      <div className="w-3/4 p-6">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={goToPreviousMonth}
            className={`p-2 ${
              isPrevMonthDisabled()
                ? "text-gray-300 cursor-not-allowed"
                : "hover:bg-gray-200"
            } rounded`}
            disabled={isPrevMonthDisabled()}
          >
            <ChevronLeft />
          </button>
          <h2 className="text-2xl font-bold">
            {formatMonthYear(currentMonth)}
          </h2>
          <button
            onClick={goToNextMonth}
            className="p-2 hover:bg-gray-200 rounded"
          >
            <ChevronRight />
          </button>
        </div>

        {/* Day Names */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {DAYS_OF_WEEK.map((day) => (
            <div key={day} className="text-center font-semibold text-gray-600">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {generateCalendarDays().map((day, index) =>
            day ? (
              <div
                key={index}
                className={`border p-2 min-h-[150px] ${
                  day < new Date().setHours(0, 0, 0, 0)
                    ? "bg-gray-100 opacity-50"
                    : "hover:bg-gray-50"
                } ${!isDayInCurrentMonth(day) ? "bg-gray-50" : ""}`}
                onDragOver={(e) => handleDragOver(e, day)}
                onDrop={(e) => handleDrop(e, day)}
              >
                <div
                  className={`font-bold mb-2 ${
                    !isDayInCurrentMonth(day) ? "text-gray-400" : ""
                  }`}
                >
                  {day.getDate()}
                </div>
                {events.scheduled[day.toISOString().split("T")[0]]?.map(
                  (event) => (
                    <div
                      key={event.id}
                      draggable={day >= new Date().setHours(0, 0, 0, 0)}
                      onDragStart={(e) => handleDragStart(e, event, day)}
                      className={`
                      bg-blue-100 p-2 rounded mb-1 
                      ${
                        day >= new Date().setHours(0, 0, 0, 0)
                          ? "cursor-move"
                          : "cursor-not-allowed"
                      }
                    `}
                    >
                      <h3 className="font-semibold">{event.title}</h3>
                      {event.duration && (
                        <p className="text-sm text-gray-600">
                          {event.duration}
                        </p>
                      )}
                    </div>
                  )
                )}
              </div>
            ) : (
              <div key={index} className="border p-2 bg-gray-50" />
            )
          )}
        </div>
      </div>

      {/* Duration Modal */}
      {durationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-xl">
            <h2 className="text-xl font-bold mb-4">Set Event Duration</h2>
            <div className="flex items-center space-x-4">
              <div>
                <label className="block mb-2">Start Time</label>
                <select
                  id="start-time"
                  className="border p-2 rounded"
                  defaultValue=""
                >
                  <option value="" disabled>
                    Select start time
                  </option>
                  {hours.map((hour) => (
                    <option key={hour} value={hour}>
                      {hour}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-2">End Time</label>
                <select
                  id="end-time"
                  className="border p-2 rounded"
                  defaultValue=""
                >
                  <option value="" disabled>
                    Select end time
                  </option>
                  {hours.map((hour) => (
                    <option key={hour} value={hour}>
                      {hour}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => setDurationModal(null)}
                className="px-4 py-2 bg-gray-200 rounded"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const startTime = document.getElementById("start-time").value;
                  const endTime = document.getElementById("end-time").value;
                  if (startTime && endTime) {
                    handleDurationSubmit(startTime, endTime);
                  }
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded"
              >
                Set Duration
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventCalendarApp;
