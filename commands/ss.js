const axios = require('axios');
const https = require('https');

// SSL certificate verification bypass කිරීමට
const agent = new https.Agent({  
  rejectUnauthorized: false
});

module.exports = {
  name: 'ss',
  aliases: ['screenshot', 'webss'],
  async execute(ctx) {
    const { socket, msg, sender, args, reply, BOT_NAME_FANCY } = ctx;
    const botName = BOT_NAME_FANCY || 'Black Cat';

    try {
      const urlToCapture = args[0];
      if (!urlToCapture) {
        return reply('❌ Please provide a valid website URL!\n📌 *Example:* `.ss https://google.com`');
      }

      // URL එකට http:// හෝ https:// නැත්නම් එකතු කිරීම
      let targetUrl = urlToCapture;
      if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
        targetUrl = 'https://' + targetUrl;
      }

      await reply('⏳ *Capturing website screenshot, please wait a moment...*');

      // Microlink Free Screenshot API එක හරහා සයිට් එකේ Screenshot එක ලබාගැනීම
      const apiEndpoint = `https://api.microlink.io/?url=${encodeURIComponent(targetUrl)}&screenshot=true&meta=false&embed=screenshot.url`;
      const response = await axios.get(apiEndpoint, { httpsAgent: agent });
      
      const screenshotUrl = response.data?.data?.screenshot?.url;
      if (!screenshotUrl) {
        return reply('❌ Failed to capture screenshot. Make sure the URL is valid and accessible!');
      }

      // WhatsApp එකට පින්තූරය යැවීම
      const caption = 
        `🌸⃝⃘̉̉̉̉̉̉🧚‍♀️ *WEBSITE SCREENSHOT CAPTURE* 🧚‍♀️🌸⃝⃘̉̉̉̉̉̉\n\n` +
        `> 🌐 *Target URL:* \`${targetUrl}\`\n\n` +
        `🧚‍♀️ *©ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝐁ʟᴀᴄᴋ 𝐂ᴀᴛ 𝐎ꜰᴄ*\n\n` +
        `*${botName}* 🖤 | *𝐁ʟᴀᴄᴋ 𝐂ᴀᴛ 𝐎ꜰᴄ*`;

      await socket.sendMessage(sender, { 
        image: { url: screenshotUrl }, 
        caption: caption 
      }, { quoted: msg });

    } catch (e) {
      console.error('[ss error]:', e);
      return reply(`❌ Failed to capture screenshot: ${e.message}`);
    }
  }
};
