const axios = require('axios');
const https = require('https');

// SSL certificate verification හරස් නොවීම සඳහා Agent එකක් සකස් කිරීම
const agent = new https.Agent({  
  rejectUnauthorized: false
});

// එකම chat එකේ active tempmail ලැයිස්තුව තබාගැනීමට Map එකක්
const activeMails = new Map();

module.exports = {
  name: 'tempmail',
  aliases: ['tmpmail', 'checkmail', 'inbox'],
  async execute(ctx) {
    const { socket, msg, sender, prefix, args, reply, BOT_NAME_FANCY } = ctx;
    const commandUsed = ctx.command || 'tempmail';
    const botName = BOT_NAME_FANCY || 'Black Cat';

    try {
      // යූසර් .checkmail හෝ .inbox කියලා ගැහුවොත් ඉන්බොක්ස් එක චෙක් කරයි
      if (['checkmail', 'inbox', 'tmpinbox'].includes(commandUsed) || args[0] === 'inbox' || args[0] === 'check') {
        const userMailData = activeMails.get(sender);
        if (!userMailData) {
          return reply(`❌ You don't have an active temporary email! Type *${prefix}tempmail* first to generate one.`);
        }

        const { email, user, domain } = userMailData;
        const inboxUrl = `https://www.1secmail.com/api/v1/?action=getMessages&login=${user}&domain=${domain}`;
        const inboxRes = await axios.get(inboxUrl, { httpsAgent: agent });
        const messages = inboxRes.data;

        if (!messages || messages.length === 0) {
          return reply(`📥 *Inbox for:* \`${email}\`\n\n📭 Your inbox is currently empty. No incoming messages/OTPs yet!`);
        }

        let inboxText = `📥 *INBOX MESSAGES (${messages.length})*\n📧 *Email:* \`${email}\`\n\n`;

        for (let i = 0; i < messages.length; i++) {
          const msgItem = messages[i];
          const msgUrl = `https://www.1secmail.com/api/v1/?action=readMessage&login=${user}&domain=${domain}&id=${msgItem.id}`;
          const msgDetailRes = await axios.get(msgUrl, { httpsAgent: agent });
          const detail = msgDetailRes.data;

          inboxText += `📌 *Message #${i + 1}*\n`;
          inboxText += `👤 *From:* ${msgItem.from}\n`;
          inboxText += `📝 *Subject:* ${msgItem.subject}\n`;
          inboxText += `💬 *Text:* ${detail.text || detail.body || 'No text content'}\n\n` + '-------------------\n';
        }

        return reply(inboxText);
      }

      // නව ඊමේල් එකක් ජනාවාස කිරීම (.tempmail)
      const domainsResponse = await axios.get('https://www.1secmail.com/api/v1/?action=getDomainList', { httpsAgent: agent });
      const domains = domainsResponse.data;
      if (!domains || domains.length === 0) {
        return reply('❌ Tempmail service is currently unavailable. Try again later!');
      }

      const randomDomain = domains[Math.floor(Math.random() * domains.length)];
      const randomUser = 'cat' + Math.random().toString(36).substring(2, 8);
      const email = `${randomUser}@${randomDomain}`;

      // සේව් කරගැනීම
      activeMails.set(sender, { email, user: randomUser, domain: randomDomain });

      const caption = 
        `🌸⃝⃘̉̉̉̉̉̉🧚‍♀️ *TEMPORARY BURNER EMAIL* 🧚‍♀️🌸⃝⃘̉̉̉̉̉̉\n\n` +
        `> 💌 *Your secure burner email is ready!*\n\n` +
        `📧 *Email:* \`${email}\`\n\n` +
        `📌 *How to check inbox:*\n` +
        `Type \`${prefix}checkmail\` or \`${prefix}inbox\` to fetch incoming OTPs and messages!\n\n` +
        `🧚‍♀️ *©ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝐁ʟᴀᴄᴋ 𝐂ᴀᴛ 𝐎ꜰᴄ*\n\n` +
        `*${botName}* 🖤 | *𝐁ʟᴀᴄᴋ 𝐂ᴀᴛ 𝐎ꜰᴄ*`;

      await socket.sendMessage(sender, { text: caption }, { quoted: msg });

    } catch (e) {
      console.error('[tempmail error]:', e);
      return reply(`❌ Failed to process tempmail: ${e.message}`);
    }
  }
};
