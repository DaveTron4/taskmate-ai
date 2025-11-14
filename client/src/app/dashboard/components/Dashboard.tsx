function Dashboard() {
    return (
        <div className="pt-10 px-6 bg-black/10">
            {/* 2-column layout */}
            <div className="grid gap-6 lg:grid-cols-2">

                {/* LEFT CONTENT */}
                <div className="rounded-2xl bg-white p-6 shadow-sm">
                    <h2 className="text-xl font-semibold text-slate-900 mb-2">
                        Tasks
                    </h2>
                    <p className="text-sm text-slate-600">
                        Your tasks will appear here.
                    </p>
                </div>

                {/* RIGHT CONTENT */}
                <div className="rounded-2xl bg-white p-6 shadow-sm">
                    <h2 className="text-xl font-semibold text-slate-900 mb-2">
                        Calendar
                    </h2>
                    <p className="text-sm text-slate-600">
                        Your schedule or calendar will appear here.
                    </p>
                </div>

            </div>
        </div>
    )
}

export default Dashboard
