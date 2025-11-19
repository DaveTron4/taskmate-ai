import { useState } from "react";
import { CheckSquare, LayoutDashboard, Settings } from "lucide-react";

interface SideBarProps {
    activeView: string;
    onViewChange: (view: string) => void;
}

export default function SideBar({ activeView, onViewChange }: SideBarProps) {
    const [hoveredItem, setHoveredItem] = useState<string | null>(null);

    const navItems = [
        { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
        { id: "settings", label: "Settings", icon: Settings },
    ];

    const isActive = (viewId: string) => activeView === viewId;

    return (
        <div className="flex flex-col items-center h-screen bg-white border-r border-gray-200 py-2">
            {/* Logo */}
            <div className="mb-4 p-1 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg">
                <CheckSquare className="w-2 h-2 text-white" strokeWidth={2.5} />
            </div>

            {/* Navigation Items */}
            <div className="flex flex-col gap-1 w-full px-1 items-center">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <div key={item.id} className="relative">
                            <button
                                onClick={() => onViewChange(item.id)}
                                onMouseEnter={() => setHoveredItem(item.id)}
                                onMouseLeave={() => setHoveredItem(null)}
                                className={`px-1 py-1 rounded-lg transition-all ${
                                    isActive(item.id)
                                        ? "bg-indigo-600 text-white"
                                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                                }`}
                            >
                                <Icon className="w-2 h-2 mx-auto" strokeWidth={2} />
                            </button>

                            {/* Tooltip */}
                            {hoveredItem === item.id && (
                                <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded shadow-lg whitespace-nowrap z-50 border border-gray-700">
                                    {item.label}
                                    <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-800" />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
