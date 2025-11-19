import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const MESSAGES = [
    "Initializing your workspace…",
    "Syncing your calendar and assignments…",
    "Claude is organizing your tasks…",
    "Almost ready…",
];

export default function Loader() {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const id = setInterval(() => {
            setIndex((prev) => (prev + 1) % MESSAGES.length);
        }, 3000);

        return () => clearInterval(id);
    }, []);

    return (
        <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-[#3b1d60] via-[#24113d] to-[#12091f]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
        >
            <div className="flex flex-col items-center gap-4 px-6">
                <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-white/5 shadow-[0_18px_45px_rgba(0,0,0,0.25)] backdrop-blur-md">
                    <div className="absolute inset-0 rounded-full border border-white/10" />
                    <div className="h-8 w-8 border-2 border-violet-300 border-t-transparent rounded-full animate-spin" />
                </div>

                <div className="text-center">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-200/80">
                        TaskMate AI
                    </p>
                </div>

                <div className="h-6 flex items-center justify-center">
                    <AnimatePresence mode="wait">
                        <motion.p
                            key={index}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{
                                duration: 0.55,
                                ease: "easeOut",
                            }}
                            className="text-sm text-violet-50/90 font-medium"
                        >
                            {MESSAGES[index]}
                        </motion.p>
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
    );
}
