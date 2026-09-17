// Command: sasiya (aliases: cmd, terminal)
module.exports = {
  name: 'sasiya',
  aliases: ['cmd', 'terminal'],
  async execute(ctx) {
    const {
      socket, msg, sender, sessionConfig, 
      BOT_NAME_FANCY, NEWSLETTER_CONTEXT
    } = ctx;

    const os = require('os');

    const cfg = sessionConfig || {};
    const botName = cfg.botName || BOT_NAME_FANCY || '𝐌𝐈𝐘𝐎𝐑𝐀 𝐌𝐃';

    await socket.sendMessage(sender, {
      react: { text: '⚡', key: msg.key }
    });

    try {
      // 1. බොට් එකට සම්බන්ධ වී ඇති ඇක්ටිව් ගෘප් සහ චැට්ස් ගණන ගණනය කිරීම
      let totalGroups = 0;
      let totalChats = 0;

      try {
        // Baileys socket එකේ store හෝ chats ලිස්ට් එක පරීක්ෂා කිරීම
        if (socket.chats) {
          const chatKeys = Object.keys(socket.chats.all ? socket.chats.all() : socket.chats);
          totalChats = chatKeys.length;
          totalGroups = chatKeys.filter(id => id.endsWith('@g.us')).length;
        } else if (typeof socket.groupFetchAllParticipating === 'function') {
          const groups = await socket.groupFetchAllParticipating();
          totalGroups = Object.keys(groups).length;
        }
      } catch (err) {
        // Fallback එකක් ලෙස
        totalGroups = 'N/A';
        totalChats = 'N/A';
      }

      // 2. සිස්ටම් විස්තර සහ අප්টাইම් ලබාගැනීම
      const uptimeSeconds = process.uptime();
      const hrs = Math.floor(uptimeSeconds / 3600);
      const mins = Math.floor((uptimeSeconds % 3600) / 60);
      const secs = Math.floor(uptimeSeconds % 60);

      const totalRam = (os.totalmem() / (1024 * 1024 * 1024)).toFixed(2);
      const freeRam = (os.freemem() / (1024 * 1024 * 1024)).toFixed(2);

      // ටර්මිනල් ස්වරූපය (Active Bot & Group Counts Included)
      const terminalOutput = `
┌───────────────────────────────────────┐
│        ⚡ SASIYA-MD KERNEL v6.7       │
├───────────────────────────────────────┤
│ [Status]     : ONLINE & SECURE        │
│ [Active Groups] : ${String(totalGroups).padEnd(20, ' ')} │
│ [Total Chats]   : ${String(totalChats).padEnd(20, ' ')} │
│ [Uptime]     : ${hrs}h ${mins}m ${secs}s            │
│ [RAM Free]   : ${freeRam}GB / ${totalRam}GB         │
└───────────────────────────────────────_`.trim();

      const caption = `꒰ᵎ 💻 *Active Bot & System Terminal* ᵎ꒱

\`\`\`${terminalOutput}\`\`\`

✨ *Active bot counts loaded successfully!*

    　　˚₊‧꒰ა 🌸 ໒꒱‧₊˚
*${botName}* 🌸 | *💖 𝐌𝐈𝐘𝐎𝐑𝐀 𝐌𝐃 🌸*`;

      await socket.sendMessage(sender, {
        text: caption,
        contextInfo: {
          forwardingScore: 1,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: NEWSLETTER_CONTEXT?.forwardedNewsletterMessageInfo?.newsletterJid || '12836332842183@newsletter',
            newsletterName: botName,
            serverMessageId: 999,
          }
        }
      }, { quoted: msg });

      await socket.sendMessage(sender, {
        react: { text: '✅', key: msg.key }
      });

    } catch (e) {
      console.error('[sasiya] command error:', e);
      await socket.sendMessage(sender, {
        text: `꒰ᵎ ❌ *Error* ᵎ꒱\n\n⚠️ Failed to load system terminal!\n\n*${botName}* 🌸`
      }, { quoted: msg });
    }
  }
};
