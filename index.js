const express = require("express");
const os = require("os");

const app = express();
const PORT = process.env.PORT || 8000;

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

require("events").EventEmitter.defaultMaxListeners = 500;

// ============================================================
// MIYORA MD CONTROL CENTER
// Single index.js
// ============================================================

const BOT_NAME = "MIYORA MD";
const BOT_VERSION = "V1.0.0";

let botData = {
    status: "offline",
    botName: BOT_NAME,
    botNumber: "Not connected",

    groups: 0,
    users: 0,
    sessions: 0,

    speed: 0,
    errors: 0,

    lastUpdate: null
};

const history = [];

const startedAt = Date.now();


// ============================================================
// SYSTEM FUNCTIONS
// ============================================================

function getMemory() {
    const m = process.memoryUsage();

    return {
        rss: +(m.rss / 1024 / 1024).toFixed(2),
        heap: +(m.heapUsed / 1024 / 1024).toFixed(2),
        total: +(os.totalmem() / 1024 / 1024).toFixed(0)
    };
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

    if (!total) return 0;

    return +Math.min(
        100,
        Math.max(0, 100 - (idle / total) * 100)
    ).toFixed(1);
}


function getUptime() {

    let seconds = Math.floor(process.uptime());

    const days = Math.floor(seconds / 86400);
    seconds %= 86400;

    const hours = Math.floor(seconds / 3600);
    seconds %= 3600;

    const minutes = Math.floor(seconds / 60);
    seconds %= 60;

    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}


function saveHistory() {

    const memory = getMemory();

    history.push({
        time: new Date().toLocaleTimeString(),
        speed: Number(botData.speed || 0),
        ram: Number(memory.rss || 0),
        cpu: Number(getCPU() || 0),
        groups: Number(botData.groups || 0),
        users: Number(botData.users || 0)
    });

    // Keep last 30 points
    if (history.length > 30) {
        history.shift();
    }
}


// ============================================================
// HOME
// ============================================================

app.get("/", (req, res) => {

    res.json({
        status: "online",
        bot: BOT_NAME,
        version: BOT_VERSION,
        uptime: getUptime(),
        admin: "/admin",
        api: "/api/stats",
        message: `${BOT_NAME} control server is running.`
    });

});


// ============================================================
// BOT UPDATE API
// MIYORA BOT → DASHBOARD
// ============================================================

app.post("/api/bot/update", (req, res) => {

    try {

        const data = req.body || {};

        botData = {
            ...botData,

            status:
                data.status !== undefined
                    ? String(data.status)
                    : botData.status,

            botName:
                data.botName ||
                botData.botName,

            botNumber:
                data.botNumber ||
                botData.botNumber,

            groups:
                Number(data.groups ?? botData.groups),

            users:
                Number(data.users ?? botData.users),

            sessions:
                Number(data.sessions ?? botData.sessions),

            speed:
                Number(data.speed ?? botData.speed),

            errors:
                Number(data.errors ?? botData.errors),

            lastUpdate:
                new Date().toISOString()
        };

        saveHistory();

        res.json({
            success: true,
            message: "Bot data updated successfully.",
            data: botData
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to update bot data."
        });

    }

});


// ============================================================
// BOT OFFLINE API
// ============================================================

app.post("/api/bot/offline", (req, res) => {

    botData.status = "offline";
    botData.lastUpdate = new Date().toISOString();

    res.json({
        success: true,
        status: "offline"
    });

});


// ============================================================
// LIVE STATS
// ============================================================

app.get("/api/stats", (req, res) => {

    const memory = getMemory();

    res.json({

        server: {
            status: "online",
            uptime: getUptime(),

            memory: memory,

            cpu: getCPU(),

            node: process.version,
            platform: os.platform(),
            arch: os.arch()
        },

        bot: {
            ...botData
        },

        history: history

    });

});


// ============================================================
// ADMIN DASHBOARD
// ============================================================

