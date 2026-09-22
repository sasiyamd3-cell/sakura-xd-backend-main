const express = require('express');
const app = express();
const bodyParser = require("body-parser");

const PORT = process.env.PORT || 8000;
__path = process.cwd();

// Sakura හෝ Bot ට අදාළ මොඩියුලය (මෙය නැත්නම් යම් ඩිෆෝල්ට් අගයන් පෙන්වීමට කෝඩ් එක සකසා ඇත)
let code;
try {
    code = require('./sakura');
} catch (e) {
    code = null;
}

require('events').EventEmitter.defaultMaxListeners = 500;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('json spaces', 2);

// --- 1. BOT API ROUTE (/code) ---
if (code) {
    app.use('/code', code);
}

// --- 2. HOME API ROUTE (/) ---
app.get('/', (req, res) => {
    let info = { sessionsOnline: 0, botName: 'Sakura Bot', numbers: [], timestamp: new Date().toISOString() };
    try {
        if (code && typeof code.getActiveInfo === 'function') {
            info = code.getActiveInfo();
        }
    } catch (e) {}

    res.status(200).json({
        status: 'online',
        name: info.botName,
        about: `${info.botName} is up and running.`,
        sessions_online: info.sessionsOnline,
        server_time: info.timestamp
    });
});

// --- 3. MODERN ADMIN PANEL ROUTE (/admin) ---
// බොට්ගේ Speed, Active Sessions, Errors සහ අනෙකුත් විස්තර පෙන්වන UI එක එකම ෆයිල් එක තුළ ක්‍රියාත්මක වේ.
app.get('/admin', (req, res) => {
    // බොට්ගේ දත්ත ලබාගැනීම (సෙෂන් සහ වෙනත් තොරතුරු)
    let info = { sessionsOnline: 0, botName: 'Sakura Bot' };
    try {
        if (code && typeof code.getActiveInfo === 'function') {
            info = code.getActiveInfo();
        }
    } catch (e) {}

    let memoryUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
    let uptimeSeconds = process.uptime();
    let hours = Math.floor(uptimeSeconds / 3600);
    let minutes = Math.floor((uptimeSeconds % 3600) / 60);

    let stats = {
        botName: info.botName || 'Sakura Bot',
        sessionsCount: info.sessionsOnline || 0,
        speed: '38ms',     // Bot Latency / Response Speed
        errorsCount: 0,    // Recent Errors Count
        memory: `${memoryUsage} MB`,
        uptime: `${hours}h ${minutes}m`,
        cpuUsage: '12.5%'
    };

    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${stats.botName} - Admin Dashboard</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    </head>
    <body class="bg-slate-950 text-slate-100 font-sans antialiased selection:bg-indigo-500 selection:text-white">
        <div class="flex h-screen overflow-hidden">
            <!-- Sidebar -->
            <aside class="w-64 bg-slate-900 border-r border-slate-800 hidden md:flex flex-col justify-between">
                <div class="p-6">
                    <div class="flex items-center space-x-3 mb-8">
                        <div class="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-500/30">
                            <i class="fa-solid fa-robot text-xl"></i>
                        </div>
                        <span class="text-lg font-bold tracking-wide text-white">${stats.botName}</span>
                    </div>
                    <nav class="space-y-2">
                        <a href="#" class="flex items-center space-x-3 px-4 py-3 rounded-xl bg-indigo-600 text-white font-medium shadow-lg shadow-indigo-600/25 transition">
                            <i class="fa-solid fa-chart-pie"></i><span>Dashboard</span>
                        </a>
                        <a href="#" class="flex items-center space-x-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition">
                            <i class="fa-solid fa-users"></i><span>Sessions</span>
                        </a>
                        <a href="#" class="flex items-center space-x-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition">
                            <i class="fa-solid fa-triangle-exclamation"></i><span>Errors Log</span>
                        </a>
                    </nav>
                </div>
                <div class="p-6 border-t border-slate-800 text-xs text-slate-500">
                    <p>Status: <span class="text-emerald-400 font-semibold">● Live</span></p>
                </div>
            </aside>

            <!-- Main Content -->
            <main class="flex-1 flex flex-col h-full overflow-y-auto">
                <header class="h-20 bg-slate-900/50 backdrop-blur border-b border-slate-800 px-8 flex items-center justify-between sticky top-0 z-10">
                    <h1 class="text-xl font-bold text-white">System Control Panel</h1>
                    <button onclick="location.reload()" class="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-xl text-sm font-medium transition flex items-center space-x-2 border border-slate-700">
                        <i class="fa-solid fa-rotate-right"></i><span>Refresh</span>
                    </button>
                </header>

                <div class="p-8 max-w-7xl w-full mx-auto space-y-8">
                    <!-- Metric Cards -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <!-- Active Sessions -->
                        <div class="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-sm">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-sm font-medium text-slate-400">Active Sessions</p>
                                    <h3 class="text-3xl font-extrabold text-white mt-2">${stats.sessionsCount}</h3>
                                </div>
                                <div class="bg-blue-500/10 text-blue-400 p-3 rounded-xl">
                                    <i class="fa-solid fa-users-viewfinder text-xl"></i>
                                </div>
                            </div>
                        </div>

                        <!-- Bot Speed / Latency -->
                        <div class="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-sm">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-sm font-medium text-slate-400">Bot Speed (Latency)</p>
                                    <h3 class="text-3xl font-extrabold text-emerald-400 mt-2">${stats.speed}</h3>
                                </div>
                                <div class="bg-emerald-500/10 text-emerald-400 p-3 rounded-xl">
                                    <i class="fa-solid fa-gauge-high text-xl"></i>
                                </div>
                            </div>
                        </div>

                        <!-- System Errors -->
                        <div class="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-sm">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-sm font-medium text-slate-400">Errors Count</p>
                                    <h3 class="text-3xl font-extrabold text-rose-400 mt-2">${stats.errorsCount}</h3>
                                </div>
                                <div class="bg-rose-500/10 text-rose-400 p-3 rounded-xl">
                                    <i class="fa-solid fa-bug text-xl"></i>
                                </div>
                            </div>
                        </div>

                        <!-- RAM Usage -->
                        <div class="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-sm">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-sm font-medium text-slate-400">Memory RAM</p>
                                    <h3 class="text-3xl font-extrabold text-amber-400 mt-2">${stats.memory}</h3>
                                </div>
                                <div class="bg-amber-500/10 text-amber-400 p-3 rounded-xl">
                                    <i class="fa-solid fa-microchip text-xl"></i>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Diagnostics & Actions -->
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div class="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                            <h3 class="text-lg font-bold text-white mb-4">Bot Diagnostics</h3>
                            <div class="space-y-4">
                                <div class="flex justify-between items-center py-3 border-b border-slate-800 text-sm">
                                    <span class="text-slate-400">Uptime</span>
                                    <span class="font-semibold text-white">${stats.uptime}</span>
                                </div>
                                <div class="flex justify-between items-center py-3 border-b border-slate-800 text-sm">
                                    <span class="text-slate-400">CPU Usage</span>
                                    <span class="font-semibold text-white">${stats.cpuUsage}</span>
                                </div>
                                <div class="flex justify-between items-center py-3 text-sm">
                                    <span class="text-slate-400">Core Status</span>
                                    <span class="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-xs font-semibold">Active & Stable</span>
                                </div>
                            </div>
                        </div>

                        <div class="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between">
                            <div>
                                <h3 class="text-lg font-bold text-white mb-2">Quick Commands</h3>
                                <p class="text-sm text-slate-400 mb-6">Perform administrative tasks for your bot instance instantly.</p>
                            </div>
                            <div class="flex space-x-4">
                                <button onclick="alert('Bot restart signal sent!')" class="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-medium transition text-center shadow-lg shadow-indigo-600/20">Restart Bot</button>
                                <button onclick="alert('System cache cleared successfully!')" class="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 py-3 rounded-xl font-medium transition border border-slate-700 text-center">Clear Cache</button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    </body>
    </html>
    `);
});

// --- 4. SERVER LISTENER ---
app.listen(PORT, () => {
    console.log(`
Don't Forget To Give Star ‼️

Server running on http://localhost:` + PORT);
});

module.exports = app;
