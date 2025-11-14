import { useState, useEffect } from 'react'

interface User {
  user_id: number
  username: string
  avatar_url: string
  email?: string
}

function Login() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is already logged in
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
    window.location.href = 'http://localhost:3001/auth/github'
  }

  const handleLogout = async () => {
    try {
      await fetch('http://localhost:3001/auth/logout', {
        credentials: 'include'
      })
      setUser(null)
    } catch (error) {
      console.error('Error logging out:', error)
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

  return (
    <div className="flex justify-center items-center min-h-screen p-6">
      {user ? (
        <div className="bg-[var(--card-bg)] px-12 py-12 rounded-[var(--radius-card)] shadow-[var(--shadow-card)] text-center max-w-md w-full">
          <h2 className="mb-8 text-gray-800 text-xl font-bold">
            Welcome Back!
          </h2>
          
          <div className="mb-8 flex flex-col items-center">
            <img 
              src={user.avatar_url} 
              alt={user.username} 
              className="w-20 h-20 rounded-full mb-4 border-2 border-gray-200"
            />
            <h3 className="mb-2 text-gray-800 text-lg font-semibold">
              {user.username}
            </h3>
            {user.email && (
              <p className="mt-1 text-gray-600 text-sm">
                {user.email}
              </p>
            )}
          </div>
          
          <button 
            onClick={handleLogout} 
            className="w-full px-6 py-2.5 bg-[var(--btn-error)] text-white border-none rounded-lg text-sm font-semibold cursor-pointer transition-colors duration-[var(--transition)] hover:bg-[var(--btn-error-hover)] mt-4"
          >
            Logout
          </button>
        </div>
      ) : (
        <div className="bg-[var(--card-bg)] px-12 py-12 rounded-[var(--radius-card)] shadow-[var(--shadow-card)] text-center max-w-md w-full">
          <div className="mb-10">
            <h1 className="mb-4 text-gray-900 text-2xl font-bold">
              Welcome to TaskMate-AI
            </h1>
            <p className="text-gray-600 text-sm leading-relaxed mb-3 px-4">
              Streamline your workflow with AI-powered task management
            </p>
            <p className="text-gray-500 text-xs px-6">
              Sign in to access your personalized dashboard and start organizing your tasks efficiently
            </p>
          </div>
          
          <div className="mb-8">
            <button 
              onClick={handleGitHubLogin} 
              className="flex items-center justify-center gap-3 w-full px-6 py-3 bg-[var(--btn-github)] text-white border-none rounded-lg text-sm font-medium cursor-pointer transition-colors duration-[var(--transition)] hover:bg-[var(--btn-github-hover)]"
            >
              <svg 
                height="20" 
                width="20" 
                viewBox="0 0 16 16" 
                fill="currentColor"
                className="w-5 h-5"
              >
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
              </svg>
              Continue with GitHub
            </button>
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-gray-500 text-xs px-4">
              By continuing, you agree to TaskMate-AI's Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default Login
