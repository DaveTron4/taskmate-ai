import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MCPLogin from './components/mcplogin'

function ComposioPage() {
    const navigate = useNavigate()
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Check if user is authenticated
        const checkAuth = async () => {
            try {
                const response = await fetch('/auth/login/success', {
                    credentials: 'include'
                })
                if (response.ok) {
                    const data = await response.json()
                    if (data.success && data.user) {
                        setIsAuthenticated(true)
                    } else {
                        // Not authenticated, redirect to login
                        navigate('/login', { replace: true })
                    }
                } else {
                    navigate('/login', { replace: true })
                }
            } catch (error) {
                console.error('Error checking auth:', error)
                navigate('/login', { replace: true })
            } finally {
                setLoading(false)
            }
        }
        checkAuth()
    }, [navigate])

    const handleComplete = () => {
        // After connecting Composio services, navigate to dashboard
        navigate('/dashboard', { replace: true })
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-white text-xl">Loading...</div>
            </div>
        )
    }

    if (!isAuthenticated) {
        return null // Will redirect
    }

    return (
        <div>
            <MCPLogin onComplete={handleComplete} />
        </div>
    )
}

export default ComposioPage
