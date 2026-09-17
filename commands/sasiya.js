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
    const mongoose = require('mongoose');

    const cfg = sessionConfig;
    const botName = cfg?.botName || BOT_NAME_FANCY;

    await socket.sendMessage(sender, {
      react: { text: '⚡', key: msg.key }
    });

    try {
      // සිස්ටම් විස්තර සහ මැසේජ් කවුන්ට් ලබාගැනීම
      const uptimeSeconds = process.uptime();
      const hrs = Math.floor(uptimeSeconds / 3600);
      const mins = Math.floor((uptimeSeconds % 3600) / 60);
      const secs = Math.floor(uptimeSeconds % 60);

      const totalRam = (os.totalmem() / (1024 * 1024 * 1024)).toFixed(2);
      const freeRam = (os.freemem() / (1024 * 1024 * 1024)).toFixed(2);

      // MongoDB එකෙන් කවුන්ට් එක ලබාගැනීමට උත්සාහ කිරීම (නැතිනම් 0 ලෙස පෙන්වයි)
      let msgCount = 0;
      let cmdCount = 0;
      try {
        const Stats = mongoose.models.BotStats || mongoose.model('BotStats', new mongoose.Schema({
          id: String,
          totalMessages: Number,
          totalCommands: Number
        }));
        const statsData = await Stats.findOne({ id: 'bot_stats' });
        if (statsData) {
          msgCount = statsData.totalMessages || 0;
          cmdCount = statsData.totalCommands || 0;
        }
      } catch (err) {
        // DB එක නැතත් කමාන්ඩ් එක ක්‍රියාත්මක වීමට සලස්වා ඇත
      }

      // ටර්මිනල් ස්වරූපය (Sakura & Cyberpunk Styled)
      const terminalOutput = `
┌───────────────────────────────────────┐
│        ⚡ SASIYA-MD KERNEL v6.7       │
├───────────────────────────────────────┤
│ [Status]     : ONLINE & SECURE        │
│ [Database]   : MONGODB ATLAS (SYNC)   │
│ [Total Msgs] : ${msgCount}                    │
│ [Total Cmds] : ${cmdCount}                    │
│ [Uptime]     : ${hrs}h ${mins}m ${secs}s            │
│ [RAM Free]   : ${freeRam}GB / ${totalRam}GB         │
│ [Node.js]    : ${process.version}              │
└───────────────────────────────────────┘`;

      const caption = `꒰ᵎ 💻 *System Terminal* ᵎ꒱

\`\`\`${terminalOutput.trim()}\`\`\`

✨ *System status loaded successfully!*

    　　˚₊‧꒰ა 🌸 ໒꒱‧₊˚
*${botName}* 🖤 | *𝐁ʟᴀᴄᴋ 𝐂ᴀᴛ 𝐎ꜰᴄ*`;

      await socket.sendMessage(sender, {
        text: caption,
        contextInfo: {
          forwardingScore: 1,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: NEWSLETTER_CONTEXT.forwardedNewsletterMessageInfo.newsletterJid,
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
        text: `꒰ᵎ ❌ *Error* ᵎ꒱\n\n⚠️ Failed to load system terminal!\n\n*${botName}* 🖤`
      }, { quoted: msg });
    }
  }
};
