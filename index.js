const express = require("express");
const os = require("os");

const app = express();
const PORT = process.env.PORT || 8000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

require("events").EventEmitter.defaultMaxListeners = 500;

// ======================================================
// MIYORA MD - SINGLE FILE ADMIN DASHBOARD
// ======================================================

const BOT_NAME = "MIYORA MD";
const BOT_VERSION = "V1.0.0";

let errorCount = 0;
const startedAt = Date.now();


// ======================================================
// SYSTEM DATA
// ======================================================

function getMemory() {
    const m = process.memoryUsage();

    return {
        rss: (m.rss / 1024 / 1024).toFixed(1),
        heap: (m.heapUsed / 1024 / 1024).toFixed(1),
        total: (os.totalmem() / 1024 / 1024).toFixed(0)
    };
}


function getUptime() {
    let s = Math.floor(process.uptime());

    const d = Math.floor(s / 86400);
    s %= 86400;

    const h = Math.floor(s / 3600);
    s %= 3600;

    const m = Math.floor(s / 60);
    const sec = s % 60;

    return `${d}d ${h}h ${m}m ${sec}s`;
}


function getCPU() {
    const cpus = os.cpus();

    let idle = 0;
    let total = 0;

    for (const cpu of cpus) {
        idle += cpu.times.idle;

        total +=
            cpu.times.user +
            cpu.times.nice +
            cpu.times.sys +
            cpu.times.idle +
            cpu.times.irq;
    }

    if (!total) return "0.0";

    return Math.min(
        100,
        Math.max(0, 100 - (idle / total) * 100)
    ).toFixed(1);
}


// ======================================================
// HOME
// ======================================================

app.get("/", (req, res) => {

    res.json({
        status: "online",
        bot: BOT_NAME,
        version: BOT_VERSION,
        uptime: getUptime(),
        message: `${BOT_NAME} is running successfully.`
    });

});


// ======================================================
// LIVE API
// ======================================================

app.get("/api/stats", (req, res) => {

    const memory = getMemory();

    const start = Date.now();

    res.json({
        status: "online",

        botName: BOT_NAME,
        version: BOT_VERSION,

        sessions: 1,
        groups: 0,
        users: 0,

        speed: Date.now() - start,

        ram: memory.rss,
        heap: memory.heap,
        totalRam: memory.total,

        cpu: getCPU(),

        uptime: getUptime(),

        node: process.version,
        platform: os.platform(),
        arch: os.arch(),

        errors: errorCount,

        time: new Date().toISOString()
    });

});


// ======================================================
// ADMIN DASHBOARD
// ======================================================

