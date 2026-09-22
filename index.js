const express = require("express");
const os = require("os");

const app = express();
const PORT = process.env.PORT || 8000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

require("events").EventEmitter.defaultMaxListeners = 500;

// ===============================
// BOT / SERVER DATA
// ===============================

const startTime = Date.now();
let errorsCount = 0;

function getUptime() {
    const seconds = Math.floor(process.uptime());

    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return `${days}d ${hours}h ${minutes}m ${secs}s`;
}

function getMemory() {
    const memory = process.memoryUsage();

    return {
        used: (memory.rss / 1024 / 1024).toFixed(2),
        heap: (memory.heapUsed / 1024 / 1024).toFixed(2),
        total: (os.totalmem() / 1024 / 1024).toFixed(2)
    };
}

function getCPU() {
    const cpus = os.cpus();

    let idle = 0;
    let total = 0;

    cpus.forEach(cpu => {
        idle += cpu.times.idle;

        total +=
            cpu.times.user +
            cpu.times.nice +
            cpu.times.sys +
            cpu.times.idle +
            cpu.times.irq;
    });

    if (!total) return "0%";

    return `${Math.max(0, Math.min(100, 100 - (idle / total * 100))).toFixed(1)}%`;
}

// ===============================
// HOME
// ===============================

app.get("/", (req, res) => {
    res.json({
        status: "online",
        bot: "MIYORA MD",
        server: "running",
        uptime: getUptime(),
        memory: `${getMemory().used} MB`,
        time: new Date().toISOString()
    });
});

// ===============================
// API - LIVE STATS
// ===============================

app.get("/api/stats", (req, res) => {

    const memory = getMemory();

    res.json({
        status: "online",
        botName: "MIYORA MD",

        sessions: 0,
        groups: 0,
        users: 0,

        speed: "Online",

        errors: errorsCount,

        memory: memory.used,
        heap: memory.heap,
        totalMemory: memory.total,

        cpu: getCPU(),

        uptime: getUptime(),

        platform: os.platform(),
        arch: os.arch(),
        node: process.version,

        serverTime: new Date().toISOString()
    });
});

// ===============================
// ADMIN PANEL
// ===============================

