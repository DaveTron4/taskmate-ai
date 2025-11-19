import { useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import AddTaskModal from "./AddTaskModal";
import { useToast } from "../../../components/ToastProvider";

interface User {
    user_id: number;
    username: string;
    avatar_url: string;
    email?: string;
}

interface TopProps {
    user: User;
}

export default function Top({ user }: TopProps) {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<any>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const handleLogout = async () => {
        try {
            await fetch("https://taskmate-ai-ef8u.onrender.com/auth/logout", {
                credentials: "include",
            });
            navigate("/login", { replace: true });
        } catch (error) {
            console.error("error logging out");
        }
    };

    const handleAddTask = () => {
        setEditingTask(null);
        setIsAddTaskModalOpen(true);
    };

    const handleSaveTask = async (task: any) => {
        try {
            // Check if we're editing or creating
            const isEditing = task.taskId;
            const url = isEditing 
                ? `https://taskmate-ai-ef8u.onrender.com/api/tasks/${task.taskId}`
                : "https://taskmate-ai-ef8u.onrender.com/api/tasks";
            const method = isEditing ? "PUT" : "POST";

            const response = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify(task),
            });

            const data = await response.json();
            
            if (data.ok) {
                console.log(`Task ${isEditing ? 'updated' : 'saved'} successfully:`, data.task);
                addToast(
                    `Task ${isEditing ? 'updated' : 'created'} successfully`,
                    'success',
                    `"${task.title}" has been ${isEditing ? 'updated' : 'added to your task list'}.`
                );
                // Reload the page to fetch updated tasks
                setTimeout(() => window.location.reload(), 1000);
            } else {
                console.error(`Error ${isEditing ? 'updating' : 'saving'} task:`, data.error);
                addToast(
                    `Failed to ${isEditing ? 'update' : 'create'} task`,
                    'danger',
                    data.error
                );
            }
        } catch (error) {
            console.error("Error saving task:", error);
            addToast(
                'Error saving task',
                'danger',
                'An unexpected error occurred. Please try again.'
            );
        }
    };

    const handleDeleteTask = async (taskId: string) => {
        try {
            const response = await fetch(`https://taskmate-ai-ef8u.onrender.com/api/tasks/${taskId}`, {
                method: "DELETE",
                credentials: "include",
            });

            const data = await response.json();
            
            if (data.ok) {
                console.log("Task deleted successfully");
                addToast(
                    'Task deleted successfully',
                    'success',
                    'The task has been removed from your list.'
                );
                // Reload the page to fetch updated tasks
                setTimeout(() => window.location.reload(), 1000);
            } else {
                console.error("Error deleting task:", data.error);
                addToast(
                    'Failed to delete task',
                    'danger',
                    data.error
                );
            }
        } catch (error) {
            console.error("Error deleting task:", error);
            addToast(
                'Error deleting task',
                'danger',
                'An unexpected error occurred. Please try again.'
            );
        }
    };

    // Expose method to open edit modal
    useEffect(() => {
        console.log("Top component mounted, setting up global function");
        (window as any).openEditTaskModal = (task: any) => {
            console.log("Opening edit modal for task:", task);
            setEditingTask(task);
            setIsAddTaskModalOpen(true);
        };
        console.log("Global function set:", typeof (window as any).openEditTaskModal);
        
        return () => {
            console.log("Top component unmounting, removing global function");
            delete (window as any).openEditTaskModal;
        };
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="flex items-center justify-between w-full bg-white px-2 py-1 shadow-sm border-b border-slate-200 sticky top-0 z-10">

            {/* LEFT */}
            <div className="flex flex-col leading-tight">
                <h1 className="text-xl font-semibold text-slate-900">
                    TaskMate AI
                </h1>
                <p className="text-xs text-slate-500">
                    Manage your tasks, schedule, and email summaries
                </p>
            </div>

            {/* RIGHT */}
            <div className="flex items-center gap-1 relative" ref={dropdownRef}>

                {/* Add Task Button */}
                <button
                    onClick={handleAddTask}
                    className="px-2 py-1 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition shadow-sm"
                >
                    + Add New Task
                </button>

                {/* Avatar with dropdown */}
                <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="p-0.5 rounded-full bg-white shadow-sm border border-slate-200 hover:border-slate-300 transition cursor-pointer"
                >
                    <img
                        src={user.avatar_url}
                        alt={user.username}
                        className="h-4 w-4 rounded-full object-cover"
                    />
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                    <div className="absolute right-0 top-6 w-40 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50">
                        <div className="px-2 py-1 border-b border-slate-200">
                            <p className="text-sm font-medium text-slate-900">{user.username}</p>
                            {user.email && (
                                <p className="text-xs text-slate-500 truncate">{user.email}</p>
                            )}
                        </div>
                        <button
                            onClick={handleLogout}
                            className="w-full text-left px-2 py-1 text-sm text-rose-600 hover:bg-rose-50 transition"
                        >
                            Logout
                        </button>
                    </div>
                )}
            </div>

            {/* Add Task Modal */}
            <AddTaskModal
                isOpen={isAddTaskModalOpen}
                onClose={() => {
                    setIsAddTaskModalOpen(false);
                    setEditingTask(null);
                }}
                onSave={handleSaveTask}
                onDelete={handleDeleteTask}
                editTask={editingTask}
            />
        </div>
    );
}
