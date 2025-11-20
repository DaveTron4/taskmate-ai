import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  source?: "manual" | "gmail" | "canvas";
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
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<any>(null);
  const readyCalledRef = useRef(false);
  const dataKeyRef = useRef("");
  
  // Filter states
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set(["school", "personal", "work"]));
  const [selectedSources, setSelectedSources] = useState<Set<string>>(new Set(["manual", "gmail", "canvas"]));
  const [showFilters, setShowFilters] = useState(false);

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

    console.log(`[Calendar] Received ${calendarEvents?.length || 0} calendar events`);
    console.log(`[Calendar] Received ${assignments?.length || 0} assignments`);

    // Map calendar events and add source information
    const allEvents = [...(calendarEvents || [])].map(event => {
      // Use backend-provided category if available, otherwise detect from title
      const category: keyof typeof categories = event.category || event.extendedProps?.category || getCategoryForEvent(event.title);
      // Determine source - if it's a calendar event from Google, mark as gmail, otherwise check extendedProps
      const source = event.extendedProps?.type === "calendar" ? "gmail" : event.source || "manual";
      console.log(`Event "${event.title}" categorized as "${category}" from source "${source}"`);
      return {
        ...event,
        backgroundColor: categories[category].color,
        borderColor: categories[category].color,
        color: "#ffffff", // Text color
        source,
        extendedProps: {
          ...event.extendedProps,
          category,
          source,
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
        // Determine source - Canvas assignments have a URL, manual tasks don't
        const source = assignment.url ? "canvas" : "manual";
        console.log(`Assignment "${assignment.name}" due on ${dueDate.toLocaleDateString()} categorized as "${category}" from source "${source}"`);

        allEvents.push({
          id: `assignment-${assignment.id}`,
          title: assignment.name,
          start: dueDate,
          end: endDate,
          allDay: false,
          backgroundColor: categories[category].color,
          borderColor: categories[category].color,
          color: "#ffffff", // Text color
          source,
          extendedProps: {
            type: "assignment",
            url: assignment.url,
            category,
            source,
          },
        });
      });

    // Apply filters
    const filteredEvents = allEvents.filter(event => {
      const categoryMatch = selectedCategories.has(event.extendedProps?.category || "personal");
      const sourceMatch = selectedSources.has(event.extendedProps?.source || "manual");
      return categoryMatch && sourceMatch;
    });
    
    console.log(`[Calendar] Total events: ${allEvents.length}, After filters: ${filteredEvents.length}`);

    const newDataKey = `${calendarEvents?.length || 0}-${assignments?.length || 0}-${Array.from(selectedCategories).sort().join(",")}-${Array.from(selectedSources).sort().join(",")}`;
    const dataChanged =
      dataKeyRef.current !== newDataKey && dataKeyRef.current !== "";

    if (dataChanged) {
      readyCalledRef.current = false;
    }

    dataKeyRef.current = newDataKey;

    if (calendarRef.current && dataChanged) {
      try {
        destroyCalendar(calendarRef.current);
        calendarRef.current = null;
      } catch (e) {
        console.warn("Calendar already destroyed:", e);
      }
    }

    if (!calendarRef.current) {
      calendarRef.current = createCalendar(containerRef.current, [TimeGrid], {
      view: "timeGridWeek",
      date: new Date(),
      events: filteredEvents,
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
      scrollTime: "08:00:00",
      eventClick: (info: any) => {
        console.log("=== EVENT CLICKED ===");
        console.log("Event ID:", info.event.id);
        console.log("Event title:", info.event.title);
        console.log("Event extendedProps:", info.event.extendedProps);
        console.log("Event type:", info.event.extendedProps?.type);
        
        // Check if it's a manually created task (type === "task" OR assignment with no URL)
        const isManualTask = info.event.extendedProps?.type === "task" || 
                            (info.event.extendedProps?.type === "assignment" && !info.event.extendedProps?.url);
        
        if (isManualTask) {
          console.log("✓ This is a manually created task, navigating to details page");
          
          // Extract task ID from the event
          let taskId = info.event.id;
          if (taskId.startsWith('assignment-task-')) {
            taskId = taskId.replace('assignment-task-', '');
          } else if (taskId.startsWith('task-')) {
            taskId = taskId.replace('task-', '');
          }
          
          console.log("Navigating to task:", taskId);
          
          // Navigate to task details page
          navigate(`/tasks/${taskId}`);
        } else if (
          info.event.extendedProps?.type === "assignment" &&
          info.event.extendedProps?.url
        ) {
          console.log("✓ This is a Canvas assignment, opening URL");
          window.open(
            info.event.extendedProps.url,
            "_blank",
            "noopener,noreferrer"
          );
        } else {
          console.log("✗ Event type not recognized or no action defined");
          console.log("To make this event editable, it needs extendedProps.type === 'task' or be an assignment with no URL");
        }
        console.log("=== END EVENT CLICK ===");
      },
    });
    }

    if (onReady && !readyCalledRef.current) {
      readyCalledRef.current = true;
      setTimeout(() => {
        onReady();
      }, 100);
    }

    return () => {
      if (calendarRef.current) {
        try {
          destroyCalendar(calendarRef.current);
        } catch (e) {
          console.warn("Calendar cleanup failed:", e);
        }
        calendarRef.current = null;
      }
    };
  }, [calendarEvents, assignments, onReady, selectedCategories, selectedSources]);

  const toggleCategory = (category: string) => {
    const newCategories = new Set(selectedCategories);
    if (newCategories.has(category)) {
      newCategories.delete(category);
    } else {
      newCategories.add(category);
    }
    setSelectedCategories(newCategories);
  };

  const toggleSource = (source: string) => {
    const newSources = new Set(selectedSources);
    if (newSources.has(source)) {
      newSources.delete(source);
    } else {
      newSources.add(source);
    }
    setSelectedSources(newSources);
  };

  const sources = {
    manual: { name: "Manual", icon: "📝" },
    gmail: { name: "Google Calendar", icon: "📅" },
    canvas: { name: "Canvas", icon: "🎓" },
  };

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden">
      {/* Filter Controls */}
      <div className="mb-2 flex-shrink-0">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
          >
            {showFilters ? "▼" : "▶"} Filters
          </button>
          <span className="text-xs text-slate-500">Use ← → to navigate weeks</span>
        </div>
        
        {showFilters && (
          <div className="mt-1 px-1 py-0.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
            {/* Category Filters */}
            <div>
              <span className="text-xs font-semibold text-slate-700 block mb-1">Categories:</span>
              <div className="flex gap-0.5 flex-wrap">
                {Object.entries(categories).map(([key, category]) => (
                  <button
                    key={key}
                    onClick={() => toggleCategory(key)}
                    className={`flex items-center gap-0.5 px-1 py-0.5 rounded text-xs font-medium transition-all ${
                      selectedCategories.has(key)
                        ? "bg-white shadow-sm border border-slate-300"
                        : "bg-slate-200 text-slate-500 opacity-50"
                    }`}
                  >
                    <div
                      className="w-1 h-1 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <span>{category.name}</span>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Source Filters */}
            <div>
              <span className="text-xs font-semibold text-slate-700 block mb-1">Sources:</span>
              <div className="flex gap-0.5 flex-wrap">
                {Object.entries(sources).map(([key, source]) => (
                  <button
                    key={key}
                    onClick={() => toggleSource(key)}
                    className={`flex items-center gap-0.5 px-1 py-0.5 rounded text-xs font-medium transition-all ${
                      selectedSources.has(key)
                        ? "bg-white shadow-sm border border-slate-300"
                        : "bg-slate-200 text-slate-500 opacity-50"
                    }`}
                  >
                    <span>{source.icon}</span>
                    <span>{source.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Calendar */}
      <div ref={containerRef} className="flex-1 w-full calendar-wrapper overflow-auto min-h-0" />
      
      {/* Legend */}
      <div className="pt-2 border-t border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-xs font-semibold text-slate-700">Legend:</span>
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