app.get("/admin", (req, res) => {

res.send(`<!DOCTYPE html>

<html lang="en">

<head>

<meta charset="UTF-8">

<meta name="viewport"
content="width=device-width, initial-scale=1.0">

<title>${BOT_NAME} • Control Center</title>

<script src="https://cdn.tailwindcss.com"></script>

<link rel="preconnect" href="https://fonts.googleapis.com">

<link rel="preconnect"
href="https://fonts.gstatic.com"
crossorigin>

<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
rel="stylesheet">

<link rel="stylesheet"
href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.6.0/css/all.min.css">


<style>

*{
box-sizing:border-box;
}

body{
font-family:Inter,sans-serif;
background:
radial-gradient(circle at 10% 10%,rgba(139,92,246,.16),transparent 30%),
radial-gradient(circle at 90% 20%,rgba(6,182,212,.12),transparent 28%),
#05070d;
color:#fff;
}

.glass{
background:rgba(15,18,30,.72);
border:1px solid rgba(255,255,255,.07);
backdrop-filter:blur(18px);
-webkit-backdrop-filter:blur(18px);
}

.card{
transition:.25s ease;
}

.card:hover{
transform:translateY(-3px);
border-color:rgba(139,92,246,.3);
box-shadow:0 15px 45px rgba(0,0,0,.28);
}

.gradient-text{
background:linear-gradient(90deg,#a78bfa,#22d3ee);
-webkit-background-clip:text;
color:transparent;
}

.glow{
box-shadow:0 0 30px rgba(139,92,246,.18);
}

.pulse{
animation:pulse 2s infinite;
}

@keyframes pulse{

0%,100%{
box-shadow:0 0 0 0 rgba(34,197,94,.35);
}

50%{
box-shadow:0 0 0 8px rgba(34,197,94,0);
}

}

.progress{
height:7px;
background:#1b2030;
border-radius:20px;
overflow:hidden;
}

.progress-bar{
height:100%;
border-radius:20px;
background:linear-gradient(90deg,#8b5cf6,#22d3ee);
transition:.5s;
}

.fade{
animation:fade .5s ease;
}

@keyframes fade{

from{
opacity:0;
transform:translateY(8px);
}

to{
opacity:1;
transform:translateY(0);
}

}

::-webkit-scrollbar{
width:5px;
}

::-webkit-scrollbar-thumb{
background:#292d3e;
border-radius:10px;
}

</style>

</head>


<body>


<!-- TOP NAV -->

<header class="sticky top-0 z-50 glass border-x-0 border-t-0">

<div class="max-w-[1500px] mx-auto px-5 lg:px-8 h-[76px] flex items-center justify-between">


<div class="flex items-center gap-3">

<div class="w-11 h-11 rounded-2xl flex items-center justify-center
bg-gradient-to-br from-violet-600 to-cyan-500 shadow-lg shadow-violet-500/20">

<i class="fa-solid fa-robot text-lg"></i>

</div>

<div>

<h1 class="font-bold text-lg">
${BOT_NAME}
</h1>

<p class="text-[11px] text-slate-500 tracking-widest">
CONTROL CENTER
</p>

</div>

</div>


<div class="flex items-center gap-3">

<div class="hidden sm:flex items-center gap-2 px-3 py-2 rounded-full
bg-emerald-500/10 border border-emerald-500/20">

<span class="w-2 h-2 bg-emerald-400 rounded-full pulse"></span>

<span class="text-xs text-emerald-400 font-semibold">
SYSTEM ONLINE
</span>

</div>


<button onclick="loadStats()"
class="w-10 h-10 rounded-xl glass hover:bg-white/10 transition">

<i class="fa-solid fa-rotate-right text-slate-300"></i>

</button>

</div>

</div>

</header>



<!-- MAIN -->

<main class="max-w-[1500px] mx-auto px-5 lg:px-8 py-8">


<!-- HERO -->

<section class="glass rounded-3xl p-6 lg:p-8 mb-7 overflow-hidden relative glow">

<div class="absolute -right-20 -top-20 w-64 h-64
bg-violet-600/10 rounded-full blur-3xl"></div>

<div class="absolute right-20 bottom-0 w-40 h-40
bg-cyan-500/10 rounded-full blur-3xl"></div>


<div class="relative flex flex-col lg:flex-row
lg:items-center justify-between gap-6">


<div>

<div class="flex items-center gap-2 mb-3">

<span class="px-2.5 py-1 rounded-full text-[10px]
font-bold bg-violet-500/10 text-violet-300
border border-violet-500/20">

${BOT_VERSION}

</span>

<span class="text-xs text-slate-500">
Bot Management System
</span>

</div>


<h2 class="text-3xl lg:text-5xl font-extrabold tracking-tight">

Welcome to

<span class="gradient-text">
${BOT_NAME}
</span>

</h2>


<p class="text-slate-400 mt-3 max-w-xl text-sm leading-6">

Monitor your bot performance, server resources,
sessions and system health from one beautiful
control center.

</p>

</div>


<div class="flex items-center gap-3">

<div class="w-12 h-12 rounded-2xl bg-emerald-500/10
border border-emerald-500/20 flex items-center justify-center">

<i class="fa-solid fa-signal text-emerald-400"></i>

</div>

<div>

<p class="text-xs text-slate-500">
CURRENT STATUS
</p>

<p class="text-emerald-400 font-bold">
Operational
</p>

</div>

</div>


</div>

</section>



<!-- STATS -->

<section class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-7">


<!-- BOT -->

<div class="glass card rounded-3xl p-5">

<div class="flex justify-between items-start">

<div>

<p class="text-xs text-slate-500 font-medium">
BOT STATUS
</p>

<h3 id="botStatus"
class="text-2xl font-extrabold mt-2 text-emerald-400">

ONLINE

</h3>

<p class="text-xs text-slate-500 mt-2">
${BOT_NAME} is running
</p>

</div>


<div class="w-12 h-12 rounded-2xl
bg-emerald-500/10 text-emerald-400
flex items-center justify-center">

<i class="fa-solid fa-robot text-lg"></i>

</div>

</div>

<div class="mt-5 flex items-center gap-2 text-xs text-emerald-400">

<span class="w-2 h-2 rounded-full bg-emerald-400"></span>

Connected & Stable

</div>

</div>



<!-- SPEED -->

<div class="glass card rounded-3xl p-5">

<div class="flex justify-between items-start">

<div>

<p class="text-xs text-slate-500 font-medium">
BOT SPEED
</p>

<h3 class="text-2xl font-extrabold mt-2">

<span id="speed">--</span>

<span class="text-sm text-slate-500">
ms
</span>

</h3>

<p class="text-xs text-slate-500 mt-2">
API response latency
</p>

</div>


<div class="w-12 h-12 rounded-2xl
bg-cyan-500/10 text-cyan-400
flex items-center justify-center">

<i class="fa-solid fa-bolt text-lg"></i>

</div>

</div>

<div class="mt-5 progress">

<div id="speedBar"
class="progress-bar"
style="width:92%">
</div>

</div>

</div>



<!-- RAM -->

<div class="glass card rounded-3xl p-5">

<div class="flex justify-between items-start">

<div>

<p class="text-xs text-slate-500 font-medium">
RAM USAGE
</p>

<h3 class="text-2xl font-extrabold mt-2">

<span id="ram">--</span>

<span class="text-sm text-slate-500">
MB
</span>

</h3>

<p class="text-xs text-slate-500 mt-2">
Process memory usage
</p>

</div>


<div class="w-12 h-12 rounded-2xl
bg-amber-500/10 text-amber-400
flex items-center justify-center">

<i class="fa-solid fa-memory text-lg"></i>

</div>

</div>

<div class="mt-5 progress">

<div id="ramBar"
class="progress-bar"
style="width:18%">
</div>

</div>

</div>



<!-- CPU -->

<div class="glass card rounded-3xl p-5">

<div class="flex justify-between items-start">

<div>

<p class="text-xs text-slate-500 font-medium">
CPU USAGE
</p>

<h3 class="text-2xl font-extrabold mt-2">

<span id="cpu">--</span>

<span class="text-sm text-slate-500">
%
</span>

</h3>

<p class="text-xs text-slate-500 mt-2">
Server processor load
</p>

</div>


<div class="w-12 h-12 rounded-2xl
bg-fuchsia-500/10 text-fuchsia-400
flex items-center justify-center">

<i class="fa-solid fa-microchip text-lg"></i>

</div>

</div>

<div class="mt-5 progress">

<div id="cpuBar"
class="progress-bar"
style="width:10%">
</div>

</div>

</div>


</section>



<!-- SECOND ROW -->

<section class="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-7">


<!-- BOT DETAILS -->

<div class="lg:col-span-2 glass rounded-3xl p-6">


<div class="flex justify-between items-center mb-6">

<div>

<h3 class="font-bold text-lg">
Bot Overview
</h3>

<p class="text-xs text-slate-500 mt-1">
Live information from your server
</p>

</div>

<div class="text-xs text-slate-500">
LIVE
</div>

</div>


<div class="grid grid-cols-2 md:grid-cols-4 gap-4">


<div class="bg-white/[.025] border border-white/[.05]
rounded-2xl p-4">

<div class="text-violet-400 mb-3">
<i class="fa-solid fa-users"></i>
</div>

<p class="text-2xl font-bold" id="sessions">
0
</p>

<p class="text-xs text-slate-500 mt-1">
Sessions
</p>

</div>


<div class="bg-white/[.025] border border-white/[.05]
rounded-2xl p-4">

<div class="text-cyan-400 mb-3">
<i class="fa-solid fa-layer-group"></i>
</div>

<p class="text-2xl font-bold" id="groups">
0
</p>

<p class="text-xs text-slate-500 mt-1">
Groups
</p>

</div>


<div class="bg-white/[.025] border border-white/[.05]
rounded-2xl p-4">

<div class="text-pink-400 mb-3">
<i class="fa-solid fa-user-group"></i>
</div>

<p class="text-2xl font-bold" id="users">
0
</p>

<p class="text-xs text-slate-500 mt-1">
Users
</p>

</div>


<div class="bg-white/[.025] border border-white/[.05]
rounded-2xl p-4">

<div class="text-amber-400 mb-3">
<i class="fa-solid fa-triangle-exclamation"></i>
</div>

<p class="text-2xl font-bold" id="errors">
0
</p>

<p class="text-xs text-slate-500 mt-1">
Errors
</p>

</div>


</div>

</div>



<!-- UPTIME -->

<div class="glass rounded-3xl p-6">

<div class="w-12 h-12 rounded-2xl
bg-violet-500/10 text-violet-400
flex items-center justify-center mb-5">

<i class="fa-solid fa-clock"></i>

</div>

<p class="text-xs text-slate-500">
SERVER UPTIME
</p>

<h3 id="uptime"
class="text-2xl font-bold mt-2">

--

</h3>

<div class="mt-5 flex items-center gap-2 text-xs text-emerald-400">

<i class="fa-solid fa-circle-check"></i>

System running normally

</div>

</div>


</section>



<!-- SYSTEM -->

<section class="grid grid-cols-1 lg:grid-cols-2 gap-5">


<!-- SERVER -->

<div class="glass rounded-3xl p-6">

<div class="flex items-center gap-3 mb-6">

<div class="w-11 h-11 rounded-2xl
bg-blue-500/10 text-blue-400
flex items-center justify-center">

<i class="fa-solid fa-server"></i>

</div>

<div>

<h3 class="font-bold">
Server Information
</h3>

<p class="text-xs text-slate-500">
Environment details
</p>

</div>

</div>


<div class="space-y-1">


<div class="flex justify-between items-center
py-4 border-b border-white/[.05]">

<span class="text-sm text-slate-400">
Node.js
</span>

<span id="node"
class="text-sm font-semibold">
--
</span>

</div>


<div class="flex justify-between items-center
py-4 border-b border-white/[.05]">

<span class="text-sm text-slate-400">
Platform
</span>

<span id="platform"
class="text-sm font-semibold">
--
</span>

</div>


<div class="flex justify-between items-center
py-4 border-b border-white/[.05]">

<span class="text-sm text-slate-400">
Architecture
</span>

<span id="arch"
class="text-sm font-semibold">
--
</span>

</div>


<div class="flex justify-between items-center
py-4">

<span class="text-sm text-slate-400">
Total RAM
</span>

<span id="totalRam"
class="text-sm font-semibold">
--
</span>

</div>


</div>

</div>



<!-- ACTIVITY -->

<div class="glass rounded-3xl p-6">

<div class="flex items-center justify-between mb-6">

<div class="flex items-center gap-3">

<div class="w-11 h-11 rounded-2xl
bg-cyan-500/10 text-cyan-400
flex items-center justify-center">

<i class="fa-solid fa-wave-square"></i>

</div>

<div>

<h3 class="font-bold">
System Activity
</h3>

<p class="text-xs text-slate-500">
Live monitoring
</p>

</div>

</div>

<span class="text-[10px] px-2 py-1 rounded-full
bg-emerald-500/10 text-emerald-400">
LIVE
</span>

</div>


<div class="space-y-4">


<div class="flex gap-3">

<div class="w-8 h-8 rounded-xl
bg-emerald-500/10 text-emerald-400
flex items-center justify-center text-xs">

<i class="fa-solid fa-check"></i>

</div>

<div>

<p class="text-sm font-medium">
Bot system online
</p>

<p class="text-xs text-slate-500">
System is responding normally
</p>

</div>

</div>


<div class="flex gap-3">

<div class="w-8 h-8 rounded-xl
bg-violet-500/10 text-violet-400
flex items-center justify-center text-xs">

<i class="fa-solid fa-chart-line"></i>

</div>

<div>

<p class="text-sm font-medium">
Monitoring active
</p>

<p class="text-xs text-slate-500">
Statistics update automatically
</p>

</div>

</div>


<div class="flex gap-3">

<div class="w-8 h-8 rounded-xl
bg-cyan-500/10 text-cyan-400
flex items-center justify-center text-xs">

<i class="fa-solid fa-cloud"></i>

</div>

<div>

<p class="text-sm font-medium">
Server connected
</p>

<p id="lastUpdate"
class="text-xs text-slate-500">
Waiting for update...
</p>

</div>

</div>


</div>

</div>


</section>


<footer class="text-center py-8">

<p class="text-xs text-slate-600">

${BOT_NAME} • Control Center

</p>

</footer>


</main>



<script>

async function loadStats(){

try{

const requestStart = performance.now();

const response = await fetch("/api/stats",{
cache:"no-store"
});

const data = await response.json();

const latency =
Math.round(performance.now()-requestStart);


// STATUS

document.getElementById("botStatus")
.textContent =
data.status.toUpperCase();


// SPEED

document.getElementById("speed")
.textContent =
latency;

document.getElementById("speedBar")
.style.width =
Math.max(20,Math.min(100,100-latency))
+"%";


// RAM

document.getElementById("ram")
.textContent =
data.ram;

const ramPercent =
Math.min(
100,
(Number(data.ram)/Number(data.totalRam))*100
);

document.getElementById("ramBar")
.style.width =
Math.max(3,ramPercent)+"%";


// CPU

document.getElementById("cpu")
.textContent =
data.cpu;

document.getElementById("cpuBar")
.style.width =
Math.min(100,Number(data.cpu))+"%";


// COUNTERS

document.getElementById("sessions")
.textContent =
data.sessions;

document.getElementById("groups")
.textContent =
data.groups;

document.getElementById("users")
.textContent =
data.users;

document.getElementById("errors")
.textContent =
data.errors;


// UPTIME

document.getElementById("uptime")
.textContent =
data.uptime;


// SERVER

document.getElementById("node")
.textContent =
data.node;

document.getElementById("platform")
.textContent =
data.platform;

document.getElementById("arch")
.textContent =
data.arch;

document.getElementById("totalRam")
.textContent =
data.totalRam+" MB";


// UPDATE TIME

document.getElementById("lastUpdate")
textContent =
"Updated just now";

document.getElementById("lastUpdate")
.textContent =
"Updated just now";


}

catch(error){

document.getElementById("botStatus")
.textContent =
"OFFLINE";

document.getElementById("botStatus")
.className =
"text-2xl font-extrabold mt-2 text-red-400";

console.error(error);

}

}


// INITIAL

loadStats();


// LIVE UPDATE

setInterval(loadStats,3000);

</script>


</body>

</html>`);

});


// ======================================================
// ERROR MONITOR
// ======================================================

process.on("uncaughtException", error => {

    errorCount++;

    console.error("UNCAUGHT:", error);

});


process.on("unhandledRejection", error => {

    errorCount++;

    console.error("REJECTION:", error);

});


// ======================================================
// START
// ======================================================

app.listen(PORT, () => {

    console.log("");
    console.log("======================================");
    console.log("        MIYORA MD CONTROL CENTER");
    console.log("======================================");
    console.log(`Server : http://localhost:${PORT}`);
    console.log(`Admin  : http://localhost:${PORT}/admin`);
    console.log("======================================");
    console.log("");

});


module.exports = app;
