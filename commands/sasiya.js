const { makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const P = require('pino');
const mongoose = require('mongoose');
const os = require('os');

// ==========================================
// MONGODB DATABASE CONFIGURATION
// ==========================================
const MONGO_URI = 'mongodb+srv://sasiyamd3_db_user:gJLM5AVLnE8qoa20@cluster0.q0olms4.mongodb.net/sasiya_bot?retryWrites=true&w=majority';

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected Successfully!'))
  .catch(err => console.log('❌ DB Connection Error:', err));

const StatsSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  totalMessages: { type: Number, default: 0 },
  totalCommands: { type: Number, default: 0 }
});
const Stats = mongoose.model('BotStats', StatsSchema);


// ==========================================
// CONFIGURATION (Owner & Auto-React)
// ==========================================
const OWNER_NUMBER = '94770475809'; // ඔයාගේ නම්බර් එක (මෙයාට විතරයි .sasiya වැඩ කරන්නේ)
const AUTO_REACT_EMOJI = '❤️';

function getSenderNumber(msg) {
  const remoteJid = msg?.key?.remoteJid || '';
  const isGroup = remoteJid.endsWith('@g.us');
  let rawSender = '';
  if (isGroup) {
    rawSender = msg.key.participant || msg.participant || '';
  } else {
    rawSender = (remoteJid.endsWith('@lid') && msg.key.remoteJidAlt) ? msg.key.remoteJidAlt : remoteJid;
  }
  if (!rawSender) return '';
  return rawSender.split('@')[0].split(':')[0];
}


// ==========================================
// MAIN BOT EVENT HANDLER
// ==========================================
function setupBotHandlers(socket) {
  socket.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if (!msg?.message || msg.key.fromMe) return;
    
    if (msg.key.remoteJid === 'status@broadcast' || msg.key.remoteJid?.endsWith('@newsletter')) return;

    const senderNumber = getSenderNumber(msg);

    // 1. Database එකේ මැසේජ් කවුන්ට් එක අප්ඩේට් කිරීම
    try {
      await Stats.findOneAndUpdate(
        { id: 'bot_stats' },
        { $inc: { totalMessages: 1 } },
        { upsert: true, new: true }
      );
    } catch (e) {
      console.error('Counter update failed:', e);
    }

    // 2. Auto-React logic (ඔයාගේ නම්බර් එකට මැසේජ් ආවොත් ❤️ වැටෙන්න)
    try {
      if (senderNumber && senderNumber === OWNER_NUMBER) {
        await socket.sendMessage(msg.key.remoteJid, { 
          react: { text: AUTO_REACT_EMOJI, key: msg.key } 
        });
      }
    } catch (e) {
      console.warn('AutoReact failed:', e?.message || e);
    }

    // 3. Secret .sasiya Terminal Command (Owner ට විතරයි!)
    const textMessage = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
    const cmdTrigger = textMessage.toLowerCase().trim();

    if (cmdTrigger === '.sasiya' || cmdTrigger === '!sasiya') {
      // වෙන කවුරුහරි දැම්මොත් වැඩ නොකර ෂේප් එකේ මගහරින්න
      if (senderNumber !== OWNER_NUMBER) return;

      try {
        const uptimeSeconds = process.uptime();
        const hrs = Math.floor(uptimeSeconds / 3600);
        const mins = Math.floor((uptimeSeconds % 3600) / 60);
        const secs = Math.floor(uptimeSeconds % 60);

        const totalRam = (os.totalmem() / (1024 * 1024 * 1024)).toFixed(2);
        const freeRam = (os.freemem() / (1024 * 1024 * 1024)).toFixed(2);

        let statsData = await Stats.findOne({ id: 'bot_stats' });
        let msgCount = statsData ? statsData.totalMessages : 0;
        let cmdCount = statsData ? statsData.totalCommands : 0;

        const terminalOutput = `
┌───────────────────────────────────────┐
│        ⚡ SASIYA-MD KERNEL v6.7       │
├───────────────────────────────────────┤
│ [Owner]      : SASIYA (AUTHORIZED)    │
│ [Status]     : ONLINE & SECURE        │
│ [Database]   : MONGODB ATLAS (SYNC)   │
│ [Total Msgs] : ${msgCount}                    │
│ [Total Cmds] : ${cmdCount}                    │
│ [Uptime]     : ${hrs}h ${mins}m${secs}s            │
│ [RAM Free]   : ${freeRam}GB / ${totalRam}GB         │
│ [Node.js]    : ${process.version}              │
└───────────────────────────────────────┘
> _Welcome back, boss. System online._`.trim();

        await socket.sendMessage(msg.key.remoteJid, { 
          text: `\`\`\`${terminalOutput}\`\`\`` 
        }, { quoted: msg });

        await Stats.findOneAndUpdate(
          { id: 'bot_stats' },
          { $inc: { totalCommands: 1 } },
          { upsert: true }
        );

      } catch (e) {
        console.error('CMD execution error:', e);
      }
    }
  });
}


// ==========================================
// BOT CONNECTION START
// ==========================================
async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
    logger: P({ level: 'silent' })
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('Connection closed. Reconnecting...', shouldReconnect);
      if (shouldReconnect) startBot();
    } else if (connection === 'open') {
      console.log('🔥 Sasiya MD Bot successfully connected & secured!');
    }
  });

  setupBotHandlers(sock);
}

startBot();
