// Command: report (aliases: reportuser, reportnum)
module.exports = {
  name: 'report',
  aliases: ['reportuser', 'reportnum'],
  async execute(ctx) {
    const {
      socket, msg, sender, args, prefix,
      sessionConfig, BOT_NAME_FANCY,
      NEWSLETTER_CONTEXT, resolveReplyJid, config
    } = ctx;

    const cfg = sessionConfig || {};
    const botName = cfg.botName || BOT_NAME_FANCY;

    try {
      let targetJid = null;
      let targetNumber = '';

      const quotedJid = resolveReplyJid(msg);
      if (quotedJid) {
        targetJid = quotedJid;
        targetNumber = quotedJid.split('@')[0];
      } else if (args.length > 0) {
        const cleanNumber = args[0].replace(/[^0-9]/g, '');
        if (cleanNumber.length >= 10) {
          targetNumber = cleanNumber;
          targetJid = `${cleanNumber}@s.whatsapp.net`;
        }
      }

      if (!targetJid || !targetNumber) {
        return await socket.sendMessage(sender, {
          text: `꒰ᵎ 🚨 *ꜱᴀꜰᴇᴛʏ & ʀᴇᴘᴏʀᴛ sʏsᴛᴇᴍ* ᵎ꒱

⚠️ *Please specify a target user to report!*

📌 *Usage:*
  • Reply to target's message with *${prefix}report*
  • Or type: *${prefix}report <number> <reason>*

📌 *Example:*
  • *${prefix}report 94767475809 Scam Activity*

　　˚₊‧꒰ა 🌸 ໒꒱‧₊˚
*${botName}* 🖤 | *𝐁ʟᴀᴄᴋ 𝐂ᴀᴛ 𝐎ꜰᴄ*`
        }, { quoted: msg });
      }

      await socket.sendMessage(sender, {
        react: { text: '🚨', key: msg.key }
      });

      const reasonInput = args.slice(quotedJid ? 0 : 1).join(' ').trim();
      const reasonText = reasonInput || 'Unspecified Safety Violation';
      const timestamp = new Date().toLocaleString('en-US', { timeZone: 'Asia/Colombo' });

      const alertCaption = `꒰ᵎ 🚨 *ᴄᴏᴍᴍᴜɴɪᴛʏ sᴀꜰᴇᴛʏ ʀᴇᴘᴏʀᴛ* ᵎ꒱

👤 *Target User* ➜ @${targetNumber}
📝 *Reason* ➜ ${reasonText}
⏰ *Timestamp* ➜ ${timestamp}

📌 *[ 🛡️ ʀᴇᴄᴏᴍᴍᴇɴᴅᴇᴅ sᴀꜰᴇᴛʏ sᴛᴇᴘs ]*
  1️⃣ Tap the contact card attached below
  2️⃣ Select *View Contact* ➜ Scroll down
  3️⃣ Tap *Report Contact* & check *Block*

　　˚₊‧꒰ა 🌸 ໒꒱‧₊˚
> 🛡️ *Security Status:* Logged & forwarded to System Admin.

*${botName}* 🖤 | *𝐁ʟᴀᴄᴋ 𝐂ᴀᴛ 𝐎ꜰᴄ*`;

      const vcard = 
        'BEGIN:VCARD\n' +
        'VERSION:3.0\n' +
        `FN:Report Target (${targetNumber})\n` +
        `TEL;type=CELL;type=VOICE;waid=${targetNumber}:+${targetNumber}\n` +
        'END:VCARD';

      await socket.sendMessage(sender, {
        contacts: {
          displayName: `Target: ${targetNumber}`,
          contacts: [{ vcard }]
        }
      }, { quoted: msg });

      const nlCtx = {
        forwardingScore: 1,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: NEWSLETTER_CONTEXT.forwardedNewsletterMessageInfo.newsletterJid,
          newsletterName: botName,
          serverMessageId: 999,
        }
      };

      await socket.sendMessage(sender, {
        text: alertCaption,
        mentions: [targetJid],
        contextInfo: nlCtx
      }, { quoted: msg });

      await socket.sendMessage(sender, {
        react: { text: '✅', key: msg.key }
      });

      if (config && config.OWNER_NUMBER) {
        const ownerJid = `${config.OWNER_NUMBER.replace(/[^0-9]/g, '')}@s.whatsapp.net`;
        const ownerLog = 
          `꒰ᵎ ⚠️ *sʏsᴛᴇᴍ ʀᴇᴘᴏʀᴛ ʟᴏɢ* ᵎ꒱\n\n` +
          `• *Target:* @${targetNumber}\n` +
          `• *Reporter:* @${sender.split('@')[0]}\n` +
          `• *Reason:* ${reasonText}\n` +
          `• *Time:* ${timestamp}\n\n` +
          `*${botName}* 🖤`;

        await socket.sendMessage(ownerJid, {
          text: ownerLog,
          mentions: [targetJid, sender]
        }).catch(() => {});
      }

    } catch (e) {
      console.error('[report command error]:', e.message || e);
      await socket.sendMessage(sender, {
        text: `꒰ᵎ ❌ *Error* ᵎ꒱\n\n⚠️ Failed to process report command!\n\n*${botName}* 🖤`
      }, { quoted: msg });
    }
  }
};
