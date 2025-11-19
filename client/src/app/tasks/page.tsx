import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Calendar, Clock, Tag, CheckCircle2, Edit, Trash2 } from 'lucide-react'
import SideBar from '../dashboard/components/SideBar'
import Settings from '../dashboard/components/Settings'
import Loader from '../loader'
import { useToast } from '../../components/ToastProvider'

interface User {
    user_id: number
    username: string
    avatar_url: string
    email?: string
}

interface Task {
    task_id: number
    user_id: number
    category: string
    title: string
    description: string
    due_date: string
    due_time: string
    priority: string
    has_no_due_date: boolean
    synced_to_google: boolean
    google_event_id: string | null
    status: string
    created_at: string
    updated_at: string
}

function TaskDetailsPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { addToast } = useToast()
    const [user, setUser] = useState<User | null>(null)
    const [task, setTask] = useState<Task | null>(null)
    const [loading, setLoading] = useState(true)
    const [activeView, setActiveView] = useState('dashboard')
    const [isEditing, setIsEditing] = useState(false)
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        dueDate: '',
        dueTime: '',
        category: 'school',
        priority: 'medium',
        status: 'not_started',
    })

    useEffect(() => {
        fetchData()
    }, [id])

    const fetchData = async () => {
        try {
            const userRes = await fetch('/auth/login/success', {
                credentials: 'include'
            })

            if (!userRes.ok) {
                navigate('/login', { replace: true })
                return
            }

            const userData = await userRes.json()
            if (!userData.success || !userData.user) {
                navigate('/login', { replace: true })
                return
            }

            setUser(userData.user)

            // Fetch task details
            const taskRes = await fetch(`/api/tasks/${id}`, {
                credentials: 'include'
            })

            if (taskRes.ok) {
                const taskData = await taskRes.json()
                if (taskData.ok && taskData.task) {
                    setTask(taskData.task)
                    setFormData({
                        title: taskData.task.title,
                        description: taskData.task.description || '',
                        dueDate: taskData.task.due_date ? taskData.task.due_date.split('T')[0] : '',
                        dueTime: taskData.task.due_time || '',
                        category: taskData.task.category,
                        priority: taskData.task.priority,
                        status: taskData.task.status || 'not_started',
                    })
                } else {
                    navigate('/dashboard')
                }
            } else {
                navigate('/dashboard')
            }
        } catch (error) {
            console.error('Error fetching data:', error)
            navigate('/login', { replace: true })
        } finally {
            setLoading(false)
        }
    }

    const handleUpdate = async () => {
        try {
            const response = await fetch(`/api/tasks/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(formData),
            })

            const data = await response.json()
            
            if (data.ok) {
                setTask(data.task)
                setIsEditing(false)
                addToast(
                    'Task updated successfully',
                    'success',
                    `"${formData.title}" has been updated.`
                )
                fetchData() // Refresh data
            } else {
                addToast(
                    'Failed to update task',
                    'danger',
                    data.error
                )
            }
        } catch (error) {
            console.error('Error updating task:', error)
            addToast(
                'Error updating task',
                'danger',
                'An unexpected error occurred. Please try again.'
            )
        }
    }

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this task?')) {
            return
        }

        try {
            const response = await fetch(`/api/tasks/${id}`, {
                method: 'DELETE',
                credentials: 'include',
            })

            const data = await response.json()
            
            if (data.ok) {
                addToast(
                    'Task deleted successfully',
                    'success',
                    'The task has been removed from your list.'
                )
                setTimeout(() => navigate('/dashboard'), 1000)
            } else {
                addToast(
                    'Failed to delete task',
                    'danger',
                    data.error
                )
            }
        } catch (error) {
            console.error('Error deleting task:', error)
            addToast(
                'Error deleting task',
                'danger',
                'An unexpected error occurred. Please try again.'
            )
        }
    }

    const categoryColors = {
        school: { name: 'School', bg: 'bg-purple-100', text: 'text-purple-600', border: 'border-purple-200' },
        personal: { name: 'Personal', bg: 'bg-orange-100', text: 'text-orange-600', border: 'border-orange-200' },
        work: { name: 'Work', bg: 'bg-cyan-100', text: 'text-cyan-600', border: 'border-cyan-200' },
    }

    const priorityColors = {
        low: { name: 'Low', bg: 'bg-emerald-100', text: 'text-emerald-600' },
        medium: { name: 'Medium', bg: 'bg-amber-100', text: 'text-amber-600' },
        high: { name: 'High', bg: 'bg-rose-100', text: 'text-rose-600' },
    }

    const statusColors = {
        not_started: { name: 'Not Started', bg: 'bg-gray-100', text: 'text-gray-600' },
        in_progress: { name: 'In Progress', bg: 'bg-blue-100', text: 'text-blue-600' },
        completed: { name: 'Completed', bg: 'bg-green-100', text: 'text-green-600' },
    }

    if (loading || !user || !task) {
        return <Loader />
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="min-h-screen flex bg-gray-50"
        >
            <SideBar activeView={activeView} onViewChange={setActiveView} />
            <div className="flex-1 flex flex-col">
                {activeView === 'dashboard' && (
                    <div className="flex-1 px-2 md:px-3 pt-2 md:pt-3 pb-4 md:pb-6">
                        {/* Header */}
                        <div className="mb-2">
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 transition"
                            >
                                <ArrowLeft className="w-2 h-2" />
                                Back to Dashboard
                            </button>
                        </div>

                        {/* Task Details Card */}
                        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-2">
                            {/* Header with Actions */}
                            <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-200">
                                <div className="flex items-center gap-1">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${categoryColors[task.category as keyof typeof categoryColors]?.bg} ${categoryColors[task.category as keyof typeof categoryColors]?.text}`}>
                                        {categoryColors[task.category as keyof typeof categoryColors]?.name || task.category}
                                    </span>
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${priorityColors[task.priority as keyof typeof priorityColors]?.bg} ${priorityColors[task.priority as keyof typeof priorityColors]?.text}`}>
                                        {priorityColors[task.priority as keyof typeof priorityColors]?.name || task.priority}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1">
                                    {!isEditing && (
                                        <>
                                            <button
                                                onClick={() => setIsEditing(true)}
                                                className="p-1 hover:bg-gray-100 rounded transition-colors"
                                                title="Edit task"
                                            >
                                                <Edit className="w-2 h-2 text-slate-600" />
                                            </button>
                                            <button
                                                onClick={handleDelete}
                                                className="p-1 hover:bg-red-100 rounded transition-colors"
                                                title="Delete task"
                                            >
                                                <Trash2 className="w-2 h-2 text-red-600" />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Title */}
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full text-xl font-bold text-slate-900 mb-2 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                            ) : (
                                <h1 className="text-xl font-bold text-slate-900 mb-2">{task.title}</h1>
                            )}

                            {/* Description */}
                            <div className="mb-2">
                                <h3 className="text-sm font-semibold text-slate-700 mb-1">Description</h3>
                                {isEditing ? (
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full text-sm text-slate-900 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 min-h-[100px]"
                                        placeholder="Add a description..."
                                    />
                                ) : (
                                    <p className="text-sm text-slate-600">{task.description || 'No description provided.'}</p>
                                )}
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                                {/* Due Date */}
                                <div className="flex items-center gap-1 p-2 bg-gray-50 rounded border border-gray-200">
                                    <Calendar className="w-2 h-2 text-slate-600" />
                                    <div>
                                        <p className="text-xs font-medium text-slate-700">Due Date</p>
                                        {isEditing ? (
                                            <input
                                                type="date"
                                                value={formData.dueDate}
                                                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                                className="text-sm text-slate-900 px-1 py-0.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                            />
                                        ) : (
                                            <p className="text-sm text-slate-900">
                                                {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Due Time */}
                                <div className="flex items-center gap-1 p-2 bg-gray-50 rounded border border-gray-200">
                                    <Clock className="w-2 h-2 text-slate-600" />
                                    <div>
                                        <p className="text-xs font-medium text-slate-700">Due Time</p>
                                        {isEditing ? (
                                            <input
                                                type="time"
                                                value={formData.dueTime}
                                                onChange={(e) => setFormData({ ...formData, dueTime: e.target.value })}
                                                className="text-sm text-slate-900 px-1 py-0.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                            />
                                        ) : (
                                            <p className="text-sm text-slate-900">{task.due_time || 'No time set'}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Category */}
                                {isEditing && (
                                    <div className="flex items-center gap-1 p-2 bg-gray-50 rounded border border-gray-200">
                                        <Tag className="w-2 h-2 text-slate-600" />
                                        <div className="flex-1">
                                            <p className="text-xs font-medium text-slate-700 mb-1">Category</p>
                                            <select
                                                value={formData.category}
                                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                                className="w-full text-sm text-slate-900 px-1 py-0.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                            >
                                                <option value="school">School</option>
                                                <option value="personal">Personal</option>
                                                <option value="work">Work</option>
                                            </select>
                                        </div>
                                    </div>
                                )}

                                {/* Priority */}
                                {isEditing && (
                                    <div className="flex items-center gap-1 p-2 bg-gray-50 rounded border border-gray-200">
                                        <Tag className="w-2 h-2 text-slate-600" />
                                        <div className="flex-1">
                                            <p className="text-xs font-medium text-slate-700 mb-1">Priority</p>
                                            <select
                                                value={formData.priority}
                                                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                                className="w-full text-sm text-slate-900 px-1 py-0.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                            >
                                                <option value="low">Low</option>
                                                <option value="medium">Medium</option>
                                                <option value="high">High</option>
                                            </select>
                                        </div>
                                    </div>
                                )}

                                {/* Status */}
                                <div className="flex items-center gap-1 p-2 bg-gray-50 rounded border border-gray-200">
                                    <CheckCircle2 className="w-2 h-2 text-slate-600" />
                                    <div className="flex-1">
                                        <p className="text-xs font-medium text-slate-700 mb-1">Status</p>
                                        {isEditing ? (
                                            <select
                                                value={formData.status}
                                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                                className="w-full text-sm text-slate-900 px-1 py-0.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                            >
                                                <option value="not_started">Not Started</option>
                                                <option value="in_progress">In Progress</option>
                                                <option value="completed">Completed</option>
                                            </select>
                                        ) : (
                                            <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${statusColors[(task.status || 'not_started') as keyof typeof statusColors]?.bg || 'bg-gray-100'} ${statusColors[(task.status || 'not_started') as keyof typeof statusColors]?.text || 'text-gray-600'}`}>
                                                {statusColors[(task.status || 'not_started') as keyof typeof statusColors]?.name || task.status || 'Not Started'}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Google Calendar Sync */}
                                <div className="flex items-center gap-1 p-2 bg-gray-50 rounded border border-gray-200">
                                    <Calendar className="w-2 h-2 text-slate-600" />
                                    <div>
                                        <p className="text-xs font-medium text-slate-700">Google Calendar</p>
                                        <p className="text-sm text-slate-900">
                                            {task.synced_to_google ? '✓ Synced' : 'Not synced'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Timestamps */}
                            <div className="text-xs text-slate-500 pt-2 border-t border-gray-200">
                                <p>Created: {new Date(task.created_at).toLocaleString()}</p>
                                <p>Updated: {new Date(task.updated_at).toLocaleString()}</p>
                            </div>

                            {/* Action Buttons */}
                            {isEditing && (
                                <div className="flex gap-1 mt-2 pt-2 border-t border-gray-200">
                                    <button
                                        onClick={handleUpdate}
                                        className="px-2 py-1 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded transition"
                                    >
                                        Save Changes
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsEditing(false)
                                            setFormData({
                                                title: task.title,
                                                description: task.description || '',
                                                dueDate: task.due_date ? task.due_date.split('T')[0] : '',
                                                dueTime: task.due_time || '',
                                                category: task.category,
                                                priority: task.priority,
                                                status: task.status || 'not_started',
                                            })
                                        }}
                                        className="px-2 py-1 text-xs font-medium text-slate-600 bg-gray-100 hover:bg-gray-200 rounded transition"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
                {activeView === 'settings' && <Settings />}
            </div>
        </motion.div>
    )
}

export default TaskDetailsPage
