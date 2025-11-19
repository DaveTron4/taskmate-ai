import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CalendarDays, CheckSquare, Mail } from 'lucide-react'
import Calendar from './components/Calendar'
import Top from './components/Top'
import Task from './components/Task'
import SideBar from './components/SideBar'
import Settings from './components/Settings'
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
            const userRes = await fetch('http://localhost:3001/auth/login/success', {
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

            const [calendarRes, assignmentsRes] = await Promise.all([
                fetch('http://localhost:3001/api/calendar/events', {
                    credentials: 'include'
                }),
                fetch('http://localhost:3001/api/canvas/assignments', {
                    credentials: 'include'
                })
            ])

            if (calendarRes.ok) {
                const calendarData = await calendarRes.json()
                if (calendarData?.ok && calendarData.events) {
                    const events = calendarData.events.map((ev: any) => ({
                        ...ev,
                        start: new Date(ev.start),
                        end: new Date(ev.end),
                        extendedProps: {
                            type: "calendar",
                        },
                    }))
                    setCalendarEvents(events)
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
                    <Top user={user} />
                    {activeView === 'dashboard' && (
                        <div className="flex-1 px-2 md:px-3 pt-2 md:pt-3 pb-4 md:pb-6">
                            <div className="flex flex-col gap-2 md:gap-3 h-full">
                                {/* Top Row: Calendar and Tasks */}
                                <div className="flex flex-col lg:flex-row gap-2 md:gap-3 flex-1">
                                    <div className="flex-[2] min-h-0">
                                        <div className="rounded-xl bg-white shadow-lg border border-gray-200 p-2 md:p-3 h-full flex flex-col">
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
                                    <div className="flex-1 min-h-0">
                                        <div className="rounded-xl bg-white shadow-lg border border-gray-200 p-2 md:p-3 h-full flex flex-col">
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="p-1 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg">
                                                    <CheckSquare className="w-2 h-2 text-white" strokeWidth={2} />
                                                </div>
                                                <div className="flex flex-col leading-tight">
                                                    <h2 className="text-base font-semibold text-slate-900">What's Next</h2>
                                                    <p className="text-xs text-slate-500">AI-prioritized tasks</p>
                                                </div>
                                            </div>
                                            <div className="flex-1 overflow-auto">
                                                <Task />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Bottom Row: Emails */}
                                <div className="h-64 lg:h-80">
                                    <div className="rounded-xl bg-white shadow-lg border border-gray-200 p-2 md:p-3 h-full">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="p-1 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg">
                                                <Mail className="w-2 h-2 text-white" strokeWidth={2} />
                                            </div>
                                            <div className="flex flex-col leading-tight">
                                                <h2 className="text-base font-semibold text-slate-900">Email Summaries</h2>
                                                <p className="text-xs text-slate-500">Important messages from professors</p>
                                            </div>
                                        </div>
                                        <p className="text-sm text-slate-600">Email summaries will appear here...</p>
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