app.get("/admin", (req, res) => {

res.send(`<!DOCTYPE html>

<html lang="en">

<head>

<meta charset="UTF-8">

<meta name="viewport"
content="width=device-width, initial-scale=1.0">

<title>${BOT_NAME} • Admin Control Center</title>


<script src="https://cdn.tailwindcss.com"></script>

<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>


<link rel="preconnect"
href="https://fonts.googleapis.com">

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
radial-gradient(
circle at 5% 0%,
rgba(124,58,237,.18),
transparent 30%
),

radial-gradient(
circle at 100% 15%,
rgba(6,182,212,.12),
transparent 28%
),

#05060b;

color:white;

}


.glass{

background:
linear-gradient(
135deg,
rgba(18,21,35,.86),
rgba(10,12,21,.72)
);

border:1px solid rgba(255,255,255,.07);

backdrop-filter:blur(20px);

-webkit-backdrop-filter:blur(20px);

}


.card{

transition:
transform .25s ease,
border .25s ease,
box-shadow .25s ease;

}


.card:hover{

transform:translateY(-4px);

border-color:
rgba(139,92,246,.35);

box-shadow:
0 20px 60px
rgba(0,0,0,.35);

}


.gradient-text{

background:
linear-gradient(
90deg,
#a78bfa,
#22d3ee
);

-webkit-background-clip:text;

color:transparent;

}


.dot{

width:8px;
height:8px;

border-radius:50%;

background:#22c55e;

box-shadow:
0 0 0 0
rgba(34,197,94,.6);

animation:pulse 2s infinite;

}


@keyframes pulse{

70%{

box-shadow:
0 0 0 8px
rgba(34,197,94,0);

}

100%{

box-shadow:
0 0 0 0
rgba(34,197,94,0);

}

}


.chart-box{

height:300px;

position:relative;

}


::-webkit-scrollbar{

width:6px;

}


::-webkit-scrollbar-thumb{

background:#292d3d;

border-radius:20px;

}


.small-label{

font-size:10px;

letter-spacing:.12em;

text-transform:uppercase;

color:#64748b;

font-weight:700;

}


</style>

</head>


<body>


<!-- ======================================================
HEADER
====================================================== -->


<header class="sticky top-0 z-50 glass border-t-0 border-x-0">

<div class="max-w-[1550px] mx-auto px-5 lg:px-8">

<div class="h-[78px] flex items-center justify-between">


<div class="flex items-center gap-3">


<div class="w-12 h-12 rounded-2xl

bg-gradient-to-br
from-violet-600
to-cyan-500

flex items-center
justify-center

shadow-lg
shadow-violet-500/20">

<i class="fa-solid fa-robot text-xl"></i>

</div>


<div>

<h1 class="font-extrabold text-lg">

${BOT_NAME}

</h1>

<p class="text-[10px]
text-slate-500
tracking-[.2em]">

ADMIN CONTROL CENTER

</p>

</div>


</div>


<div class="flex items-center gap-3">


<div class="hidden sm:flex
items-center gap-2
px-4 py-2 rounded-full

bg-emerald-500/10
border border-emerald-500/20">

<span class="dot"></span>

<span id="headerStatus"
class="text-xs
font-bold
text-emerald-400">

ONLINE

</span>

</div>


<button onclick="loadStats()"

class="w-10 h-10
rounded-xl glass
hover:bg-white/10
transition">

<i class="fa-solid fa-rotate-right
text-slate-300"></i>

</button>


</div>

</div>

</div>

</header>



<!-- ======================================================
MAIN
====================================================== -->


<main class="max-w-[1550px] mx-auto px-5 lg:px-8 py-8">


<!-- HERO -->


<section class="glass rounded-[28px]
p-6 lg:p-8 mb-6
relative overflow-hidden">


<div class="absolute
-w-20 -top-24
w-72 h-72
bg-violet-600/10
rounded-full
blur-3xl">
</div>


<div class="relative
flex flex-col
lg:flex-row
lg:items-center
justify-between gap-7">


<div>


<div class="flex items-center
gap-2 mb-4">

<span class="px-3 py-1
rounded-full

bg-violet-500/10
border border-violet-500/20

text-violet-300
text-[10px]
font-bold">

${BOT_VERSION}

</span>

<span class="text-xs
text-slate-500">

Live Bot Monitoring

</span>

</div>


<h2 class="text-3xl
lg:text-5xl
font-extrabold
tracking-tight">

${BOT_NAME}

<span class="gradient-text">

Control Center

</span>

</h2>


<p class="text-slate-400
text-sm mt-3
max-w-2xl leading-6">

Real-time monitoring for bot
connections, groups, users,
speed and server resources.

</p>

</div>


<div class="glass rounded-2xl
px-5 py-4
min-w-[220px]">


<p class="small-label">
Bot connection
</p>


<div class="flex
items-center gap-3 mt-2">


<span id="heroDot"
class="dot">
</span>


<div>

<p id="heroStatus"
class="font-bold
text-emerald-400">

ONLINE

</p>


<p id="lastSeen"
class="text-[11px]
text-slate-500">

Waiting for bot...

</p>

</div>


</div>

</div>


</div>

</section>



<!-- ======================================================
TOP STAT CARDS
====================================================== -->


<section class="grid
grid-cols-1
sm:grid-cols-2
xl:grid-cols-4
gap-5 mb-6">


<!-- BOT -->

<div class="glass card rounded-[25px] p-5">

<div class="flex
justify-between">


<div>

<p class="small-label">
Bot status
</p>


<h3 id="botStatus"
class="text-3xl
font-extrabold
mt-2
text-emerald-400">

ONLINE

</h3>


<p id="botNumber"
class="text-xs
text-slate-500 mt-2">

Not connected

</p>

</div>


<div class="w-12 h-12
rounded-2xl

bg-emerald-500/10
text-emerald-400

flex items-center
justify-center">

<i class="fa-solid fa-robot"></i>

</div>

</div>

</div>



<!-- SPEED -->

<div class="glass card rounded-[25px] p-5">

<div class="flex
justify-between">


<div>

<p class="small-label">
Bot speed
</p>


<h3 class="text-3xl
font-extrabold mt-2">

<span id="speed">
0
</span>

<span class="text-sm
text-slate-500">
ms
</span>

</h3>


<p class="text-xs
text-slate-500 mt-2">

Live API latency

</p>

</div>


<div class="w-12 h-12
rounded-2xl

bg-cyan-500/10
text-cyan-400

flex items-center
justify-center">

<i class="fa-solid fa-bolt"></i>

</div>

</div>

</div>



<!-- GROUPS -->

<div class="glass card rounded-[25px] p-5">

<div class="flex
justify-between">


<div>

<p class="small-label">
Bot groups
</p>


<h3 id="groups"
class="text-3xl
font-extrabold mt-2">

0

</h3>


<p class="text-xs
text-slate-500 mt-2">

Active groups

</p>

</div>


<div class="w-12 h-12
rounded-2xl

bg-violet-500/10
text-violet-400

flex items-center
justify-center">

<i class="fa-solid fa-users"></i>

</div>

</div>

</div>



<!-- RAM -->

<div class="glass card rounded-[25px] p-5">

<div class="flex
justify-between">


<div>

<p class="small-label">
RAM usage
</p>


<h3 class="text-3xl
font-extrabold mt-2">

<span id="ram">
0
</span>

<span class="text-sm
text-slate-500">
MB
</span>

</h3>


<p class="text-xs
text-slate-500 mt-2">

Server process

</p>

</div>


<div class="w-12 h-12
rounded-2xl

bg-amber-500/10
text-amber-400

flex items-center
justify-center">

<i class="fa-solid fa-memory"></i>

</div>

</div>

</div>


</section>



<!-- ======================================================
CHARTS
====================================================== -->


<section class="grid
grid-cols-1
xl:grid-cols-2
gap-5 mb-6">


<!-- SPEED CHART -->


<div class="glass rounded-[25px] p-6">


<div class="flex
items-center
justify-between mb-5">


<div>

<p class="small-label">
Performance
</p>

<h3 class="font-bold text-lg mt-1">

Bot Speed

</h3>

<p class="text-xs
text-slate-500 mt-1">

Live latency history

</p>

</div>


<div class="w-10 h-10
rounded-xl

bg-cyan-500/10
text-cyan-400

flex items-center
justify-center">

<i class="fa-solid fa-chart-line"></i>

</div>


</div>


<div class="chart-box">

<canvas id="speedChart"></canvas>

</div>


</div>



<!-- RESOURCE CHART -->


<div class="glass rounded-[25px] p-6">


<div class="flex
items-center
justify-between mb-5">


<div>

<p class="small-label">
Server resources
</p>

<h3 class="font-bold text-lg mt-1">

RAM & CPU

</h3>

<p class="text-xs
text-slate-500 mt-1">

Live resource usage

</p>

</div>


<div class="w-10 h-10
rounded-xl

bg-violet-500/10
text-violet-400

flex items-center
justify-center">

<i class="fa-solid fa-chart-area"></i>

</div>


</div>


<div class="chart-box">

<canvas id="resourceChart"></canvas>

</div>


</div>


</section>



<!-- ======================================================
BOT ANALYTICS
====================================================== -->


<section class="grid
grid-cols-1
xl:grid-cols-3
gap-5 mb-6">


<!-- USERS/GROUPS -->


<div class="xl:col-span-2
glass rounded-[25px] p-6">


<div class="flex
justify-between mb-6">


<div>

<p class="small-label">
Bot analytics
</p>

<h3 class="font-bold text-lg mt-1">

Users & Groups

</h3>

</div>


<div class="flex gap-5 text-xs">


<div class="flex items-center gap-2">

<span class="w-2 h-2
rounded-full bg-violet-400">
</span>

Groups

</div>


<div class="flex items-center gap-2">

<span class="w-2 h-2
rounded-full bg-cyan-400">
</span>

Users

</div>


</div>


</div>


<div class="chart-box">

<canvas id="analyticsChart"></canvas>

</div>


</div>



<!-- SYSTEM INFO -->


<div class="glass rounded-[25px] p-6">


<div class="flex items-center
gap-3 mb-5">


<div class="w-11 h-11
rounded-xl

bg-blue-500/10
text-blue-400

flex items-center
justify-center">

<i class="fa-solid fa-server"></i>

</div>


<div>

<h3 class="font-bold">
System
</h3>

<p class="text-xs
text-slate-500">

Runtime information

</p>

</div>


</div>


<div class="space-y-1">


<div class="flex justify-between
py-4
border-b border-white/[.05]">

<span class="text-xs
text-slate-500">

CPU

</span>

<span id="cpu"
class="text-sm font-bold">

0%

</span>

</div>


<div class="flex justify-between
py-4
border-b border-white/[.05]">

<span class="text-xs
text-slate-500">

Uptime

</span>

<span id="uptime"
class="text-sm font-bold">

--

</span>

</div>


<div class="flex justify-between
py-4
border-b border-white/[.05]">

<span class="text-xs
text-slate-500">

Node.js

</span>

<span id="node"
class="text-sm font-bold">

--

</span>

</div>


<div class="flex justify-between
py-4
border-b border-white/[.05]">

<span class="text-xs
text-slate-500">

Platform

</span>

<span id="platform"
class="text-sm font-bold">

--

</span>

</div>


<div class="flex justify-between
py-4">

<span class="text-xs
text-slate-500">

Architecture

</span>

<span id="arch"
class="text-sm font-bold">

--

</span>

</div>


</div>

</div>


</section>



<!-- ======================================================
BOTTOM
====================================================== -->


<section class="grid
grid-cols-1
md:grid-cols-3
gap-5">


<div class="glass rounded-[25px]
p-5">


<p class="small-label">
Sessions
</p>


<h3 id="sessions"
class="text-3xl font-extrabold mt-2">

0

</h3>


<p class="text-xs text-slate-500 mt-2">

Active bot sessions

</p>

</div>



<div class="glass rounded-[25px]
p-5">


<p class="small-label">
Users
</p>


<h3 id="users"
class="text-3xl font-extrabold mt-2">

0

</h3>


<p class="text-xs text-slate-500 mt-2">

Total bot users

</p>

</div>



<div class="glass rounded-[25px]
p-5">


<p class="small-label">
Errors
</p>


<h3 id="errors"
class="text-3xl
font-extrabold
mt-2
text-red-400">

0

</h3>


<p class="text-xs text-slate-500 mt-2">

Reported system errors

</p>

</div>


</section>



<footer class="text-center
py-8">

<p class="text-[11px]
text-slate-600">

${BOT_NAME} • Admin Control Center

</p>

</footer>


</main>



<script>

// ============================================================
// CHART CONFIG
// ============================================================

Chart.defaults.color = "#64748b";

Chart.defaults.font.family =
"Inter, sans-serif";


const chartOptions = {

responsive:true,

maintainAspectRatio:false,

interaction:{
mode:"index",
intersect:false
},

plugins:{

legend:{
display:false
}

},

scales:{

x:{
grid:{
color:"rgba(255,255,255,.04)"
},
ticks:{
color:"#64748b",
maxTicksLimit:8
}
},

y:{
beginAtZero:true,

grid:{
color:"rgba(255,255,255,.04)"
},

ticks:{
color:"#64748b"
}

}

}

};


// ============================================================
// SPEED CHART
// ============================================================

const speedChart = new Chart(

document.getElementById("speedChart"),

{

type:"line",

data:{

labels:[],

datasets:[{

label:"Speed",

data:[],

borderColor:"#22d3ee",

backgroundColor:
"rgba(34,211,238,.10)",

fill:true,

tension:.4,

pointRadius:2,

pointHoverRadius:5

}]

},

options:chartOptions

});


// ============================================================
// RESOURCE CHART
// ============================================================

const resourceChart = new Chart(

document.getElementById("resourceChart"),

{

type:"line",

data:{

labels:[],

datasets:[

{

label:"RAM",

data:[],

borderColor:"#a78bfa",

backgroundColor:
"rgba(167,139,250,.08)",

fill:true,

tension:.4,

pointRadius:2

},

{

label:"CPU",

data:[],

borderColor:"#f59e0b",

backgroundColor:
"rgba(245,158,11,.06)",

fill:true,

tension:.4,

pointRadius:2

}

]

},

options:chartOptions

});


// ============================================================
// ANALYTICS CHART
// ============================================================

const analyticsChart = new Chart(

document.getElementById("analyticsChart"),

{

type:"line",

data:{

labels:[],

datasets:[

{

label:"Groups",

data:[],

borderColor:"#a78bfa",

backgroundColor:
"rgba(167,139,250,.06)",

fill:true,

tension:.4,

pointRadius:2

},

{

label:"Users",

data:[],

borderColor:"#22d3ee",

backgroundColor:
"rgba(34,211,238,.06)",

fill:true,

tension:.4,

pointRadius:2

}

]

},

options:chartOptions

});


// ============================================================
// UPDATE CHARTS
// ============================================================

function updateCharts(data){

const history =
data.history || [];

const labels =
history.map(x => x.time);


// SPEED

speedChart.data.labels =
labels;

speedChart.data.datasets[0].data =
history.map(x => x.speed);

speedChart.update("none");


// RESOURCES

resourceChart.data.labels =
labels;

resourceChart.data.datasets[0].data =
history.map(x => x.ram);

resourceChart.data.datasets[1].data =
history.map(x => x.cpu);

resourceChart.update("none");


// ANALYTICS

analyticsChart.data.labels =
labels;

analyticsChart.data.datasets[0].data =
history.map(x => x.groups);

analyticsChart.data.datasets[1].data =
history.map(x => x.users);

analyticsChart.update("none");

}


// ============================================================
// LOAD DATA
// ============================================================

async function loadStats(){

try{

const response =
await fetch(
"/api/stats",
{
cache:"no-store"
}
);


const data =
await response.json();


const bot =
data.bot;

const server =
data.server;


// STATUS

const online =
String(bot.status).toLowerCase()
=== "online";


document.getElementById("botStatus")
.textContent =
online
? "ONLINE"
: "OFFLINE";


document.getElementById("botStatus")
.className =
" text-3xl font-extrabold mt-2 "
+
(
online
? "text-emerald-400"
: "text-red-400"
);


document.getElementById("headerStatus")
.textContent =
online
? "ONLINE"
: "OFFLINE";


document.getElementById("heroStatus")
.textContent =
online
? "ONLINE"
: "OFFLINE";


document.getElementById("heroStatus")
.className =
"font-bold "
+
(
online
? "text-emerald-400"
: "text-red-400"
);


document.getElementById("botNumber")
.textContent =
bot.botNumber ||
"Not connected";


// SPEED

document.getElementById("speed")
.textContent =
bot.speed || 0;


// GROUPS

document.getElementById("groups")
.textContent =
Number(bot.groups || 0)
.toLocaleString();


// USERS

document.getElementById("users")
.textContent =
Number(bot.users || 0)
.toLocaleString();


// SESSIONS

document.getElementById("sessions")
.textContent =
Number(bot.sessions || 0)
.toLocaleString();


// ERRORS

document.getElementById("errors")
.textContent =
Number(bot.errors || 0)
.toLocaleString();


// RAM

document.getElementById("ram")
.textContent =
server.memory.rss;


// CPU

document.getElementById("cpu")
.textContent =
server.cpu + "%";


// UPTIME

document.getElementById("uptime")
.textContent =
server.uptime;


// SERVER

document.getElementById("node")
.textContent =
server.node;

document.getElementById("platform")
.textContent =
server.platform;

document.getElementById("arch")
.textContent =
server.arch;


// LAST UPDATE

if(bot.lastUpdate){

const date =
new Date(bot.lastUpdate);

document.getElementById("lastSeen")
.textContent =
"Last update " +
date.toLocaleTimeString();

}


// CHARTS

updateCharts(data);


}

catch(error){

console.error(
"Dashboard error:",
error
);

document.getElementById("botStatus")
.textContent =
"OFFLINE";

}

}


// ============================================================
// START
// ============================================================

loadStats();

setInterval(
loadStats,
3000
);

</script>


</body>

</html>`);

});


// ============================================================
// ERROR MONITOR
// ============================================================

process.on(
"uncaughtException",
error => {

    errorCount++;

    console.error(
        "[UNCAUGHT]",
        error
    );

});


process.on(
"unhandledRejection",
error => {

    errorCount++;

    console.error(
        "[REJECTION]",
        error
    );

});


// ============================================================
// START SERVER
// ============================================================

app.listen(
PORT,
() => {

    console.log("");
    console.log(
        "========================================"
    );

    console.log(
        "       MIYORA MD CONTROL CENTER"
    );

    console.log(
        "========================================"
    );

    console.log(
        "Server : http://localhost:" + PORT
    );

    console.log(
        "Admin  : http://localhost:" + PORT + "/admin"
    );

    console.log(
        "API    : http://localhost:" + PORT + "/api/stats"
    );

    console.log(
        "========================================"
    );

    console.log("");

});


module.exports = app;
