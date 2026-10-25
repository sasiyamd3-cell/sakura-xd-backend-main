
module.exports = {
  name: 'pair',
  aliases: ['pairing', 'getpair'],

  async execute(ctx) {
    const {
      socket, msg, sender, from, args, q, reply,
      prefix, BOT_NAME_FANCY
    } = ctx;

    const axios = require('axios');

    const botName = BOT_NAME_FANCY || '🌸 MIYORA MD';

    // Your existing website's Heroku backend URL
    const API_URL = process.env.PAIRING_API_URL;

    const number = String(
      (Array.isArray(args) ? args.join(' ') : args) || q || ''
    ).replace(/\D/g, '');

    const footer =
      `\n\n˚₊‧꒰ა 🌸 ໒꒱‧₊˚\n*${botName}*`;

    if (!number || number.length < 7 || number.length > 15) {
      return reply(
        `꒰ᵎ 📱 *MIYORA PAIRING* ᵎ꒱\n\n` +
        `📌 *Usage:* ${prefix}pair 94771234567\n` +
        `⚠️ Enter a valid number with country code.` +
        footer
      );
    }

    if (!API_URL) {
      return reply(
        `❌ PAIRING_API_URL is missing from Heroku Config Vars.` +
        footer
      );
    }

    await socket.sendMessage(from, {
      react: { text: '🔍', key: msg.key }
    }).catch(() => {});

    try {
      // Same endpoint and query parameter as the website.
      const endpoint = new URL(
        '/code',
        API_URL.replace(/\/+$/, '') + '/'
      );

      endpoint.searchParams.set('number', number);

      const response = await axios.get(endpoint.toString(), {
        timeout: 20000,
        headers: { Accept: 'application/json' }
      });

      const data = response.data;

      if (data?.error) {
        return reply(
          `꒰ᵎ ❌ *PAIRING FAILED* ᵎ꒱\n\n` +
          `${String(data.error).slice(0, 250)}` +
          footer
        );
      }

      if (data?.status === 'already_connected') {
        return reply(
          `꒰ᵎ ✅ *ALREADY CONNECTED* ᵎ꒱\n\n` +
          `${data.message || 'This number is already connected.'}` +
          footer
        );
      }

      if (!data?.code) {
        return reply(
          `❌ No pairing code returned by the existing API.` +
          footer
        );
      }

      await socket.sendMessage(from, {
        react: { text: '✅', key: msg.key }
      }).catch(() => {});

      return reply(
        `╭━━〔 🌸 *MIYORA MD* 〕━━╮\n` +
        `┃\n` +
        `┃ 🎉 *PAIRING CODE READY!*\n` +
        `┃ 📱 Number: ${number}\n` +
        `┃ 🔐 Code: \`${data.code}\`\n` +
        `┃\n` +
        `╰━━━━━━━━━━━━━━━━╯\n\n` +
        `📲 *How to link:*\n` +
        `1. Open WhatsApp on the target phone.\n` +
        `2. Settings → Linked Devices.\n` +
        `3. Link a Device.\n` +
        `4. Link with phone number instead.\n` +
        `5. Enter the code above.\n\n` +
        `⚠️ Only link accounts you own or are authorized to manage.` +
        footer
      );

    } catch (error) {
      console.error(
        '[MIYORA PAIR API]',
        error.response?.status || error.message
      );

      return reply(
        `꒰ᵎ ❌ *PAIRING API ERROR* ᵎ꒱\n\n` +
        `Could not contact the existing pairing API.\n` +
        `Check the backend URL and Heroku logs.` +
        footer
      );
    }
  }
};
