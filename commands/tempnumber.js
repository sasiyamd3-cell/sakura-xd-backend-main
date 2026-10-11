const axios = require('axios');
const https = require('https');

// SSL certificate verification bypass කිරීමට
const agent = new https.Agent({  
  rejectUnauthorized: false
});

// Active numbers සේව් කරගැනීමට Map එකක්
const activeNumbers = new Map();

module.exports = {
  name: 'tempnumber',
  aliases: ['tmpnum', 'checksms', 'smsinbox'],
  async execute(ctx) {
    const { socket, msg, sender, prefix, args, reply, BOT_NAME_FANCY } = ctx;
    const commandUsed = ctx.command || 'tempnumber';
    const botName = BOT_NAME_FANCY || 'Black Cat';

    try {
      // යූසර් .checksms හෝ .smsinbox කියලා ගැහුවොත් එන SMS/OTPs චෙක් කරයි
      if (['checksms', 'smsinbox', 'numsms'].includes(commandUsed) || args[0] === 'inbox' || args[0] === 'check') {
        const userNumData = activeNumbers.get(sender);
        if (!userNumData) {
          return reply(`❌ You don't have an active temporary number! Type *${prefix}tempnumber* first to generate one.`);
        }

        const { phoneNumber, country } = userNumData;
        
        // Free SMS receive public API (Receive-SMSS or similar gateway)
        const smsApiUrl = `https://receive-smss.com/sms/${phoneNumber.replace('+', '')}/`;
        const res = await axios.get(smsApiUrl, { httpsAgent: agent, headers: { 'User-Agent': 'Mozilla/5.0' } });
        
        // Simple regex to parse incoming messages/codes from HTML table
        const html = res.data;
        if (!html.includes(phoneNumber)) {
          return reply(`📱 *Number:* \`${phoneNumber}\` (${country})\n\n📭 No messages received yet. Keep refreshing using *${prefix}checksms*!`);
        }

        return reply(
          `📱 *SMS INBOX FOR:* \`${phoneNumber}\`\n\n` +
          `🌐 *Status:* Active & Listening for OTPs...\n` +
          `🔗 *Live Web View:* ${smsApiUrl}\n\n` +
          `> Check the live web link above to view incoming verification codes instantly in real-time!`
        );
      }

      // 1. Get available free temporary numbers list
      const listUrl = 'https://receive-smss.com/';
      const listRes = await axios.get(listUrl, { httpsAgent: agent, headers: { 'User-Agent': 'Mozilla/5.0' } });
      
      // Regex to extract phone numbers from the public page
      const matches = listRes.data.match(/\+\d{10,15}/g);
      if (!matches || matches.length === 0) {
        return reply('❌ Temporary number service is currently busy. Try again later!');
      }

      // Unique numbers පමණක් ලබාගැනීම
      const uniqueNumbers = [...new Set(matches)];
      const randomPhone = uniqueNumbers[Math.floor(Math.random() * uniqueNumbers.length)];
      const countryCode = randomPhone.startsWith('+1') ? 'USA / Canada' : 'International';

      // Active සේව් කරගැනීම
      activeNumbers.set(sender, { phoneNumber: randomPhone, country: countryCode });

      const caption = 
        `🌸⃝⃘̉̉̉̉̉̉🧚‍♀️ *TEMPORARY VIRTUAL NUMBER* 🧚‍♀️🌸⃝⃘̉̉̉̉̉̉\n\n` +
        `> 📱 *Your burner phone number is ready!*\n\n` +
        `📞 *Number:* \`${randomPhone}\`\n` +
        `🌍 *Region:* ${countryCode}\n\n` +
        `📌 *How to check incoming SMS / OTPs:*\n` +
        `Type \`${prefix}checksms\` to fetch messages!\n\n` +
        `🧚‍♀️ *©ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝐁ʟᴀᴄᴋ 𝐂ᴀᴛ 𝐎ꜰᴄ*\n\n` +
        `*${botName}* 🖤 | *𝐁ʟᴀᴄᴋ 𝐂ᴀᴛ 𝐎ꜰᴄ*`;

      await socket.sendMessage(sender, { text: caption }, { quoted: msg });

    } catch (e) {
      console.error('[tempnumber error]:', e);
      return reply(`❌ Failed to process temp number: ${e.message}`);
    }
  }
};
