
import { useState } from "react";

interface Assignment {
    id: string | number;
    name: string;
    courseName: string;
    dueDate: string;
    points: number | null;
    submitted: string | null;
    url: string | null;
    priority: "low" | "medium" | "high";
    estimatedHours: number | null;
    status: "not_started" | "in_progress" | "done";
}

interface TaskProps {
    assignments: Assignment[];
    setAssignments: React.Dispatch<React.SetStateAction<Assignment[]>>;
}

export default function TasksUI({ assignments, setAssignments }: TaskProps) {
    const [loadingId, setLoadingId] = useState<string | number | null>(null);

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

    // Sort by priority (AI or user), then due date
    const sorted = [...assignments]
        .filter(t => t.status !== "done")
        .sort((a, b) => {
            const priorityOrder = { high: 0, medium: 1, low: 2 };
            if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            }
            return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        });

    // Mark as completed
    const handleComplete = async (task: Assignment) => {
        setLoadingId(task.id);
        try {
            if (task.url) {
                // Canvas assignment: update assignment metadata
                await fetch(`/api/canvas/assignments/${task.id}/metadata`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ status: "done" }),
                });
            } else {
                // Manual task
                await fetch(`/api/tasks/${String(task.id).replace('task-', '')}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ status: "completed" }),
                });
            }
            setAssignments(prev => prev.map(t => t.id === task.id ? { ...t, status: "done" } : t));
        } finally {
            setLoadingId(null);
        }
    };

    return (
        <div className="space-y-1 pr-1">
            {sorted.length === 0 && (
                <div className="text-xs text-slate-500 px-2 py-4 text-center">No upcoming tasks! 🎉</div>
            )}
            {sorted.map((task) => (
                <div
                    key={task.id}
                    className={`flex items-start items-center gap-1 px-1 py-1 bg-slate-50 border-l-4 rounded-lg hover:shadow-md transition-all cursor-pointer ${priorityConfig[task.priority].border}`}
                >
                    {/* Checkbox */}
                    <button
                        onClick={e => { e.stopPropagation(); handleComplete(task); }}
                        disabled={loadingId === task.id}
                        className={`h-1.5 w-1.5 rounded-full border-2 flex items-center justify-center ${task.status === "done" ? "border-emerald-500 bg-emerald-100" : "border-slate-300 bg-white hover:border-slate-400"} transition disabled:opacity-50`}
                        title={task.status === "done" ? "Completed" : "Mark as completed"}
                        style={{ cursor: loadingId === task.id ? 'not-allowed' : 'pointer' }}
                    >
                        {loadingId === task.id ? (
                            <svg className="animate-spin w-1 h-1 text-emerald-500" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
                        ) : task.status === "done" ? (
                            <svg className="w-1 h-1 text-emerald-500" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                        ) : null}
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-slate-900 mb-1">
                            {task.name}
                        </h3>
                        <div className="text-xs text-slate-600">
                            <span className="whitespace-nowrap">{formatDate(task.dueDate)}, {formatTime(task.dueDate)}</span>
                            {task.courseName && (
                                <span className="ml-2 text-xs text-slate-400">{task.courseName}</span>
                            )}
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
