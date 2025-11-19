import { useNavigate } from "react-router-dom";

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

    return (
        <div className="flex items-center justify-between w-full bg-white px-5 py-3 shadow-sm border-b border-slate-200">

            {/* LEFT */}
            <div className="flex flex-col leading-tight">
                <h1 className="text-xl font-semibold text-slate-900">
                    Welcome back, {user.username}
                </h1>
                <p className="text-xs text-slate-500">
                    Manage your tasks, schedule, and email summaries
                </p>
            </div>

            {/* RIGHT */}
            <div className="flex items-center gap-3">

                {/* Avatar */}
                <div className="p-0.5 rounded-full bg-white shadow-sm border border-slate-200">
                    <img
                        src={user.avatar_url}
                        alt={user.username}
                        className="h-3 w-3 rounded-full object-cover"
                    />
                </div>

                {/* Logout */}
                <button
                    onClick={handleLogout}
                    className="rounded-md bg-rose-500 px-3 py-1 text-xs font-medium text-white shadow-sm hover:bg-rose-600 transition"
                >
                    Logout
                </button>
            </div>
        </div>
    );
}
