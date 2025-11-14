import { useNavigate } from 'react-router-dom'

interface User {
    user_id: number
    username: string
    avatar_url: string
    email?: string
}

interface TopProps {
    user: User
}

function Top({ user }: TopProps) {
    const navigate = useNavigate()

    const handleLogout = async () => {
        try {
            await fetch('http://localhost:3001/auth/logout', {
                credentials: 'include'
            })
            navigate('/login', { replace: true })
        } catch (error) {
            console.error('error logging out')
        }
    }

    return (
        <div className="flex items-start justify-between w-full bg-white rounded-lg p-6 shadow-sm">

            {/* LEFT SIDE */}
            <div>
                <h1 className="text-3xl font-bold text-slate-900">
                    Welcome back, {user.username}!
                </h1>
                <p className="text-slate-600 text-sm">
                    Manage your tasks, schedule, and email summaries.
                </p>
            </div>

            {/* RIGHT SIDE */}
            <div className="flex flex-col items-center gap-0.5">

                {/* Avatar */}
                <div className="p-2 rounded-full bg-white shadow-sm border border-slate-200">
                    <img
                        src={user.avatar_url}
                        alt={user.username}
                        className="h-4 w-4 rounded-full object-cover"
                    />
                </div>

                {/* Logout */}
                <button
                    onClick={handleLogout}
                    className="rounded-md bg-rose-500 px-4 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-rose-600 transition"
                >
                    Logout
                </button>

            </div>
        </div>
    )

}

export default Top

