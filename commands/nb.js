const axios = require('axios');

module.exports = {
  name: 'nb',
  aliases: ['num', 'true', 'userinfo'],
  async execute(ctx) {
    const { socket, msg, sender, args, prefix, sessionConfig, BOT_NAME_FANCY, NEWSLETTER_CONTEXT } = ctx;
    const botName = sessionConfig?.botName || BOT_NAME_FANCY || 'NEXUS-MD';

    // 1. Target number එක හොයාගැනීම (Type කරලා දුන්නත්, නැත්නම් වෙන කෙනෙක්ව Quote/Reply කරලා ගැහුවත් වැඩ කරනවා)
    let target = '';
    
    if (msg.message?.extendedTextMessage?.contextInfo?.participant) {
      target = msg.message.extendedTextMessage.contextInfo.participant;
    } else if (args[0]) {
      // දාපු නම්බර් එකෙන් spaces හෝ + ලකුණු අයින් කරලා ක්ලීන් කරගැනීම
      target = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
    } else {
      return await socket.sendMessage(sender, {
        text: `꒰ᵎ 🔍 *Number Lookup* ᵎ꒱

⚠️ Please provide a phone number or reply to a user's message!

📌 *Usage:* ${prefix}number 94770475809
📌 *Example:* ${prefix}number <reply to user>

　　˚₊‧꒰ა 🌸 ໒꒱‧₊˚
*${botName}* 🖤 | *𝐁ʟᴀᴄᴋ 𝐂ᴀᴛ 𝐎ꜰᴄ*`
      }, { quoted: msg });
    }

    // Searching React
    await socket.sendMessage(sender, { react: { text: '🔍', key: msg.key } }).catch(() => {});

    try {
      // 2. WhatsApp එකෙන් අදාළ නම්බර් එකේ ඩීටෙල්ස් චෙක් කිරීම
      const [onWhatsApp] = await socket.onWhatsApp(target.includes('@') ? target : `${target}@s.whatsapp.net`);
      
      let phoneNum = target.split('@')[0];
      let jid = onWhatsApp?.exists ? onWhatsApp.jid : target;
      let isRegistered = onWhatsApp?.exists ? 'Yes ✅' : 'No ❌';

      // Profile Picture එක ලබාගැනීම (ප්‍රොෆයිල් පික් එකක් තියෙනවා නම්)
      let ppUrl = 'https://i.ibb.co/31p7g9W/default-avatar.png';
      try {
        ppUrl = await socket.profilePictureUrl(jid, 'image');
      } catch {
        // Default avatar if no profile picture
      }

      // 3. රට සහ කෝඩ් විස්තර ටික සෙට් කරගැනීම
      let country = 'Unknown';
      let carrierInfo = 'Mobile / Cellular';
      
      if (phoneNum.startsWith('94')) {
        country = 'Sri Lanka 🇱🇰';
        const prefixCode = phoneNum.substring(2, 4);
        if (['70', '71', '72', '74', '75', '76', '77', '78'].includes(prefixCode)) {
          carrierInfo = `Sri Lankan Mobile (${prefixCode} - Dialog / Mobitel / Hutch / Airtel)`;
        }
      } else if (phoneNum.startsWith('91')) {
        country = 'India 🇮🇳';
      } else if (phoneNum.startsWith('1')) {
        country = 'USA / Canada 🇺🇸/🇨🇦';
      } else {
        country = `International (+${phoneNum.substring(0, 3)}...)`;
      }

      await socket.sendMessage(sender, { react: { text: '📋', key: msg.key } }).catch(() => {});

      const nlCtx = {
        forwardingScore: 1,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: NEWSLETTER_CONTEXT.forwardedNewsletterMessageInfo.newsletterJid,
          newsletterName: botName,
          serverMessageId: 999,
        }
      };

      // 4. Result එක මැසේජ් එකක් ලෙස යැවීම (Image එකත් සමඟ)
      const captionText = `꒰ᵎ 📱 *NUMBER INFO LOOKUP* ᵎ꒱

📞 *Number:* \`+${phoneNum}\`
💬 *WhatsApp JID:* \`${jid}\`
🌍 *Country:* ${country}
📡 *Network:* ${carrierInfo}
🟢 *On WhatsApp:* ${isRegistered}

　　˚₊‧꒰ა 🌸 ໒꒱‧₊˚
*${botName}* 🖤 | *𝐁ʟᴀᴄᴋ 𝐂ᴀᴛ 𝐎ꜰᴄ*`;

      await socket.sendMessage(sender, {
        image: { url: ppUrl },
        caption: captionText,
        contextInfo: nlCtx
      }, { quoted: msg });

      await socket.sendMessage(sender, { react: { text: '✅', key: msg.key } }).catch(() => {});

    } catch (e) {
      console.error('[number error]:', e.message);
      await socket.sendMessage(sender, {
        text: `꒰ᵎ ❌ *Error* ᵎ꒱\n\n⚠️ Failed to fetch number info! Make sure the number format is correct.\n\n*${botName}* 🖤`
      }, { quoted: msg });
    }
  }
};
