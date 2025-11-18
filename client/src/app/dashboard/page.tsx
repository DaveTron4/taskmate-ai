import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
// @ts-ignore
import Calendar from './components/Calendar.jsx'
import Top from './components/Top'

interface User {
    user_id: number
    username: string
    avatar_url: string
    email?: string
}
function DashboardPage() {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()

    useEffect(() => {
        checkLoginStatus()
    }, [])

    const checkLoginStatus = async () => {
        try {
            const response = await fetch('http://localhost:3001/auth/login/success', {
                credentials: 'include'
            })

            if (response.ok) {
                const data = await response.json()
                if (data.success && data.user) {
                    setUser(data.user)
                } else {
                    // Redirect to login if not authenticated
                    navigate('/login', { replace: true })
                }
            } else {
                navigate('/login', { replace: true })
            }
        } catch (error) {
            console.error('Error checking login status:', error)
            navigate('/login', { replace: true })
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-white text-xl">
                    Loading...
                </div>
            </div>
        )
    }

    if (!user) {
        return null
    }

    return (
        <div className="h-screen flex flex-col overflow-hidden bg-gray-50">
            <Top user={user} />
            <div className="flex-1 overflow-hidden p-4 md:p-6">
                <Calendar />
            </div>
        </div >
    )
}
export default DashboardPage



