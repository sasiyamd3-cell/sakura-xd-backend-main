const express = require('express');
const app = express();

const path = require('path');
const os = require('os');
const bodyParser = require('body-parser');

const PORT = process.env.PORT || 8000;

const code = require('./sakura');

require('events').EventEmitter.defaultMaxListeners = 500;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/code', code);

app.set('json spaces', 2);

/* =========================================================
   DASHBOARD STATE
========================================================= */

const serverStartedAt = Date.now();

let history = [];

let lastStats = {
    status: 'online',
    botName: 'Bot',
    sessionsOnline: 0,
    numbers: [],
    groups: 0,
    users: 0,
    speed: 0,
    memory: 0,
    cpu: 0,
    uptime: 0
};

const MAX_HISTORY = 60;


/* =========================================================
   HELPERS
========================================================= */

function safeNumber(value, fallback = 0) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
}

function formatUptime(seconds) {
    seconds = Math.floor(seconds);

    const days = Math.floor(seconds / 86400);
    seconds %= 86400;

    const hours = Math.floor(seconds / 3600);
    seconds %= 3600;

    const minutes = Math.floor(seconds / 60);
    seconds %= 60;

    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

function getMemoryMB() {
    return Number((process.memoryUsage().rss / 1024 / 1024).toFixed(2));
}

function getCPUUsage() {
    const load = os.loadavg ? os.loadavg()[0] : 0;
    const cpuCount = os.cpus().length || 1;

    return Number(Math.min((load / cpuCount) * 100, 100).toFixed(2));
}


/* =========================================================
   GET BOT INFO
========================================================= */

function collectBotInfo() {

    let info = {};

    try {
        if (typeof code.getActiveInfo === 'function') {
            const result = code.getActiveInfo();

            if (result && typeof result === 'object') {
                info = result;
            }
        }
    } catch (error) {
        console.error('[Dashboard] getActiveInfo error:', error.message);
    }

    /*
       Supports multiple possible names from your bot.
    */

    const botName =
        info.botName ||
        info.name ||
        info.BOT_NAME ||
        'Bot';

    const sessionsOnline = safeNumber(
        info.sessionsOnline ??
        info.sessions_online ??
        info.sessions ??
        0
    );

    const numbers =
        Array.isArray(info.numbers)
            ? info.numbers
            : Array.isArray(info.connectedNumbers)
                ? info.connectedNumbers
                : [];

    const groups = safeNumber(
        info.groups ??
        info.groupCount ??
        info.groupsCount ??
        0
    );

    const users = safeNumber(
        info.users ??
        info.userCount ??
        info.usersCount ??
        0
    );

    const uptimeSeconds =
        process.uptime();

    const memory = getMemoryMB();

    const cpu = getCPUUsage();

    return {
        status: 'online',

        botName,

        sessionsOnline,

        numbers,

        groups,

        users,

        speed: 0,

        memory,

        cpu,

        uptime: uptimeSeconds,

        uptimeFormatted: formatUptime(uptimeSeconds),

        timestamp: new Date().toISOString()
    };
}


/* =========================================================
   STATS API
========================================================= */

app.get('/api/stats', (req, res) => {

    const start = Date.now();

    const info = collectBotInfo();

    const responseTime = Date.now() - start;

    const stats = {
        ...info,
        speed: responseTime
    };

    lastStats = stats;

    res.status(200).json(stats);
});


/* =========================================================
   HISTORY API
========================================================= */

app.get('/api/history', (req, res) => {

    res.status(200).json({
        status: 'success',
        data: history
    });

});


/* =========================================================
   CREATE HISTORY DATA
========================================================= */

function updateHistory() {

    const info = collectBotInfo();

    const point = {
        time: new Date().toISOString(),

        sessions: safeNumber(info.sessionsOnline),

        groups: safeNumber(info.groups),

        users: safeNumber(info.users),

        memory: safeNumber(info.memory),

        cpu: safeNumber(info.cpu),

        speed: safeNumber(info.speed)
    };

    history.push(point);

    if (history.length > MAX_HISTORY) {
        history.shift();
    }

    lastStats = {
        ...info,
        speed: point.speed
    };
}


/*
   Update every 5 seconds
*/

setInterval(updateHistory, 5000);

updateHistory();


/* =========================================================
   ROOT STATUS
========================================================= */

app.get('/', (req, res) => {

    const info = collectBotInfo();

    res.status(200).json({
        status: 'online',

        name: info.botName,

        about: `${info.botName} is up and running.`,

        sessions_online: info.sessionsOnline,

        groups: info.groups,

        users: info.users,

        memory: info.memory,

        uptime: info.uptimeFormatted,

        server_time: info.timestamp,

        admin: '/admin'
    });

});


/* =========================================================
   ADMIN DASHBOARD
========================================================= */

app.get('/admin', (req, res) => {

    res.send(`<!DOCTYPE html>

<html lang="en">

<head>

<meta charset="UTF-8">

<meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
>

<title>Bot Admin Panel</title>

<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

<style>

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

:root {

    --bg: #08090d;
    --panel: #101218;
    --panel2: #141720;

    --border: rgba(255,255,255,.07);

    --text: #f5f7fb;
    --muted: #8c93a3;

    --purple: #8b5cf6;
    --purple2: #a78bfa;

    --green: #22c55e;
    --red: #ef4444;
    --blue: #3b82f6;
    --yellow: #f59e0b;

}

body {

    background:
        radial-gradient(
            circle at top right,
            rgba(139,92,246,.12),
            transparent 35%
        ),
        radial-gradient(
            circle at bottom left,
            rgba(59,130,246,.08),
            transparent 30%
        ),
        var(--bg);

    color: var(--text);

    font-family:
        Inter,
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        sans-serif;

    min-height: 100vh;

}


/* =========================================================
   SIDEBAR
========================================================= */

.sidebar {

    position: fixed;

    left: 0;
    top: 0;

    width: 250px;

    height: 100vh;

    background:
        rgba(10,11,16,.92);

    border-right: 1px solid var(--border);

    backdrop-filter: blur(20px);

    padding: 24px 16px;

    z-index: 100;

}

.logo {

    display: flex;

    align-items: center;

    gap: 12px;

    margin-bottom: 35px;

    padding: 0 8px;

}

.logo-icon {

    width: 42px;
    height: 42px;

    display: flex;

    align-items: center;
    justify-content: center;

    border-radius: 13px;

    background:
        linear-gradient(
            135deg,
            var(--purple),
            #4f46e5
        );

    box-shadow:
        0 10px 30px
        rgba(139,92,246,.3);

    font-size: 20px;

}

.logo-text {

    font-size: 17px;

    font-weight: 800;

    letter-spacing: .3px;

}

.logo-sub {

    color: var(--muted);

    font-size: 10px;

    margin-top: 2px;

}

.nav-title {

    color: #555b69;

    font-size: 10px;

    text-transform: uppercase;

    letter-spacing: 1.5px;

    padding: 0 12px;

    margin-bottom: 9px;

}

.nav-item {

    display: flex;

    align-items: center;

    gap: 12px;

    padding: 12px;

    margin-bottom: 5px;

    border-radius: 10px;

    color: var(--muted);

    cursor: pointer;

    transition: .2s;

    font-size: 13px;

}

.nav-item:hover,
.nav-item.active {

    background:
        rgba(139,92,246,.12);

    color: white;

}

.nav-item.active {

    box-shadow:
        inset 3px 0 0 var(--purple);

}

.nav-icon {

    width: 20px;

    text-align: center;

}


/* =========================================================
   MAIN
========================================================= */

.main {

    margin-left: 250px;

    min-height: 100vh;

    padding: 28px;

}

.topbar {

    display: flex;

    justify-content: space-between;

    align-items: center;

    margin-bottom: 28px;

}

.page-title {

    font-size: 26px;

    font-weight: 800;

}

.page-sub {

    color: var(--muted);

    font-size: 13px;

    margin-top: 5px;

}

.live {

    display: flex;

    align-items: center;

    gap: 8px;

    padding: 9px 14px;

    border-radius: 999px;

    background:
        rgba(34,197,94,.08);

    border:
        1px solid
        rgba(34,197,94,.18);

    color: #4ade80;

    font-size: 12px;

}

.dot {

    width: 7px;
    height: 7px;

    border-radius: 50%;

    background: var(--green);

    box-shadow:
        0 0 10px
        var(--green);

}


/* =========================================================
   CARDS
========================================================= */

.stats-grid {

    display: grid;

    grid-template-columns:
        repeat(4, 1fr);

    gap: 16px;

    margin-bottom: 18px;

}

.card {

    background:
        linear-gradient(
            145deg,
            rgba(255,255,255,.035),
            rgba(255,255,255,.015)
        );

    border:
        1px solid var(--border);

    border-radius: 16px;

    padding: 19px;

    backdrop-filter: blur(15px);

    box-shadow:
        0 15px 50px
        rgba(0,0,0,.12);

}

.stat-card {

    position: relative;

    overflow: hidden;

}

.stat-card::after {

    content: "";

    position: absolute;

    width: 90px;
    height: 90px;

    right: -25px;
    top: -25px;

    border-radius: 50%;

    background:
        rgba(139,92,246,.08);

}

.stat-top {

    display: flex;

    justify-content: space-between;

    align-items: center;

    margin-bottom: 15px;

}

.stat-icon {

    width: 38px;
    height: 38px;

    display: flex;

    align-items: center;
    justify-content: center;

    border-radius: 11px;

    background:
        rgba(139,92,246,.12);

    color: var(--purple2);

}

.stat-label {

    color: var(--muted);

    font-size: 12px;

}

.stat-value {

    font-size: 25px;

    font-weight: 800;

    letter-spacing: -.5px;

}

.stat-small {

    color: #687080;

    font-size: 11px;

    margin-top: 5px;

}


/* =========================================================
   CHART GRID
========================================================= */

.chart-grid {

    display: grid;

    grid-template-columns:
        1.5fr 1fr;

    gap: 18px;

    margin-bottom: 18px;

}

.chart-card {

    min-height: 330px;

}

.card-head {

    display: flex;

    justify-content: space-between;

    align-items: flex-start;

    margin-bottom: 20px;

}

.card-title {

    font-size: 14px;

    font-weight: 700;

}

.card-desc {

    color: var(--muted);

    font-size: 11px;

    margin-top: 5px;

}

.chart-wrap {

    position: relative;

    height: 245px;

}


/* =========================================================
   BOT INFO
========================================================= */

.bottom-grid {

    display: grid;

    grid-template-columns:
        1fr 1fr;

    gap: 18px;

}

.info-row {

    display: flex;

    justify-content: space-between;

    align-items: center;

    padding: 13px 0;

    border-bottom:
        1px solid var(--border);

}

.info-row:last-child {

    border-bottom: 0;

}

.info-key {

    color: var(--muted);

    font-size: 12px;

}

.info-value {

    font-size: 12px;

    font-weight: 700;

}


/* =========================================================
   NUMBERS
========================================================= */

.number-list {

    display: flex;

    flex-direction: column;

    gap: 9px;

    max-height: 220px;

    overflow-y: auto;

}

.number {

    padding: 11px;

    border-radius: 9px;

    background:
        rgba(255,255,255,.025);

    border:
        1px solid var(--border);

    font-size: 12px;

}


/* =========================================================
   MOBILE
========================================================= */

.mobile-menu {

    display: none;

}

@media(max-width: 1100px) {

    .stats-grid {

        grid-template-columns:
            repeat(2, 1fr);

    }

    .chart-grid,
    .bottom-grid {

        grid-template-columns: 1fr;

    }

}

@media(max-width: 700px) {

    .sidebar {

        transform:
            translateX(-100%);

        transition: .25s;

    }

    .sidebar.open {

        transform:
            translateX(0);

    }

    .main {

        margin-left: 0;

        padding: 18px;

    }

    .mobile-menu {

        display: flex;

        width: 40px;
        height: 40px;

        align-items: center;
        justify-content: center;

        border-radius: 10px;

        border:
            1px solid var(--border);

        background:
            var(--panel);

        color: white;

        cursor: pointer;

        margin-right: 10px;

    }

    .topbar {

        align-items: flex-start;

    }

    .page-title {

        font-size: 21px;

    }

    .stats-grid {

        grid-template-columns: 1fr 1fr;

        gap: 10px;

    }

    .stat-card {

        padding: 14px;

    }

    .stat-value {

        font-size: 20px;

    }

    .stat-icon {

        width: 32px;
        height: 32px;

    }

}

@media(max-width: 420px) {

    .stats-grid {

        grid-template-columns: 1fr;

    }

}

</style>

</head>


<body>


<!-- SIDEBAR -->

<aside class="sidebar" id="sidebar">

    <div class="logo">

        <div class="logo-icon">
            🤖
        </div>

        <div>

            <div class="logo-text">
                BOT ADMIN
            </div>

            <div class="logo-sub">
                CONTROL CENTER
            </div>

        </div>

    </div>


    <div class="nav-title">
        Dashboard
    </div>

    <div class="nav-item active">

        <span class="nav-icon">⌂</span>

        Overview

    </div>

    <div class="nav-item">

        <span class="nav-icon">◉</span>

        Bot Status

    </div>

    <div class="nav-item">

        <span class="nav-icon">◈</span>

        Sessions

    </div>

    <div class="nav-item">

        <span class="nav-icon">◌</span>

        Analytics

    </div>


    <div class="nav-title" style="margin-top:28px;">
        System
    </div>

    <div class="nav-item">

        <span class="nav-icon">⚙</span>

        Settings

    </div>

    <div
        class="nav-item"
        onclick="window.location='/'"
    >

        <span class="nav-icon">↗</span>

        API Status

    </div>

</aside>


<!-- MAIN -->

<main class="main">


    <!-- TOP -->

    <div class="topbar">

        <div style="display:flex;align-items:center;">

            <button
                class="mobile-menu"
                onclick="toggleMenu()"
            >
                ☰
            </button>

            <div>

                <div class="page-title">
                    Dashboard
                </div>

                <div class="page-sub">
                    Monitor your WhatsApp bot in real time
                </div>

            </div>

        </div>


        <div class="live">

            <span class="dot"></span>

            LIVE

        </div>

    </div>


    <!-- STATS -->

    <section class="stats-grid">


        <div class="card stat-card">

            <div class="stat-top">

                <span class="stat-label">
                    Bot Status
                </span>

                <div class="stat-icon">
                    ●
                </div>

            </div>

            <div
                class="stat-value"
                id="status"
            >
                ONLINE
            </div>

            <div class="stat-small">
                Real-time connection
            </div>

        </div>


        <div class="card stat-card">

            <div class="stat-top">

                <span class="stat-label">
                    Sessions Online
                </span>

                <div class="stat-icon">
                    ◉
                </div>

            </div>

            <div
                class="stat-value"
                id="sessions"
            >
                0
            </div>

            <div class="stat-small">
                Active bot sessions
            </div>

        </div>


        <div class="card stat-card">

            <div class="stat-top">

                <span class="stat-label">
                    Groups
                </span>

                <div class="stat-icon">
                    👥
                </div>

            </div>

            <div
                class="stat-value"
                id="groups"
            >
                0
            </div>

            <div class="stat-small">
                WhatsApp groups
            </div>

        </div>


        <div class="card stat-card">

            <div class="stat-top">

                <span class="stat-label">
                    Memory
                </span>

                <div class="stat-icon">
                    ◈
                </div>

            </div>

            <div
                class="stat-value"
                id="memory"
            >
                0 MB
            </div>

            <div class="stat-small">
                Process RAM usage
            </div>

        </div>


    </section>


    <!-- CHARTS -->

    <section class="chart-grid">


        <div class="card chart-card">

            <div class="card-head">

                <div>

                    <div class="card-title">
                        Sessions Activity
                    </div>

                    <div class="card-desc">
                        Live sessions over time
                    </div>

                </div>

            </div>

            <div class="chart-wrap">

                <canvas id="sessionsChart"></canvas>

            </div>

        </div>


        <div class="card chart-card">

            <div class="card-head">

                <div>

                    <div class="card-title">
                        Server Memory
                    </div>

                    <div class="card-desc">
                        RAM usage
                    </div>

                </div>

            </div>

            <div class="chart-wrap">

                <canvas id="memoryChart"></canvas>

            </div>

        </div>


    </section>


    <!-- SECOND CHART -->

    <section class="chart-grid">


        <div class="card chart-card">

            <div class="card-head">

                <div>

                    <div class="card-title">
                        Response Speed
                    </div>

                    <div class="card-desc">
                        API response time in milliseconds
                    </div>

                </div>

            </div>

            <div class="chart-wrap">

                <canvas id="speedChart"></canvas>

            </div>

        </div>


        <div class="card chart-card">

            <div class="card-head">

                <div>

                    <div class="card-title">
                        CPU Usage
                    </div>

                    <div class="card-desc">
                        Server CPU load
                    </div>

                </div>

            </div>

            <div class="chart-wrap">

                <canvas id="cpuChart"></canvas>

            </div>

        </div>


    </section>


    <!-- INFORMATION -->

    <section class="bottom-grid">


        <div class="card">

            <div class="card-head">

                <div>

                    <div class="card-title">
                        Bot Information
                    </div>

                    <div class="card-desc">
                        Current bot configuration
                    </div>

                </div>

            </div>


            <div class="info-row">

                <span class="info-key">
                    Bot Name
                </span>

                <span
                    class="info-value"
                    id="botName"
                >
                    Bot
                </span>

            </div>


            <div class="info-row">

                <span class="info-key">
                    Uptime
                </span>

                <span
                    class="info-value"
                    id="uptime"
                >
                    0d 0h 0m 0s
                </span>

            </div>


            <div class="info-row">

                <span class="info-key">
                    Users
                </span>

                <span
                    class="info-value"
                    id="users"
                >
                    0
                </span>

            </div>


            <div class="info-row">

                <span class="info-key">
                    Response Speed
                </span>

                <span
                    class="info-value"
                    id="speed"
                >
                    0 ms
                </span>

            </div>


            <div class="info-row">

                <span class="info-key">
                    CPU
                </span>

                <span
                    class="info-value"
                    id="cpu"
                >
                    0%
                </span>

            </div>


        </div>


        <div class="card">

            <div class="card-head">

                <div>

                    <div class="card-title">
                        Connected Numbers
                    </div>

                    <div class="card-desc">
                        Active WhatsApp connections
                    </div>

                </div>

            </div>


            <div
                class="number-list"
                id="numbers"
            >

                <div class="number">
                    No connected numbers
                </div>

            </div>


        </div>


    </section>


</main>


<script>

/* =========================================================
   CHART CONFIG
========================================================= */

Chart.defaults.color = '#858c9d';

Chart.defaults.borderColor =
    'rgba(255,255,255,.06)';

Chart.defaults.font.family =
    'Inter, system-ui, sans-serif';


const chartOptions = {

    responsive: true,

    maintainAspectRatio: false,

    animation: false,

    interaction: {

        intersect: false,

        mode: 'index'

    },

    plugins: {

        legend: {

            display: false

        }

    },

    scales: {

        x: {

            grid: {

                display: false

            }

        },

        y: {

            beginAtZero: true,

            grid: {

                color:
                    'rgba(255,255,255,.05)'

            }

        }

    }

};


/* =========================================================
   CREATE CHARTS
========================================================= */

const sessionsChart =
new Chart(
    document.getElementById('sessionsChart'),
    {

        type: 'line',

        data: {

            labels: [],

            datasets: [

                {

                    label: 'Sessions',

                    data: [],

                    borderColor: '#8b5cf6',

                    backgroundColor:
                        'rgba(139,92,246,.12)',

                    fill: true,

                    tension: .4,

                    pointRadius: 0

                }

            ]

        },

        options: chartOptions

    }
);


const memoryChart =
new Chart(
    document.getElementById('memoryChart'),
    {

        type: 'line',

        data: {

            labels: [],

            datasets: [

                {

                    label: 'Memory',

                    data: [],

                    borderColor: '#3b82f6',

                    backgroundColor:
                        'rgba(59,130,246,.1)',

                    fill: true,

                    tension: .4,

                    pointRadius: 0

                }

            ]

        },

        options: chartOptions

    }
);


const speedChart =
new Chart(
    document.getElementById('speedChart'),
    {

        type: 'line',

        data: {

            labels: [],

            datasets: [

                {

                    label: 'Speed',

                    data: [],

                    borderColor: '#22c55e',

                    backgroundColor:
                        'rgba(34,197,94,.1)',

                    fill: true,

                    tension: .4,

                    pointRadius: 0

                }

            ]

        },

        options: chartOptions

    }
);


const cpuChart =
new Chart(
    document.getElementById('cpuChart'),
    {

        type: 'line',

        data: {

            labels: [],

            datasets: [

                {

                    label: 'CPU',

                    data: [],

                    borderColor: '#f59e0b',

                    backgroundColor:
                        'rgba(245,158,11,.1)',

                    fill: true,

                    tension: .4,

                    pointRadius: 0

                }

            ]

        },

        options: chartOptions

    }
);


/* =========================================================
   UPDATE CHART
========================================================= */

function updateChart(chart, labels, values) {

    chart.data.labels = labels;

    chart.data.datasets[0].data = values;

    chart.update('none');

}


/* =========================================================
   FETCH STATS
========================================================= */

async function loadStats() {

    try {

        const response =
            await fetch('/api/stats?_' + Date.now());

        if (!response.ok) {
            throw new Error('API error');
        }

        const data =
            await response.json();


        document.getElementById('status')
            .textContent =
            String(data.status || 'offline')
                .toUpperCase();


        document.getElementById('sessions')
            .textContent =
            data.sessionsOnline ?? 0;


        document.getElementById('groups')
            .textContent =
            data.groups ?? 0;


        document.getElementById('memory')
            .textContent =
            `${data.memory ?? 0} MB`;


        document.getElementById('botName')
            .textContent =
            data.botName || 'Bot';


        document.getElementById('uptime')
            .textContent =
            data.uptimeFormatted || '0s';


        document.getElementById('users')
            .textContent =
            data.users ?? 0;


        document.getElementById('speed')
            .textContent =
            `${data.speed ?? 0} ms`;


        document.getElementById('cpu')
            .textContent =
            `${data.cpu ?? 0}%`;


        updateNumbers(data.numbers);


    } catch (error) {

        document.getElementById('status')
            .textContent =
            'OFFLINE';

        console.error(error);

    }

}


/* =========================================================
   NUMBERS
========================================================= */

function updateNumbers(numbers) {

    const container =
        document.getElementById('numbers');

    if (!Array.isArray(numbers) || numbers.length === 0) {

        container.innerHTML = `
            <div class="number">
                No connected numbers
            </div>
        `;

        return;
    }


    container.innerHTML =
        numbers.map(number => `

            <div class="number">

                🟢
                ${escapeHtml(String(number))}

            </div>

        `).join('');

}


/* =========================================================
   HISTORY
========================================================= */

async function loadHistory() {

    try {

        const response =
            await fetch('/api/history?_' + Date.now());

        const result =
            await response.json();

        const data =
            Array.isArray(result.data)
                ? result.data
                : [];


        const labels =
            data.map(item => {

                const date =
                    new Date(item.time);

                return date.toLocaleTimeString(
                    [],
                    {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                    }
                );

            });


        updateChart(
            sessionsChart,
            labels,
            data.map(x => x.sessions || 0)
        );


        updateChart(
            memoryChart,
            labels,
            data.map(x => x.memory || 0)
        );


        updateChart(
            speedChart,
            labels,
            data.map(x => x.speed || 0)
        );


        updateChart(
            cpuChart,
            labels,
            data.map(x => x.cpu || 0)
        );


    } catch (error) {

        console.error(
            'History error:',
            error
        );

    }

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(value) {

    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

}


/* =========================================================
   MOBILE MENU
========================================================= */

function toggleMenu() {

    document
        .getElementById('sidebar')
        .classList.toggle('open');

}


/* =========================================================
   START
========================================================= */

loadStats();

loadHistory();


/*
   Live updates
*/

setInterval(loadStats, 5000);

setInterval(loadHistory, 5000);

</script>


</body>

</html>`);

});


/* =========================================================
   SERVER
========================================================= */

app.listen(PORT, () => {

    console.log(`
╔══════════════════════════════════════╗
║          BOT ADMIN SYSTEM            ║
╠══════════════════════════════════════╣
║ Server : http://localhost:${PORT}
║ Admin  : http://localhost:${PORT}/admin
║ API    : http://localhost:${PORT}/api/stats
╚══════════════════════════════════════╝
`);

});


module.exports = app;
