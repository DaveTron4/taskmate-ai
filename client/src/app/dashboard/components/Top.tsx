import { useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";

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
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const handleLogout = async () => {
        try {
            await fetch("http://localhost:3001/auth/logout", {
                credentials: "include",
            });
            navigate("/login", { replace: true });
        } catch (error) {
            console.error("error logging out");
        }
    };

    const handleAddTask = () => {
        // TODO: Implement add task logic
    };

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
        <div className="flex items-center justify-between w-full bg-white px-2 py-1 shadow-sm border-b border-slate-200">

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
                        className="h-6 w-6 rounded-full object-cover"
                    />
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                    <div className="absolute right-0 top-8 mt-1 w-40 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50">
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
        </div>
    );
}
