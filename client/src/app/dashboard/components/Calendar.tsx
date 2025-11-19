import { useEffect, useRef } from "react";
import {
  createCalendar,
  destroyCalendar,
  TimeGrid,
} from "@event-calendar/core";
import "@event-calendar/core/index.css";
import "./Calendar.css";

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  backgroundColor?: string;
  borderColor?: string;
  category?: "school" | "personal" | "work";
  extendedProps?: any;
}

interface Assignment {
  id: string | number;
  name: string;
  dueDate: string;
  status: string;
  category?: "school" | "personal" | "work";
  url?: string | null;
}

interface CalendarViewProps {
  events: CalendarEvent[];
  assignments: Assignment[];
  onReady: () => void;
}

export default function CalendarView({
  events: calendarEvents,
  assignments,
  onReady,
}: CalendarViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<any>(null);
  const readyCalledRef = useRef(false);
  const dataKeyRef = useRef("");

  const categories = {
    school: { name: "School", color: "#8b5cf6" }, // Purple
    personal: { name: "Personal", color: "#f59e0b" }, // Orange
    work: { name: "Work", color: "#06b6d4" }, // Cyan
  };

  const getCategoryForEvent = (eventTitle: string): keyof typeof categories => {
    const title = eventTitle.toLowerCase();
    if (title.includes("cs ") || title.includes("math") || title.includes("quiz") || 
        title.includes("essay") || title.includes("study") || title.includes("assignment") || 
        title.includes("project")) {
      return "school";
    }
    if (title.includes("work") || title.includes("shift") || title.includes("meeting") || 
        title.includes("team")) {
      return "work";
    }
    return "personal";
  };

  useEffect(() => {
    if (!containerRef.current) return;

    const allEvents = [...(calendarEvents || [])].map(event => {
      // Use backend-provided category if available, otherwise detect from title
      const category: keyof typeof categories = event.category || event.extendedProps?.category || getCategoryForEvent(event.title);
      console.log(`Event "${event.title}" categorized as "${category}" with color ${categories[category].color}`);
      return {
        ...event,
        backgroundColor: categories[category].color,
        borderColor: categories[category].color,
        color: "#ffffff", // Text color
        extendedProps: {
          ...event.extendedProps,
          category,
        },
      };
    });

    (assignments || [])
      .filter((assignment) => assignment.status !== "done")
      .forEach((assignment) => {
        const dueDate = new Date(assignment.dueDate);
        const endDate = new Date(dueDate.getTime() + 60 * 60 * 1000);
        // Use backend-provided category if available, otherwise default to school
        const category = assignment.category || "school";
        console.log(`Assignment "${assignment.name}" categorized as "${category}" with color ${categories[category].color}`);

        allEvents.push({
          id: `assignment-${assignment.id}`,
          title: assignment.name,
          start: dueDate,
          end: endDate,
          allDay: false,
          backgroundColor: categories[category].color,
          borderColor: categories[category].color,
          color: "#ffffff", // Text color
          extendedProps: {
            type: "assignment",
            url: assignment.url,
            category,
          },
        });
      });

    const newDataKey = `${calendarEvents?.length || 0}-${
      assignments?.length || 0
    }`;
    const dataChanged =
      dataKeyRef.current !== newDataKey && dataKeyRef.current !== "";

    if (dataChanged) {
      readyCalledRef.current = false;
    }

    dataKeyRef.current = newDataKey;

    if (calendarRef.current) {
      destroyCalendar(calendarRef.current);
    }

    calendarRef.current = createCalendar(containerRef.current, [TimeGrid], {
      view: "timeGridWeek",
      date: new Date(),
      events: allEvents,
      headerToolbar: {
        start: "title",
        center: "",
        end: "today prev,next",
      },
      titleFormat: { year: 'numeric', month: 'long' },
      dayHeaderFormat: (date: Date) => {
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dayName = dayNames[date.getDay()];
        const dayNumber = date.getDate();
        const today = new Date();
        const isToday = date.getDate() === today.getDate() && 
                        date.getMonth() === today.getMonth() && 
                        date.getFullYear() === today.getFullYear();
        
        return {
          html: `
            <div class="day-header-custom">
              <div class="day-name">${dayName}</div>
              <div class="day-number ${isToday ? 'is-today' : ''}">${dayNumber}</div>
            </div>
          `
        };
      },
      nowIndicator: true,
      slotDuration: "00:30:00",
      slotMinTime: "08:00:00",
      slotMaxTime: "25:00:00",
      eventClick: (info: any) => {
        if (
          info.event.extendedProps?.type === "assignment" &&
          info.event.extendedProps?.url
        ) {
          window.open(
            info.event.extendedProps.url,
            "_blank",
            "noopener,noreferrer"
          );
        }
      },
    });

    if (onReady && !readyCalledRef.current) {
      readyCalledRef.current = true;
      setTimeout(() => {
        onReady();
      }, 100);
    }

    return () => {
      if (calendarRef.current) {
        destroyCalendar(calendarRef.current);
      }
    };
  }, [calendarEvents, assignments, onReady]);

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden">
      <div ref={containerRef} className="flex-1 w-full calendar-wrapper overflow-auto min-h-0" />
      <div className="pt-2 border-t border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-xs font-semibold text-slate-700">Categories:</span>
          {Object.entries(categories).map(([key, category]) => (
            <div key={key} className="flex items-center gap-0.5">
              <div 
                className="w-1.5 h-1.5 rounded-full" 
                style={{ backgroundColor: category.color }}
              />
              <span className="text-xs text-slate-600">{category.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
