import { useState } from "react";

interface Task {
    id: number;
    name: string;
    courseName: string;
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
            courseName: "CS 101",
            dueDate: "2025-11-17T23:59:00",
            priority: "high",
            estimatedHours: 3,
            status: "not_started",
        },
        {
            id: 2,
            name: "Review Math Chapter 5",
            courseName: "Math 200",
            dueDate: "2025-11-18T12:00:00",
            priority: "medium",
            estimatedHours: 2,
            status: "not_started",
        },
        {
            id: 3,
            name: "Prepare Presentation Slides",
            courseName: "COMM 110",
            dueDate: "2025-11-20T10:00:00",
            priority: "high",
            estimatedHours: 1.5,
            status: "not_started",
        },
    ]);

    const priorityColors = {
        high: "bg-red-500",
        medium: "bg-amber-400",
        low: "bg-slate-300",
    };

    const priorityPillColors = {
        high: "bg-red-600 text-white",
        medium: "bg-amber-500/10 text-amber-700 border border-amber-300",
        low: "bg-slate-200 text-slate-700",
    };

    const formatDate = (date: string) =>
        new Date(date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
        });

    return (
        <div className="space-y-3">
                {tasks.map((task) => (
                    <div key={task.id} className="flex items-stretch">

                        {/* Left priority strip */}
                        <div className={`w-1 rounded-l-xl ${priorityColors[task.priority]}`} />

                        {/* Task card */}
                        <div className="flex-1 rounded-r-xl bg-white border border-slate-100 flex flex-row lg:flex-col py-2 px-1 lg:py-1.5 lg:px-2 items-center lg:items-start justify-between hover:shadow-md transition-all">

                            {/* Left side */}
                            <div className="flex items-start gap-3 lg:gap-2">
                                <div className="mt-0.5 h-3 w-3 lg:h-2 lg:w-2 rounded-full border-2 border-slate-300 bg-white" />

                                <div className="flex flex-col">
                                    <p className="text-base lg:text-sm font-semibold text-black">
                                        {task.name}
                                    </p>

                                    <div className="mt-0.5 flex items-center gap-1 text-sm lg:text-xs text-black">
                                        <span>{formatDate(task.dueDate)}</span>
                                        <span className="text-slate-300">•</span>
                                        <span>{task.courseName}</span>
                                        {task.estimatedHours && (
                                            <>
                                                <span className="text-slate-300">•</span>
                                                <span>{task.estimatedHours} hrs</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Right side */}
                            <span
                                className={`px-1 py-1 lg:px-2 lg:py-0.5 rounded-full text-[11px] lg:text-[10px] font-semibold lg:mt-2 lg:self-start ${priorityPillColors[task.priority]}`}
                            >
                                {task.priority === "high"
                                    ? "High"
                                    : task.priority === "medium"
                                        ? "Medium"
                                        : "Low"}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
    );
}
