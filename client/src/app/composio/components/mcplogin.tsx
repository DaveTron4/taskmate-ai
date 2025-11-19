import { useEffect, useState } from "react";
import "./MCPLogin.css";

export default function MCPLogin({ onComplete }: { onComplete?: () => void }) {

    const [connectionStatus, setConnectionStatus] = useState({
        gmail: false,
        googlecalendar: false,
        googlemeetings: false,
        canvas: false,
        loading: true
    });

    const [canvasState, setCanvasState] = useState<"idle" | "connecting" | "connected" | "error">("idle");
    const [googleState, setGoogleState] = useState<"idle" | "connecting" | "connected" | "error">("idle");
    const [calendarState, setCalendarState] = useState<"idle" | "connecting" | "connected" | "error">("idle");
    const [meetingsState, setMeetingsState] = useState<"idle" | "connecting" | "connected" | "error">("idle");


    async function checkConnectionStatus() {
        try {
            const res = await fetch("http://localhost:3001/api/auth/status", {
                credentials: 'include'
            });
            const data = await res.json();
            if (data?.ok) {
                const newStatus = {
                    gmail: data.connectedAccounts.gmail,
                    googlecalendar: data.connectedAccounts.googlecalendar,
                    googlemeetings: data.connectedAccounts.googlemeetings,
                    canvas: data.connectedAccounts.canvas,
                    loading: false
                };
                setConnectionStatus(newStatus);
                return newStatus;
            }
            return null;
        } catch (e) {
            console.error("Failed to check connection status:", e);
            setConnectionStatus(prev => ({ ...prev, loading: false }));
            return null;
        }
    }

    async function connectGmail() {
        try {
            setGoogleState("connecting");
            const res = await fetch(`http://localhost:3001/api/auth/gmail/start`, {
                credentials: 'include'
            });
            const data = await res.json();
            if (data?.ok && data.url) {
                window.open(data.url, '_blank');
                let attempts = 0;
                const checkInterval = setInterval(async () => {
                    attempts++;
                    const status = await checkConnectionStatus();
                    if (attempts >= 30 || status?.gmail) {
                        clearInterval(checkInterval);
                        if (status?.gmail) {
                            setGoogleState("connected");
                        } else if (attempts >= 30) {
                            setGoogleState("error");
                        }
                    }
                }, 2000);
            } else {
                console.error('Gmail auth failed:', data);
                const errorMsg = data?.error || 'Unknown error';
                alert(`Gmail connection failed: ${errorMsg}`);
                setGoogleState("error");
            }
        } catch (e) {
            console.error("Failed to start Gmail auth:", e);
            setGoogleState("error");
        }
    }

    async function connectCanvas() {
        try {
            setCanvasState("connecting");
            const res = await fetch("http://localhost:3001/api/auth/canvas/start", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: 'include'
            });
            const data = await res.json();
            if (data?.ok) {
                let attempts = 0;
                const maxAttempts = 15;
                const checkInterval = setInterval(async () => {
                    attempts++;
                    const status = await checkConnectionStatus();
                    if (status?.canvas) {
                        clearInterval(checkInterval);
                        setCanvasState("connected");
                    } else if (attempts >= maxAttempts) {
                        clearInterval(checkInterval);
                        setCanvasState("error");
                    }
                }, 2000);
            } else {
                console.error('Canvas auth failed:', data);
                const errorMsg = data?.error || 'Unknown error';
                alert(`Canvas connection failed: ${errorMsg}`);
                setCanvasState("error");
            }
        } catch (e) {
            console.error("Failed to start Canvas auth:", e);
            setCanvasState("error");
        }
    }

    async function connectGoogleCalendar() {
        try {
            setCalendarState("connecting");
            const res = await fetch(`http://localhost:3001/api/auth/gcalendar/start`, {
                credentials: 'include'
            });
            const data = await res.json();
            if (data?.ok && data.url) {
                window.open(data.url, '_blank');
                let attempts = 0;
                const checkInterval = setInterval(async () => {
                    attempts++;
                    const status = await checkConnectionStatus();
                    if (attempts >= 30 || status?.googlecalendar) {
                        clearInterval(checkInterval);
                        if (status?.googlecalendar) {
                            setCalendarState("connected");
                        } else if (attempts >= 30) {
                            setCalendarState("error");
                        }
                    }
                }, 2000);
            } else {
                console.error('Google Calendar auth failed:', data);
                const errorMsg = data?.error || 'Unknown error';
                alert(`Google Calendar connection failed: ${errorMsg}`);
                setCalendarState("error");
            }
        } catch (e) {
            console.error("Failed to start Google Calendar auth:", e);
            setCalendarState("error");
        }
    }

    async function connectGoogleMeetings() {
        try {
            setMeetingsState("connecting");
            const res = await fetch(`http://localhost:3001/api/auth/gmeetings/start`, {
                credentials: 'include'
            });
            const data = await res.json();
            if (data?.ok && data.url) {
                window.open(data.url, '_blank');
                let attempts = 0;
                const checkInterval = setInterval(async () => {
                    attempts++;
                    const status = await checkConnectionStatus();
                    if (attempts >= 30 || status?.googlemeetings) {
                        clearInterval(checkInterval);
                        if (status?.googlemeetings) {
                            setMeetingsState("connected");
                        } else if (attempts >= 30) {
                            setMeetingsState("error");
                        }
                    }
                }, 2000);
            } else {
                console.error('Google Meetings auth failed:', data);
                const errorMsg = data?.error || 'Unknown error';
                alert(`Google Meetings connection failed: ${errorMsg}`);
                setMeetingsState("error");
            }
        } catch (e) {
            console.error("Failed to start Google Meetings auth:", e);
            setMeetingsState("error");
        }
    }

    useEffect(() => {
        checkConnectionStatus().then((status) => {
            if (status) {
                if (status.gmail && googleState === "idle") {
                    setGoogleState("connected");
                }
                if (status.googlecalendar && calendarState === "idle") {
                    setCalendarState("connected");
                }
                if (status.googlemeetings && meetingsState === "idle") {
                    setMeetingsState("connected");
                }
                if (status.canvas && canvasState === "idle") {
                    setCanvasState("connected");
                }
            }
        });
    }, []);

    useEffect(() => {
        const handleFocus = () => {
            setTimeout(async () => {
                const status = await checkConnectionStatus();
                if (status) {
                    if (status.gmail && googleState === "connecting") {
                        setGoogleState("connected");
                    }
                    if (status.googlecalendar && calendarState === "connecting") {
                        setCalendarState("connected");
                    }
                    if (status.googlemeetings && meetingsState === "connecting") {
                        setMeetingsState("connected");
                    }
                    if (status.canvas && canvasState === "connecting") {
                        setCanvasState("connected");
                    }
                }
            }, 1000);
        };

        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, [googleState, calendarState, meetingsState, canvasState]);

    useEffect(() => {
        if (connectionStatus.loading) return;
        if (connectionStatus.gmail && googleState === "connecting") {
            setGoogleState("connected");
        } else if (!connectionStatus.gmail && googleState === "connected") {
            setGoogleState("idle");
        }

        if (connectionStatus.googlecalendar && calendarState === "connecting") {
            setCalendarState("connected");
        } else if (!connectionStatus.googlecalendar && calendarState === "connected") {
            setCalendarState("idle");
        }

        if (connectionStatus.googlemeetings && meetingsState === "connecting") {
            setMeetingsState("connected");
        } else if (!connectionStatus.googlemeetings && meetingsState === "connected") {
            setMeetingsState("idle");
        }

        if (connectionStatus.canvas && canvasState === "connecting") {
            setCanvasState("connected");
        } else if (!connectionStatus.canvas && canvasState === "connected") {
            setCanvasState("idle");
        }
    }, [connectionStatus]);

    function resetService(service: "canvas" | "google" | "calendar" | "meetings") {
        if (service === "canvas") setCanvasState("idle");
        else if (service === "google") setGoogleState("idle");
        else if (service === "calendar") setCalendarState("idle");
        else if (service === "meetings") setMeetingsState("idle");
    }

    function handleDone() {
        if (onComplete) {
            onComplete();
        }
    }

    return (
        <div className="mcp-login-container" role="main" aria-label="Connect Services">
            <div className="mcp-login-card">
                <div className="mcp-login-header">
                    <div className="logo-and-title">

                        <div className="title-text">
                            <h1>Welcome to</h1>
                            <h2>TaskMate-AI</h2>
                        </div>
                    </div>

                    <p className="subheader">Connect services to get started:</p>
                    <div className="divider"></div>

                    {(canvasState === "connecting" || googleState === "connecting" || calendarState === "connecting" || meetingsState === "connecting") && (
                        <div className="micro-progress" aria-hidden="true">
                            <div className="micro-progress-bar" />
                        </div>
                    )}
                </div>

                <div className="connection-buttons">
                    {/* Canvas */}
                    <div className="connect-row">
                        <button
                            className={`connect-btn ${canvasState === "connected" ? "is-connected" : ""}`}
                            aria-label={canvasState === "connected" ? `Connected!` : "Connect with Canvas"}
                            disabled={canvasState === "connecting"}
                            onClick={connectCanvas}
                        >
                            <div className="btn-icon" aria-hidden="true">
                                <svg width="28" height="28" viewBox="0 0 24 24" role="img" aria-label="Canvas icon">
                                    <title>Canvas</title>
                                    <circle cx="12" cy="12" r="10" fill="#E13E3B" />
                                    <circle cx="12" cy="12" r="2" fill="#fff" />
                                    <circle cx="12" cy="5.2" r="1.2" fill="#fff" />
                                    <circle cx="12" cy="18.8" r="1.2" fill="#fff" />
                                    <circle cx="5.2" cy="12" r="1.2" fill="#fff" />
                                    <circle cx="18.8" cy="12" r="1.2" fill="#fff" />
                                    <circle cx="7.2" cy="7.2" r="1.2" fill="#fff" />
                                    <circle cx="16.8" cy="7.2" r="1.2" fill="#fff" />
                                    <circle cx="7.2" cy="16.8" r="1.2" fill="#fff" />
                                    <circle cx="16.8" cy="16.8" r="1.2" fill="#fff" />
                                </svg>
                            </div>

                            <span className="btn-label">
                                {canvasState === "connected" ? `Connected!` : "Connect with Canvas"}
                            </span>

                            {canvasState === "connecting" && <span className="left-spinner" aria-hidden="true"></span>}

                            {canvasState === "connected" ? (
                                <span className="right-adornment">
                                    <span className="check" aria-hidden="true">✓</span>
                                    <span className="manage" role="button" tabIndex={0} aria-label="Manage Canvas connection">Manage ▸</span>
                                </span>
                            ) : (
                                <span className="chevron" aria-hidden="true">›</span>
                            )}
                        </button>
                    </div>

                    {canvasState === "error" && (
                        <div className="inline-error" role="alert">
                            Connection failed. <button className="retry-link" onClick={() => resetService("canvas")}>Try again</button>.
                        </div>
                    )}

                    {/* Google */}
                    <div className="connect-row">
                        <button
                            className={`connect-btn ${googleState === "connected" ? "is-connected" : ""}`}
                            aria-label={googleState === "connected" ? `Connected!` : "Connect with Google"}
                            disabled={googleState === "connecting"}
                            onClick={connectGmail}
                        >
                            <div className="btn-icon" aria-hidden="true">
                                <svg width="28" height="28" viewBox="0 0 24 24" role="img" aria-label="Google icon">
                                    <title>Google</title>
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                            </div>

                            <span className="btn-label">
                                {googleState === "connected" ? `Connected!` : "Connect with Google"}
                            </span>

                            {googleState === "connecting" && <span className="left-spinner" aria-hidden="true"></span>}

                            {googleState === "connected" ? (
                                <span className="right-adornment">
                                    <span className="check" aria-hidden="true">✓</span>
                                    <span className="manage" role="button" tabIndex={0} aria-label="Manage Google connection">Manage ▸</span>
                                </span>
                            ) : (
                                <span className="chevron" aria-hidden="true">›</span>
                            )}
                        </button>
                    </div>

                    {googleState === "error" && (
                        <div className="inline-error" role="alert">
                            Connection failed. <button className="retry-link" onClick={() => resetService("google")}>Try again</button>.
                        </div>
                    )}

                    {/* Google Calendar */}
                    <div className="connect-row">
                        <button
                            className={`connect-btn ${calendarState === "connected" ? "is-connected" : ""}`}
                            aria-label={calendarState === "connected" ? "Connected to Google Calendar" : "Connect with Google Calendar"}
                            disabled={calendarState === "connecting"}
                            onClick={connectGoogleCalendar}
                        >
                            <div className="btn-icon" aria-hidden="true">
                                <svg width="28" height="28" viewBox="0 0 24 24" role="img" aria-label="Calendar icon">
                                    <title>Google Calendar</title>
                                    <rect x="4" y="5" width="16" height="14" rx="1" fill="#4285F4" />
                                    <path d="M8 9v6l4-2 4 2V9" fill="white" opacity="0.9" />
                                </svg>
                            </div>

                            <span className="btn-label">
                                {calendarState === "connected" ? "Connected to Calendar" : "Connect with Google Calendar"}
                            </span>

                            {calendarState === "connecting" && <span className="left-spinner" aria-hidden="true"></span>}

                            {calendarState === "connected" ? (
                                <span className="right-adornment">
                                    <span className="check" aria-hidden="true">✓</span>
                                    <span className="manage" role="button" tabIndex={0} aria-label="Manage Calendar connection">Manage ▸</span>
                                </span>
                            ) : (
                                <span className="chevron" aria-hidden="true">›</span>
                            )}
                        </button>
                    </div>

                    {calendarState === "error" && (
                        <div className="inline-error" role="alert">
                            Connection failed. <button className="retry-link" onClick={() => resetService("calendar")}>Try again</button>.
                        </div>
                    )}

                    {/* Google Meetings */}
                    <div className="connect-row">
                        <button
                            className={`connect-btn ${meetingsState === "connected" ? "is-connected" : ""}`}
                            aria-label={meetingsState === "connected" ? "Connected to Google Meetings" : "Connect with Google Meetings"}
                            disabled={meetingsState === "connecting"}
                            onClick={connectGoogleMeetings}
                        >
                            <div className="btn-icon" aria-hidden="true">
                                <svg width="28" height="28" viewBox="0 0 24 24" role="img" aria-label="Meetings icon">
                                    <title>Google Meetings</title>
                                    <circle cx="12" cy="12" r="10" fill="#34A853" />
                                    <path d="M8 10l4 3 4-3v6H8v-6z" fill="white" />
                                </svg>
                            </div>

                            <span className="btn-label">
                                {meetingsState === "connected" ? "Connected to Meetings" : "Connect with Google Meetings"}
                            </span>

                            {meetingsState === "connecting" && <span className="left-spinner" aria-hidden="true"></span>}

                            {meetingsState === "connected" ? (
                                <span className="right-adornment">
                                    <span className="check" aria-hidden="true">✓</span>
                                    <span className="manage" role="button" tabIndex={0} aria-label="Manage Meetings connection">Manage ▸</span>
                                </span>
                            ) : (
                                <span className="chevron" aria-hidden="true">›</span>
                            )}
                        </button>
                    </div>

                    {meetingsState === "error" && (
                        <div className="inline-error" role="alert">
                            Connection failed. <button className="retry-link" onClick={() => resetService("meetings")}>Try again</button>.
                        </div>
                    )}
                </div>

                <div className="done-section">
                    <button
                        onClick={handleDone}
                        className="primary-btn"
                        type="button"
                        aria-label="Continue to app"
                    >
                        Done
                    </button>
                </div>

                <div className="bottom-section">
                    <div className="divider"></div>
                    <p className="footer-text">
                        Built with Composio.
                    </p>
                </div>
            </div>
        </div>
    );
}

