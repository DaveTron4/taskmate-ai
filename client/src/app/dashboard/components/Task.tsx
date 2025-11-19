import { useState } from "react";

interface Task {
    id: number;
    name: string;
    courseName?: string;
    dueDate: string;
    priority: "low" | "medium" | "high";
    estimatedHours: number | null;
    status: "not_started" | "in_progress" | "done";
    url?: string | null;
}

export default function TasksUI() {
    const [tasks] = useState<Task[]>([
        {
            id: 1,
            name: "Submit CS 101 Final Project",
            dueDate: "2025-11-18T23:59:00",
            priority: "high",
            estimatedHours: null,
            status: "not_started",
        },
        {
            id: 2,
            name: "Review Math Chapter 5",
            dueDate: "2025-11-19T12:00:00",
            priority: "high",
            estimatedHours: null,
            status: "not_started",
        },
        {
            id: 3,
            name: "Reply to Professor's Email",
            dueDate: "2025-11-18T17:00:00",
            priority: "medium",
            estimatedHours: null,
            status: "not_started",
        },
        {
            id: 4,
            name: "Complete Work Report",
            dueDate: "2025-11-08T12:00:00",
            priority: "low",
            estimatedHours: null,
            status: "not_started",
        },
        {
            id: 5,
            name: "Prepare Presentation Slides",
            dueDate: "2025-11-07T10:00:00",
            priority: "high",
            estimatedHours: null,
            status: "not_started",
        },
        {
            id: 6,
            name: "Book Doctor Appointment",
            dueDate: "2025-11-25T09:00:00",
            priority: "low",
            estimatedHours: null,
            status: "not_started",
        },
    ]);

    const priorityConfig = {
        high: {
            badge: "bg-rose-600 text-white",
            border: "border-rose-600",
            icon: "text-rose-600"
        },
        medium: {
            badge: "bg-amber-500 text-white",
            border: "border-amber-500",
            icon: "text-amber-500"
        },
        low: {
            badge: "bg-emerald-500 text-white",
            border: "border-emerald-500",
            icon: "text-emerald-600"
        },
    };

    const formatDate = (date: string) => {
        const d = new Date(date);
        const now = new Date();
        const isToday = d.toDateString() === now.toDateString();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const isTomorrow = d.toDateString() === tomorrow.toDateString();

        if (isToday) return "Today";
        if (isTomorrow) return "Tomorrow";
        
        return d.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
        });
    };

    const formatTime = (date: string) => {
        return new Date(date).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
        });
    };

    return (
        <div className="space-y-1 pr-1">
            {tasks.map((task) => (
                <div
                    key={task.id}
                    className={`flex items-start items-center gap-1 px-1 py-1 bg-slate-50 border-l-4 rounded-lg hover:shadow-md transition-all cursor-pointer ${priorityConfig[task.priority].border}`}
                >
                    {/* Checkbox */}
                    <div className="">
                        <div className="h-1.5 w-1.5 rounded-full border-2 border-slate-300 bg-white hover:border-slate-400 transition" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-slate-900 mb-1">
                            {task.name}
                        </h3>
                        
                        <div className="text-xs text-slate-600">
                            <span className="whitespace-nowrap">{formatDate(task.dueDate)}, {formatTime(task.dueDate)}</span>
                        </div>
                    </div>

                    {/* Priority Badge */}
                    <span
                        className={`p-0.5 rounded text-[10px] font-semibold ${priorityConfig[task.priority].badge}`}
                    >
                        {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                    </span>
                </div>
            ))}
        </div>
    );
}
