import { useEffect, useRef } from "react";
import {
  createCalendar,
  destroyCalendar,
  TimeGrid,
} from "@event-calendar/core";
import "@event-calendar/core/index.css";

export default function CalendarView() {
  const containerRef = useRef(null);
  const calendarRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      calendarRef.current = createCalendar(containerRef.current, [TimeGrid], {
        view: "timeGridWeek",
        date: new Date(),
        events: [
          {
            id: "1",
            title: "Sample Event",
            start: new Date(),
            end: new Date(Date.now() + 60 * 60 * 1000),
          },
        ],
        headerToolbar: {
          start: "title",
          center: "",
          end: "today prev,next",
        },
      });
    }

    return () => {
      if (calendarRef.current) {
        destroyCalendar(calendarRef.current);
      }
    };
  }, []);

  return (
    <div className="h-full w-full flex flex-col">
      {/* Calendar Container with Composio-style theme */}
      <div className="flex-1 rounded-xl bg-white shadow-xl border border-gray-100 overflow-hidden">
        <div ref={containerRef} className="h-full w-full calendar-wrapper" />
      </div>

      {/* Custom EventCalendar styles matching Composio theme */}
      <style>{`
        .calendar-wrapper .ec {
          background: white;
          color: #374151;
          font-family: Inter, system-ui, sans-serif;
          height: 100%;
        }
        .calendar-wrapper .ec-header {
          background: linear-gradient(to right, #f0f4ff 0%, #f5f0ff 100%);
          border-bottom: 1px solid #e5e7eb;
          padding: 16px 24px;
        }
        .calendar-wrapper .ec-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .calendar-wrapper .ec-title {
          font-size: 18px;
          font-weight: 600;
          color: #374151;
        }
        .calendar-wrapper .ec-button {
          background: white;
          border: 1.5px solid #e5e7eb;
          border-radius: 8px;
          padding: 6px 12px;
          font-size: 14px;
          font-weight: 500;
          color: #374151;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .calendar-wrapper .ec-button:hover {
          border-color: #667eea;
          background: #f8f9ff;
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(102, 126, 234, 0.15);
        }
        .calendar-wrapper .ec-button-group .ec-button {
          margin: 0 2px;
        }
        .calendar-wrapper .ec-day-head {
          background: white;
          font-weight: 600;
          color: #374151;
          border-bottom: 1px solid #e5e7eb;
          padding: 12px 8px;
        }
        .calendar-wrapper .ec-day {
          background: white;
          border-right: 1px solid #e5e7eb;
        }
        .calendar-wrapper .ec-day:last-child {
          border-right: none;
        }
        .calendar-wrapper .ec-time {
          color: #6b7280;
          font-size: 12px;
          border-right: 1px solid #e5e7eb;
          background: white;
        }
        .calendar-wrapper .ec-line {
          border-top: 1px solid #e5e7eb;
        }
        .calendar-wrapper .ec-event {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white !important;
          border-radius: 6px;
          padding: 4px 8px;
          font-size: 13px;
          font-weight: 500;
          border: none;
          box-shadow: 0 2px 4px rgba(102, 126, 234, 0.2);
        }
        .calendar-wrapper .ec-event:hover {
          box-shadow: 0 4px 8px rgba(102, 126, 234, 0.3);
          transform: translateY(-1px);
        }
        .calendar-wrapper .ec-event-title,
        .calendar-wrapper .ec-event-time {
          color: white !important;
          font-weight: 500;
        }
        .calendar-wrapper .ec-highlight {
          background: #f8f9ff;
        }
        .calendar-wrapper .ec-today {
          background: #f0f4ff;
        }
        .calendar-wrapper .ec-other-month {
          color: #9ca3af;
        }
        .calendar-wrapper .ec-body {
          background: white;
        }
        .calendar-wrapper .ec-content {
          background: white;
        }
      `}</style>
    </div>
  );
}
