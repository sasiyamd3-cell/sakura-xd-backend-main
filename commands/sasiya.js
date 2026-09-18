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
    const fs = require('fs');
    const path = require('path');

    const cfg = sessionConfig || {};
    const botName = cfg.botName || BOT_NAME_FANCY || '𝐌𝐈𝐘𝐎𝐑𝐀 𝐌𝐃';

    await socket.sendMessage(sender, {
      react: { text: '⚡', key: msg.key }
    });

    try {
      // 1. ඇක්ටිව් ගණන් ලබාගැනීම (Groups & Bot Pairing Users)
      let totalGroups = 0;
      let totalChats = 0;
      let pairedUsersCount = 1; // Default එකට බොට් ඕනර් /කරන්ට් යූසර්

      try {
        // ගෘප් සහ චැට් ගණන සෙවීම
        if (typeof socket.groupFetchAllParticipating === 'function') {
          const groups = await socket.groupFetchAllParticipating();
          totalGroups = Object.keys(groups).length;
        } else if (socket.chats) {
          const chatKeys = Object.keys(socket.chats.all ? socket.chats.all() : socket.chats);
          totalGroups = chatKeys.filter(id => id.endsWith('@g.us')).length;
          totalChats = chatKeys.length;
        }

        // Auth / Session ෆෝල්ඩර් එක ඇතුළේ පේයාර් වී ඇති ක්‍රියාකාරී යූසර්ස්ලා ගණන (Creds files / subfolders) بررسی කිරීම
        const authPath = path.join(process.cwd(), 'auth_info_baileys'); // ඔයාගේ බොට් සෙෂන් ෆෝල්ඩර් නම මෙතැනට සෙට් වේ
        if (fs.existsSync(authPath)) {
          const files = fs.readdirSync(authPath);
          // creds-xxxx හෝ pre-key වැනි ෆයිල්ස් පදනම් කර ගනිමින් හෝ කන්ටැක්ට් ලොග් ගණන පරීක්ෂා කිරීම
          const credsFiles = files.filter(f => f.startsWith('creds') || f.includes('sender-key'));
          if (credsFiles.length > 0) {
            pairedUsersCount = credsFiles.length;
          }
        }
      } catch (err) {
        console.log('[Count Error]:', err.message);
      }

      // 2. සිස්ටම් විස්තර සහ අප්টাইම් ලබාගැනීම
      const uptimeSeconds = process.uptime();
      const hrs = Math.floor(uptimeSeconds / 3600);
      const mins = Math.floor((uptimeSeconds % 3600) / 60);
      const secs = Math.floor(uptimeSeconds % 60);

      const totalRam = (os.totalmem() / (1024 * 1024 * 1024)).toFixed(2);
      const freeRam = (os.freemem() / (1024 * 1024 * 1024)).toFixed(2);

      // ටර්මිනල් ස්වරූපය (Groups + Bot Users Included)
      const terminalOutput = `
┌───────────────────────────────────────┐
│        ⚡ SASIYA-MD KERNEL v6.7       │
├───────────────────────────────────────┤
│ [Status]        : ONLINE & SECURE     │
│ [Bot Users]     : ${String(pairedUsersCount).padEnd(20, ' ')} │
│ [Active Groups] : ${String(totalGroups).padEnd(20, ' ')} │
│ [Total Chats]   : ${String(totalChats).padEnd(20, ' ')} │
│ [Uptime]        : ${hrs}h ${mins}m ${secs}s         │
│ [RAM Free]      : ${freeRam}GB / ${totalRam}GB      │
└───────────────────────────────────────_`.trim();

      const caption = `꒰ᵎ 💻 *Bot & System Terminal* ᵎ꒱

\`\`\`${terminalOutput}\`\`\`

✨ *Bot users and active groups loaded successfully!*

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
