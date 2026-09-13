// Command: owner
// Auto-extracted from sakura.js switch-case during commandLoader refactor.
module.exports = {
  name: 'owner',
  aliases: [],
  async execute(ctx) {
    const {
      socket, msg, sender, from, command, args, q, reply,
      sessionConfig, number, prefix, config, BOT_NAME_FANCY,
      NEWSLETTER_CONTEXT, resolveReplyJid, downloadQuotedMedia,
      getSriLankaTimestamp, formatMessage, fs, path, os
    } = ctx;

      const sanitized = (number || '').replace(/[^0-9]/g, '');
      const cfg = sessionConfig; // reused from top of handler (was: extra Mongo query per command)
      const botName = cfg.botName || BOT_NAME_FANCY;
      const logo    = cfg.logo    || config.IMAGE_PATH;
      const ownerName   = cfg.ownerName   || config.OWNER_NAME;
      const ownerNumber = (cfg.ownerNumber || config.OWNER_NUMBER || '').replace(/[^0-9]/g, '');

      const dec = `\n••━━━━〔 🖤 ${botName} 〕━━━━••\n\n╭━━━━〔 👑 𝐎𝐖𝐍𝐄𝐑 𝐌𝐄𝐒𝐒𝐀𝐆𝐄 〕━━━━╮\n┃\n┃ 🖤 *𝐍𝐚𝐦𝐞*  : ${ownerName}  \n┃ 👑 *𝐑𝐨𝐥𝐞*  : 𝐎𝐰𝐧𝐞𝐫  \n┃ 📞 *𝐍𝐮𝐦𝐛𝐞𝐫* : ${ownerNumber}  \n┃\n╰━━━━━━━━━━━━━━━━━━━━━━━╯\n\n> © ${ownerName}\n`;

      try {
        if (String(logo).startsWith('http')) {
          await socket.sendMessage(sender, {
            image: { url: logo },
            caption: dec,
            contextInfo: { mentionedJid: [sender], forwardingScore: 143, isForwarded: true }
          }, { quoted: msg });
        } else {
          const fs = require('fs');
          try {
            const buf = fs.readFileSync(logo);
            await socket.sendMessage(sender, {
              image: buf,
              caption: dec,
              contextInfo: { mentionedJid: [sender], forwardingScore: 143, isForwarded: true }
            }, { quoted: msg });
          } catch (_e) {
            await socket.sendMessage(sender, {
              image: { url: config.IMAGE_PATH },
              caption: dec,
              contextInfo: { mentionedJid: [sender], forwardingScore: 143, isForwarded: true }
            }, { quoted: msg });
          }
        }
      } catch (e) {
        await socket.sendMessage(sender, {
          text: dec,
          contextInfo: { mentionedJid: [sender], forwardingScore: 143, isForwarded: true }
        }, { quoted: msg });
      }

      const ownerNumbers = (cfg.ownerName && cfg.ownerNumber)
        ? [{ name: ownerName, number: ownerNumber }]
        : config.OWNER_CONTACTS;
      const contacts = ownerNumbers.map(({ name, number }) => ({
        displayName: name,
        vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:${name}\nORG:${botName};\nTEL;type=CELL;type=VOICE;waid=${number}:+${number}\nEND:VCARD`
      }));

      await socket.sendMessage(sender, {
        contacts: { displayName: `👑 ${botName} - Owner Contacts`, contacts }
      }, { quoted: msg });

  }
};
