import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './app/login/page.tsx'
import DashboardPage from './app/dashboard/page.tsx'
import ComposioPage from './app/composio/page.tsx'
import TaskDetailsPage from './app/tasks/page.tsx'
import { ToastProvider } from './components/ToastProvider.tsx'
import '@patternfly/react-core/dist/styles/base.css'
import './styles/toast.css'

function App() {
    return (
        <ToastProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/composio" element={<ComposioPage />} />
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/tasks/:id" element={<TaskDetailsPage />} />
                    <Route path="/" element={<Navigate to="/login" replace />} />
                </Routes>
            </BrowserRouter>
        </ToastProvider>
    )
}

export default App

