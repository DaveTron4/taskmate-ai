import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

function Login() {
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    // Check if user is already logged in
    checkLoginStatus()
  }, [])

  const checkLoginStatus = async () => {
    try {
      const response = await fetch('https://taskmate-ai-ef8u.onrender.com/auth/login/success', {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.user) {
          // User is authenticated, redirect to Composio services page
          navigate('/composio', { replace: true })
          return
        }
      }
    } catch (error) {
      console.error('Error checking login status:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGitHubLogin = () => {
    // Redirect to backend GitHub OAuth endpoint
    window.location.href = 'https://taskmate-ai-ef8u.onrender.com/auth/github'
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-slate-900 text-xs">
          Loading...
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="bg-white px-2 py-2 rounded shadow-sm border border-slate-200 text-center max-w-md w-full">
        <div className="mb-2">
          <h1 className="mb-1 text-slate-900 text-base font-semibold">
            Welcome to TaskMate-AI
          </h1>
          <p className="text-slate-600 text-xs leading-tight mb-1 px-2">
            Streamline your workflow with AI-powered task management
          </p>
          <p className="text-slate-500 text-xs px-2">
            Sign in to access your personalized dashboard and start organizing your tasks efficiently
          </p>
        </div>

        <div className="mb-2">
          <button
            onClick={handleGitHubLogin}
            className="flex items-center justify-center gap-1 w-full px-2 py-1 bg-slate-300 border-none rounded text-xs font-medium cursor-pointer transition-colors hover:bg-slate-400"
          >
            <svg
              height="16"
              width="16"
              viewBox="0 0 16 16"
              fill="currentColor"
              className="w-2 h-2"
            >
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
            </svg>
            Continue with GitHub
          </button>
        </div>

        <div className="mt-2 pt-2 border-t border-gray-200">
          <p className="text-slate-500 text-xs px-2">
            By continuing, you agree to TaskMate-AI's Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login