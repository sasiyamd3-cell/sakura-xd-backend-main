const axios = require('axios');
const https = require('https');

// SSL certificate verification bypass කිරීමට
const agent = new https.Agent({  
  rejectUnauthorized: false
});

module.exports = {
  name: 'ip',
  aliases: ['iplookup', 'domaininfo', 'hostinfo'],
  async execute(ctx) {
    const { socket, msg, sender, args, reply, BOT_NAME_FANCY } = ctx;
    const botName = BOT_NAME_FANCY || 'Black Cat';
    const query = args[0];

    if (!query) {
      return reply('❌ Please provide a valid IP address or domain name!\n📌 *Example:* `.ip google.com` or `.ip 8.8.8.8`');
    }

    try {
      await reply('⏳ *Fetching network details, please wait a moment...*');

      // Free IP-API (No API key required) හරහා විස්තර ලබාගැනීම
      const apiEndpoint = `http://ip-api.com/json/${query}?fields=status,message,continent,country,countryCode,regionName,city,zip,lat,lon,timezone,isp,org,as,query`;
      const response = await axios.get(apiEndpoint, { httpsAgent: agent });
      const data = response.data;

      if (data.status !== 'success') {
        return reply(`❌ Failed to lookup IP/Domain: ${data.message || 'Invalid target or not found!'}`);
      }

      const infoText = 
        `🌸⃝⃘̉̉̉̉̉̉🧚‍♀️ *IP & DOMAIN LOOKUP INFO* 🧚‍♀️🌸⃝⃘̉̉̉̉̉̉\n\n` +
        `🔍 *Target:* \`${data.query}\`\n` +
        `🌍 *Country:* ${data.country} (${data.countryCode})\n` +
        `🏙️ *Region / City:* ${data.regionName}, ${data.city}\n` +
        `📮 *Zip Code:* ${data.zip || 'N/A'}\n` +
        `🌐 *ISP:* ${data.isp || 'N/A'}\n` +
        `🏢 *Organization:* ${data.org || 'N/A'}\n` +
        `📡 *AS Number:* ${data.as || 'N/A'}\n` +
        `🕒 *Timezone:* ${data.timezone || 'N/A'}\n` +
        `📍 *Coordinates:* Lat: ${data.lat}, Lon: ${data.lon}\n\n` +
        `🧚‍♀️ *©ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝐁ʟᴀᴄᴋ 𝐂ᴀᴛ 𝐎ꜰᴄ*\n\n` +
        `*${botName}* 🖤 | *𝐁ʟᴀᴄᴋ 𝐂ᴀᴛ 𝐎ꜰᴄ*`;

      await socket.sendMessage(sender, { text: infoText }, { quoted: msg });

    } catch (e) {
      console.error('[ip error]:', e);
      return reply(`❌ Failed to fetch IP details: ${e.message}`);
    }
  }
};
