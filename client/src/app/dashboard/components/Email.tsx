import { useState, useEffect } from "react";
import { Mail, ExternalLinkIcon } from "lucide-react";

interface EmailSummary {
    id: string | number;
    sender: string;
    subject: string;
    summary: string;
    timestamp: string;
    priority: "important" | "normal";
    category: string;
}

export default function EmailUI() {
    const [emails, setEmails] = useState<EmailSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchEmails();
    }, []);

    const fetchEmails = async () => {
        try {
            setLoading(true);
            const response = await fetch("/api/gmail/emails", {
                credentials: "include",
            });

            if (!response.ok) {
                throw new Error("Failed to fetch emails");
            }

            const data = await response.json();
            if (data.ok && Array.isArray(data.emails)) {
                // Limit to 4 emails for display
                setEmails(data.emails.slice(0, 4));
            } else {
                setEmails([]);
            }
        } catch (err) {
            console.error("Error fetching emails:", err);
            setError("Failed to load emails");
            // Keep empty array on error
            setEmails([]);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col h-auto">
                <div className="flex items-start gap-2 mb-2">
                    <div className="p-1 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex-shrink-0">
                        <Mail className="w-2 h-2 text-white" strokeWidth={2} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between mb-1">
                            <h2 className="text-sm font-semibold text-slate-900">Email Insights</h2>
                        </div>
                        <p className="text-xs text-slate-500">Loading...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error || emails.length === 0) {
        return (
            <div className="flex flex-col h-auto">
                <div className="flex items-start gap-2 mb-2">
                    <div className="p-1 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex-shrink-0">
                        <Mail className="w-2 h-2 text-white" strokeWidth={2} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between mb-1">
                            <h2 className="text-sm font-semibold text-slate-900">Email Insights</h2>
                        </div>
                        <p className="text-xs text-slate-500">
                            {error || "No emails found."}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-auto">
            <div className="flex items-start gap-2 mb-2">
                <div className="p-1 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex-shrink-0">
                    <Mail className="w-2 h-2 text-white" strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between mb-1">
                        <h2 className="text-sm font-semibold text-slate-900">Email Insights</h2>
                        <span className="text-xs text-indigo-600 font-medium">{emails.length} emails</span>
                    </div>
                    <p className="text-xs text-slate-500">AI-summarized</p>
                </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
                {emails.map((email) => {
                    // Construct Gmail URL if possible
                    let gmailUrl = undefined;
                    if (email.id && typeof email.id === 'string' && email.id !== 'unknown') {
                        gmailUrl = `https://mail.google.com/mail/u/0/#all/${email.id}`;
                    }
                    return (
                        <div
                            key={email.id}
                            className="p-2 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer flex-shrink-0 w-[400px] min-h-[160px]"
                        >
                            <div className="flex items-start justify-between gap-1 mb-1">
                                <div className="flex items-center gap-1 min-w-0">
                                    <h3 className="text-sm font-semibold text-slate-900 truncate">
                                        {email.sender}
                                    </h3>
                                    {email.priority === "important" && (
                                        <span className="px-0.5 py-0.5 bg-rose-600 text-white rounded text-[10px] font-semibold flex-shrink-0">
                                            Important
                                        </span>
                                    )}
                                </div>
                                {gmailUrl ? (
                                    <a
                                        href={gmailUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-slate-400 hover:text-slate-600 flex-shrink-0"
                                        title="Open in Gmail"
                                        onClick={e => e.stopPropagation()}
                                    >
                                        <ExternalLinkIcon className="w-1.5 h-1.5" />
                                    </a>
                                ) : (
                                    <span className="text-slate-300 flex-shrink-0" title="No link available">
                                        <ExternalLinkIcon className="w-1.5 h-1.5" />
                                    </span>
                                )}
                            </div>

                            <p className="text-xs text-slate-600 mb-1">{email.subject}</p>

                            <p className="text-xs text-slate-500 leading-relaxed mb-1">
                                {email.summary}
                            </p>

                            <div className="text-xs text-slate-400">{email.timestamp}</div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
