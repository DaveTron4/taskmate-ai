import { Mail, ExternalLinkIcon } from "lucide-react";

interface EmailSummary {
    id: number;
    sender: string;
    subject: string;
    summary: string;
    timestamp: string;
    priority: "important" | "normal";
    category: string;
}

export default function EmailUI() {
    const emails: EmailSummary[] = [
        {
            id: 1,
            sender: "Prof. Johnson",
            subject: "Assignment Extension",
            summary: "CS 101 final project deadline extended to Nov 8. Submit via Canvas portal with complete documentation.",
            timestamp: "2h ago",
            priority: "important",
            category: "Academic"
        },
        {
            id: 2,
            sender: "Study Group",
            subject: "Math Study Session",
            summary: "Study session moved to Thursday 4 PM in Library Room 203. Bring Chapter 5 notes.",
            timestamp: "5h ago",
            priority: "normal",
            category: "Academic"
        },
        {
            id: 3,
            sender: "Career Center",
            subject: "Internship Opportunities",
            summary: "New tech internships available for summer 2026. Application deadline is Dec 1. Register for info session.",
            timestamp: "1d ago",
            priority: "normal",
            category: "Career"
        }
    ];

    return (
        <div className="flex flex-col h-auto">
            <div className="flex items-start gap-2 mb-2">
                <div className="p-1 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex-shrink-0">
                    <Mail className="w-2 h-2 text-white" strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between mb-1">
                        <h2 className="text-sm font-semibold text-slate-900">Email Insights</h2>
                        <span className="text-xs text-indigo-600 font-medium">{emails.length} new</span>
                    </div>
                    <p className="text-xs text-slate-500">AI-summarized</p>
                </div>
            </div>
            
            <div className="flex gap-2 overflow-x-auto pb-1">
                {emails.map((email) => (
                    <div
                        key={email.id}
                        className="p-2 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer flex-shrink-0 w-[280px]"
                    >
                        <div className="flex items-start justify-between gap-2 mb-1">
                            <div className="flex items-center gap-1 min-w-0">
                                <h3 className="text-sm font-semibold text-slate-900 whitespace-nowrap">
                                    {email.sender}
                                </h3>
                                {email.priority === "important" && (
                                    <span className="px-1 py-0.5 bg-rose-600 text-white rounded text-[10px] font-semibold flex-shrink-0">
                                        Important
                                    </span>
                                )}
                            </div>
                            <button className="text-slate-400 hover:text-slate-600 flex-shrink-0">
                                <ExternalLinkIcon className="w-1.5 h-1.5" />
                            </button>
                        </div>
                        
                        <p className="text-xs text-slate-600 mb-1">{email.subject}</p>
                        
                        <p className="text-xs text-slate-500 leading-relaxed mb-1">
                            {email.summary}
                        </p>
                        
                        <div className="text-xs text-slate-400">{email.timestamp}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