app.get("/admin", (req, res) => {

res.send(`

<!DOCTYPE html>

<html lang="en">

<head>

<meta charset="UTF-8">

<meta name="viewport"
content="width=device-width, initial-scale=1.0">

<title>MIYORA MD - Admin</title>

<script src="https://cdn.tailwindcss.com"></script>

<link rel="stylesheet"
href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css">

</head>


<body class="bg-slate-950 text-white">


<div class="min-h-screen">


<!-- HEADER -->

<header class="border-b border-slate-800 bg-slate-900">

<div class="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">

<div>

<h1 class="text-2xl font-bold">
♡ MIYORA MD
</h1>

<p class="text-sm text-slate-400">
Bot Control Dashboard
</p>

</div>


<div class="flex items-center gap-2">

<span class="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>

<span class="text-green-400">
LIVE
</span>

</div>

</div>

</header>



<!-- CONTENT -->

<main class="max-w-7xl mx-auto px-6 py-8">


<!-- CARDS -->

<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">


<!-- STATUS -->

<div class="bg-slate-900 border border-slate-800 rounded-2xl p-6">

<div class="flex justify-between">

<div>

<p class="text-slate-400 text-sm">
Bot Status
</p>

<h2 id="status"
class="text-3xl font-bold text-green-400 mt-2">
ONLINE
</h2>

</div>

<div class="bg-green-500/10 text-green-400 p-4 rounded-xl">

<i class="fa-solid fa-robot text-xl"></i>

</div>

</div>

</div>



<!-- SPEED -->

<div class="bg-slate-900 border border-slate-800 rounded-2xl p-6">

<div class="flex justify-between">

<div>

<p class="text-slate-400 text-sm">
Bot Speed
</p>

<h2 id="speed"
class="text-3xl font-bold text-cyan-400 mt-2">
--
</h2>

</div>

<div class="bg-cyan-500/10 text-cyan-400 p-4 rounded-xl">

<i class="fa-solid fa-bolt text-xl"></i>

</div>

</div>

</div>



<!-- MEMORY -->

<div class="bg-slate-900 border border-slate-800 rounded-2xl p-6">

<div class="flex justify-between">

<div>

<p class="text-slate-400 text-sm">
RAM Usage
</p>

<h2 id="memory"
class="text-3xl font-bold text-yellow-400 mt-2">
--
</h2>

</div>

<div class="bg-yellow-500/10 text-yellow-400 p-4 rounded-xl">

<i class="fa-solid fa-memory text-xl"></i>

</div>

</div>

</div>



<!-- ERRORS -->

<div class="bg-slate-900 border border-slate-800 rounded-2xl p-6">

<div class="flex justify-between">

<div>

<p class="text-slate-400 text-sm">
Errors
</p>

<h2 id="errors"
class="text-3xl font-bold text-red-400 mt-2">
0
</h2>

</div>

<div class="bg-red-500/10 text-red-400 p-4 rounded-xl">

<i class="fa-solid fa-bug text-xl"></i>

</div>

</div>

</div>


</div>



<!-- BOT INFO -->

<div class="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-6">


<div class="bg-slate-900 border border-slate-800 rounded-2xl p-6">

<h2 class="text-xl font-bold mb-5">
Bot Information
</h2>


<div class="space-y-4">


<div class="flex justify-between border-b border-slate-800 pb-3">

<span class="text-slate-400">
Bot Name
</span>

<span id="botName">
MIYORA MD
</span>

</div>


<div class="flex justify-between border-b border-slate-800 pb-3">

<span class="text-slate-400">
Groups
</span>

<span id="groups">
0
</span>

</div>


<div class="flex justify-between border-b border-slate-800 pb-3">

<span class="text-slate-400">
Sessions
</span>

<span id="sessions">
0
</span>

</div>


<div class="flex justify-between border-b border-slate-800 pb-3">

<span class="text-slate-400">
Users
</span>

<span id="users">
0
</span>

</div>


<div class="flex justify-between">

<span class="text-slate-400">
Uptime
</span>

<span id="uptime">
--
</span>

</div>


</div>

</div>



<!-- SERVER -->

<div class="bg-slate-900 border border-slate-800 rounded-2xl p-6">

<h2 class="text-xl font-bold mb-5">
Server Information
</h2>


<div class="space-y-4">


<div class="flex justify-between border-b border-slate-800 pb-3">

<span class="text-slate-400">
CPU
</span>

<span id="cpu">
--
</span>

</div>


<div class="flex justify-between border-b border-slate-800 pb-3">

<span class="text-slate-400">
Heap
</span>

<span id="heap">
--
</span>

</div>


<div class="flex justify-between border-b border-slate-800 pb-3">

<span class="text-slate-400">
Node.js
</span>

<span id="node">
--
</span>

</div>


<div class="flex justify-between">

<span class="text-slate-400">
Platform
</span>

<span id="platform">
--
</span>

</div>


</div>

</div>


</div>



<!-- REFRESH -->

<div class="mt-6 bg-slate-900 border border-slate-800 rounded-2xl p-6">

<div class="flex flex-col sm:flex-row justify-between gap-4 items-center">

<div>

<h2 class="font-bold text-lg">
Live Monitoring
</h2>

<p class="text-sm text-slate-400">
Dashboard automatically updates every 3 seconds.
</p>

</div>


<button onclick="loadStats()"
class="bg-indigo-600 hover:bg-indigo-500 px-6 py-3 rounded-xl font-semibold">

<i class="fa-solid fa-rotate mr-2"></i>

Refresh Now

</button>


</div>

</div>


</main>


</div>



<script>

async function loadStats() {

try {

const start = Date.now();

const response = await fetch("/api/stats");

const data = await response.json();

const latency = Date.now() - start;


// STATUS

document.getElementById("status").textContent =
data.status.toUpperCase();


// SPEED

document.getElementById("speed").textContent =
latency + "ms";


// MEMORY

document.getElementById("memory").textContent =
data.memory + " MB";


// ERRORS

document.getElementById("errors").textContent =
data.errors;


// BOT

document.getElementById("botName").textContent =
data.botName;

document.getElementById("groups").textContent =
data.groups;

document.getElementById("sessions").textContent =
data.sessions;

document.getElementById("users").textContent =
data.users;

document.getElementById("uptime").textContent =
data.uptime;


// SERVER

document.getElementById("cpu").textContent =
data.cpu;

document.getElementById("heap").textContent =
data.heap + " MB";

document.getElementById("node").textContent =
data.node;

document.getElementById("platform").textContent =
data.platform;


}

catch(error) {

document.getElementById("status").textContent =
"OFFLINE";

document.getElementById("status").className =
"text-3xl font-bold text-red-400 mt-2";

}

}


// FIRST LOAD

loadStats();


// AUTO UPDATE

setInterval(loadStats, 3000);

</script>


</body>

</html>

`);

});


// ===============================
// ERROR HANDLER
// ===============================

process.on("uncaughtException", (error) => {

    errorsCount++;

    console.error("Uncaught Exception:", error);

});


process.on("unhandledRejection", (error) => {

    errorsCount++;

    console.error("Unhandled Rejection:", error);

});


// ===============================
// START SERVER
// ===============================

app.listen(PORT, () => {

    console.log(`
╔══════════════════════════════════════╗
║          MIYORA MD ADMIN             ║
╠══════════════════════════════════════╣
║ Server : http://localhost:${PORT}
║ Admin  : http://localhost:${PORT}/admin
╚══════════════════════════════════════╝
`);

});


module.exports = app;
