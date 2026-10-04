// Command: alive
const fsp = require('fs').promises;
const nodePath = require('path');

const imageCache = new Map();

async function getImageBuffer(src) {
  const key = String(src);
  if (imageCache.has(key)) return imageCache.get(key);

  let buf;
  if (key.startsWith('http')) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 5000);
    try {
      const res = await fetch(key, { signal: ctrl.signal });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      buf = Buffer.from(await res.arrayBuffer());
    } finally {
      clearTimeout(t);
    }
  } else {
    // local file: absolute path එකක් බවට හරවනවා
    const abs = nodePath.isAbsolute(key) ? key : nodePath.resolve(process.cwd(), key);
    buf = await fsp.readFile(abs);
  }

  imageCache.set(key, buf);
  return buf;
}

module.exports = {
  name: 'alive',
  aliases: [],
  async execute(ctx) {
    const {
      socket, msg, sender, sessionConfig, config,
      BOT_NAME_FANCY, NEWSLETTER_CONTEXT
    } = ctx;

    const cfg = sessionConfig;
    const botName = cfg.botName || BOT_NAME_FANCY;
    const logo = cfg.logo || config.IMAGE_PATH;

    const uptimeSec = Math.floor(process.uptime());
    const hh = Math.floor(uptimeSec / 3600);
    const mm = Math.floor((uptimeSec % 3600) / 60);
    const ss = uptimeSec % 60;

    let runtimeStr = '';
    if (hh > 0) runtimeStr += `${hh} hour${hh > 1 ? 's' : ''}, `;
    if (mm > 0) runtimeStr += `${mm} minute${mm > 1 ? 's' : ''}, `;
    runtimeStr += `${ss} second${ss !== 1 ? 's' : ''}`;

    const memMB = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);

    const aliveCaption =
      `🌹⃝⃘̉̉̉̉̉̉🧚‍♀️ *ʜᴇʟʟᴏ ♡⸝⸝> ̫ <⸝⸝♡* 🧚‍♀️🌹⃝⃘̉̉̉̉̉̉\n\n` +
      `┊ ┊ ✫ ˚♡ ⋆｡❀\n` +
      `┊ ☪︎⋆\n\n` +
      `> 🌿 *ᴠᴇʀsɪᴏɴ :* ${config.BOT_VERSION || 'V5'}\n` +
      `> 💫 *ᴍᴇᴍᴏʀʏ :* ${memMB}MB\n` +
      `> ⏳ *ʀᴜɴᴛɪᴍᴇ :* ${runtimeStr}\n` +
      `> 🌐 *ʜᴏsᴛ :* Railway\n\n` +
      `🧚‍♀️ *©ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝐁ʟᴀᴄᴋ 𝐂ᴀᴛ 𝐎ꜰᴄ*\n\n` +
      `*${botName}* 🖤 | *𝐁ʟᴀᴄᴋ 𝐂ᴀᴛ 𝐎ꜰᴄ*`;

    const channelContext = {
      forwardingScore: 1,
      isForwarded: true,
      forwardedNewsletterMessageInfo: {
        newsletterJid: NEWSLETTER_CONTEXT.forwardedNewsletterMessageInfo.newsletterJid,
        newsletterName: botName,
        serverMessageId: 999,
      }
    };

    // react එක await නැතුව background එකේ
    socket.sendMessage(sender, { react: { text: '🐽', key: msg.key } }).catch(() => {});

    try {
      let buf;
      try {
        buf = await getImageBuffer(logo);
      } catch (e) {
        console.log('[alive] logo load fail:', logo, e.message);
        buf = await getImageBuffer(config.IMAGE_PATH);
      }

      await socket.sendMessage(sender, {
        image: buf,
        caption: aliveCaption,
        contextInfo: channelContext
      }, { quoted: msg });
    } catch (e) {
      console.log('[alive] image send fail:', e.message);
      await socket.sendMessage(sender, {
        text: aliveCaption,
        contextInfo: channelContext
      }, { quoted: msg });
    }
  }
};
