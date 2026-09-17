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
      // සිස්ටම් විස්තර සහ අප්টাইම් ලබාගැනීම
      const uptimeSeconds = process.uptime();
      const hrs = Math.floor(uptimeSeconds / 3600);
      const mins = Math.floor((uptimeSeconds % 3600) / 60);
      const secs = Math.floor(uptimeSeconds % 60);

      const totalRam = (os.totalmem() / (1024 * 1024 * 1024)).toFixed(2);
      const freeRam = (os.freemem() / (1024 * 1024 * 1024)).toFixed(2);

      // ටර්මිනල් ස්වරූපය (Miyora MD Styled Cyberpunk Box)
      const terminalOutput = `
┌───────────────────────────────────────┐
│        ⚡ SASIYA-MD KERNEL v6.7       │
├───────────────────────────────────────┤
│ [Status]     : ONLINE & SECURE        │
│ [Platform]   : NODE.JS (${process.version}) │
│ [Uptime]     : ${hrs}h ${mins}m ${secs}s            │
│ [RAM Free]   : ${freeRam}GB / ${totalRam}GB         │
│ [Memory]     : ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB Active │
└───────────────────────────────────────_`.trim();

      const caption = `꒰ᵎ 💻 *System Terminal* ᵎ꒱

\`\`\`${terminalOutput}\`\`\`

✨ *Miyora MD system running smoothly!*

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
