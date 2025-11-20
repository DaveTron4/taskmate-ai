import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CalendarDays, CheckSquare } from 'lucide-react'
import Calendar from './components/Calendar'
import Top from './components/Top'
import Task from './components/Task'
import SideBar from './components/SideBar'
import Settings from './components/Settings'
import Email from './components/Email'
import Loader from '../loader'

interface User {
    user_id: number
    username: string
    avatar_url: string
    email?: string
}

interface Assignment {
    id: string | number
    name: string
    courseName: string
    dueDate: string
    points: number | null
    submitted: string | null
    url: string | null
    priority: "low" | "medium" | "high"
    estimatedHours: number | null
    status: "not_started" | "in_progress" | "done"
}

interface CalendarEvent {
    id: string
    title: string
    start: Date
    end: Date
    allDay?: boolean
    backgroundColor?: string
    borderColor?: string
    extendedProps?: any
}

function DashboardPage() {
    const [user, setUser] = useState<User | null>(null)
    const [assignments, setAssignments] = useState<Assignment[]>([])
    const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([])
    const [bootstrapping, setBootstrapping] = useState(true)
    const [dataLoaded, setDataLoaded] = useState(false)
    const [calendarReady, setCalendarReady] = useState(false)
    const [activeView, setActiveView] = useState('dashboard')
    const navigate = useNavigate()

    // Add a new task to state instantly
    const handleTaskCreate = (task: any) => {
        // Add to calendarEvents
        if (task.due_date && !task.has_no_due_date) {
            const dueDate = new Date(task.due_date)
            setCalendarEvents(prev => [
                ...prev,
                {
                    id: `task-${task.task_id}`,
                    title: task.title,
                    start: dueDate,
                    end: dueDate,
                    allDay: !task.due_time,
                    category: task.category,
                    source: task.source || "manual",
                    extendedProps: {
                        type: "task",
                        description: task.description,
                        priority: task.priority,
                        source: task.source || "manual",
                    },
                },
            ])
        }
        // Add to assignments
        setAssignments(prev => [
            ...prev,
            {
                id: `task-${task.task_id}`,
                name: task.title,
                courseName: task.category.charAt(0).toUpperCase() + task.category.slice(1),
                dueDate: task.due_date || new Date().toISOString(),
                points: null,
                submitted: task.status === 'completed' ? new Date().toISOString() : null,
                url: null,
                priority: task.priority,
                estimatedHours: null,
                status: task.status === 'completed' ? 'done' : 'not_started',
            },
        ])
    }

    // Update a task in state instantly
    const handleTaskUpdate = (task: any) => {
        // Update in calendarEvents
        setCalendarEvents(prev => prev.map(ev =>
            ev.id === `task-${task.task_id}`
                ? {
                    ...ev,
                    title: task.title,
                    start: task.due_date ? new Date(task.due_date) : ev.start,
                    end: task.due_date ? new Date(task.due_date) : ev.end,
                    allDay: !task.due_time,
                    category: task.category,
                    source: task.source || "manual",
                    extendedProps: {
                        ...ev.extendedProps,
                        description: task.description,
                        priority: task.priority,
                        source: task.source || "manual",
                    },
                }
                : ev
        ))
        // Update in assignments
        setAssignments(prev => prev.map(a =>
            a.id === `task-${task.task_id}`
                ? {
                    ...a,
                    name: task.title,
                    courseName: task.category.charAt(0).toUpperCase() + task.category.slice(1),
                    dueDate: task.due_date || new Date().toISOString(),
                    priority: task.priority,
                    status: task.status === 'completed' ? 'done' : 'not_started',
                }
                : a
        ))
    }

    // Delete a task from state instantly
    const handleTaskDelete = (taskId: string) => {
        setCalendarEvents(prev => prev.filter(ev => ev.id !== `task-${taskId}`))
        setAssignments(prev => prev.filter(a => a.id !== `task-${taskId}`))
    }

    useEffect(() => {
        fetchAllData()
    }, [])

    useEffect(() => {
        if (dataLoaded && calendarReady) {
            const timer = setTimeout(() => {
                setBootstrapping(false)
            }, 100)
            return () => clearTimeout(timer)
        }
    }, [dataLoaded, calendarReady])

    const fetchAllData = async () => {
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

            const [calendarRes, assignmentsRes, tasksRes] = await Promise.all([
                fetch('/api/calendar/events', {
                    credentials: 'include'
                }),
                fetch('/api/canvas/assignments', {
                    credentials: 'include'
                }),
                fetch('/api/tasks', {
                    credentials: 'include'
                })
            ])

            let allEvents: CalendarEvent[] = []

            if (calendarRes.ok) {
                const calendarData = await calendarRes.json()
                if (calendarData?.ok && calendarData.events) {
                    const events = calendarData.events.map((ev: any) => ({
                        ...ev,
                        start: new Date(ev.start),
                        end: new Date(ev.end),
                        source: "gmail", // Google Calendar events
                        extendedProps: {
                            type: "calendar",
                            source: "gmail",
                        },
                    }))
                    allEvents = [...allEvents, ...events]
                }
            }

            if (assignmentsRes.ok) {
                const assignmentsData = await assignmentsRes.json()
                if (assignmentsData?.ok && Array.isArray(assignmentsData.assignments)) {
                    const normalized: Assignment[] = assignmentsData.assignments.map((raw: any) => ({
                        id: raw.id,
                        name: raw.name || raw.title || "Untitled Assignment",
                        courseName: raw.courseName || raw.course_name || "Unknown Course",
                        dueDate: raw.dueDate || raw.due_date || new Date().toISOString(),
                        points: raw.points ?? null,
                        submitted: raw.submitted ?? null,
                        url: raw.url ?? null,
                        priority: raw.priority ?? "medium",
                        estimatedHours: typeof raw.estimatedHours === "number" ? raw.estimatedHours : null,
                        status: raw.status ?? "not_started",
                    }))
                    setAssignments(normalized)
                }
            }

            // Add manually created tasks to calendar and task list
            if (tasksRes.ok) {
                const tasksData = await tasksRes.json()
                if (tasksData?.ok && Array.isArray(tasksData.tasks)) {
                    // Add tasks to calendar view
                    const taskEvents = tasksData.tasks
                        .filter((task: any) => task.due_date && !task.has_no_due_date)
                        .map((task: any) => {
                            const dueDate = new Date(task.due_date)
                            return {
                                id: `task-${task.task_id}`,
                                title: task.title,
                                start: dueDate,
                                end: dueDate,
                                allDay: !task.due_time,
                                category: task.category,
                                source: task.source || "manual", // Use backend source field
                                extendedProps: {
                                    type: "task",
                                    description: task.description,
                                    priority: task.priority,
                                    source: task.source || "manual",
                                },
                            }
                        })
                    allEvents = [...allEvents, ...taskEvents]

                    // Add tasks to task list
                    const taskAssignments: Assignment[] = tasksData.tasks.map((task: any) => ({
                        id: `task-${task.task_id}`,
                        name: task.title,
                        courseName: task.category.charAt(0).toUpperCase() + task.category.slice(1),
                        dueDate: task.due_date || new Date().toISOString(),
                        points: null,
                        submitted: task.status === 'completed' ? new Date().toISOString() : null,
                        url: null,
                        priority: task.priority,
                        estimatedHours: null,
                        status: task.status === 'completed' ? 'done' : 'not_started',
                    }))
                    setAssignments(prev => [...prev, ...taskAssignments])
                }
            }

            setCalendarEvents(allEvents)
        } catch (error) {
            console.error('Error fetching data:', error)
            navigate('/login', { replace: true })
        } finally {
            setDataLoaded(true)
        }
    }

    if (!user) {
        return null
    }

    return (
        <>
            {bootstrapping && <Loader />}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: bootstrapping ? 0 : 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="min-h-screen flex bg-gray-50"
            >
                <SideBar activeView={activeView} onViewChange={setActiveView} />
                <div className="flex-1 flex flex-col">
                    <Top
                        user={user}
                        onTaskCreate={handleTaskCreate}
                        onTaskUpdate={handleTaskUpdate}
                        onTaskDelete={handleTaskDelete}
                    />
                    {activeView === 'dashboard' && (
                        <div className="flex-1 px-2 md:px-3 pt-2 md:pt-3 pb-4 md:pb-6">
                            <div className="flex flex-col gap-2 h-full">
                                {/* Top Row: Calendar and Tasks */}
                                <div className="flex flex-col lg:flex-row gap-2 h-1/2">
                                    <div className="lg:w-[60%]">
                                        <div className="rounded-xl bg-white shadow-lg border border-gray-200 p-2 flex flex-col h-full">
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="p-1 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg">
                                                    <CalendarDays className="w-2 h-2 text-white" strokeWidth={2} />
                                                </div>
                                                <div className="flex flex-col leading-tight">
                                                    <h2 className="text-base font-semibold text-slate-900">Calendar View</h2>
                                                    <p className="text-xs text-slate-500">Your schedule at a glance</p>
                                                </div>
                                            </div>
                                            <div className="flex-1 min-h-0">
                                                <Calendar
                                                    events={calendarEvents}
                                                    assignments={assignments}
                                                    onReady={() => setCalendarReady(true)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="lg:w-[40%]">
                                        <div className="rounded-xl bg-white shadow-lg border border-gray-200 p-2 flex flex-col h-full">
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="p-1 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg">
                                                    <CheckSquare className="w-2 h-2 text-white" strokeWidth={2} />
                                                </div>
                                                <div className="flex flex-col leading-tight">
                                                    <h2 className="text-base font-semibold text-slate-900">What's Next</h2>
                                                    <p className="text-xs text-slate-500">AI-prioritized tasks</p>
                                                </div>
                                            </div>
                                            <div className="flex-1 overflow-y-auto">
                                                <Task assignments={assignments} setAssignments={setAssignments} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Bottom Row: Emails */}
                                <div>
                                    <div className="rounded-xl bg-gray-100 border border-gray-200 p-2">
                                        <Email />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    {activeView === 'settings' && <Settings />}
                </div>
            </motion.div>
        </>
    )
}
export default DashboardPage



