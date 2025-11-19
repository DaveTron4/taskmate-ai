import { useEffect, useRef } from "react";
import {
  createCalendar,
  destroyCalendar,
  TimeGrid,
} from "@event-calendar/core";
import "@event-calendar/core/index.css";
import "./Calendar.css";

export default function CalendarView({
  events: calendarEvents,
  assignments,
  onReady,
}) {
  const containerRef = useRef(null);
  const calendarRef = useRef(null);
  const readyCalledRef = useRef(false);
  const dataKeyRef = useRef("");

  useEffect(() => {
    if (!containerRef.current) return;

    const allEvents = [...(calendarEvents || [])];

    (assignments || [])
      .filter((assignment) => assignment.status !== "done")
      .forEach((assignment) => {
        const dueDate = new Date(assignment.dueDate);
        const endDate = new Date(dueDate.getTime() + 60 * 60 * 1000);

        allEvents.push({
          id: `assignment-${assignment.id}`,
          title: assignment.name,
          start: dueDate,
          end: endDate,
          allDay: false,
          backgroundColor: "#667eea",
          borderColor: "#667eea",
          extendedProps: {
            type: "assignment",
            url: assignment.url,
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
      nowIndicator: true,
      slotDuration: "00:30:00",
      slotMinTime: "08:00:00",
      slotMaxTime: "25:00:00",
      eventClick: (info) => {
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
    <div
      className="relative w-full"
      style={{ minHeight: "400px", height: "600px" }}
    >
      <div ref={containerRef} className="h-full w-full calendar-wrapper" />
    </div>
  );
}
