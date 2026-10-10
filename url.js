// Command: url (aliases: tourl, tourl)
// Converts provided Direct Media URLs into native WhatsApp Media Messages (Image/Video/Audio/Document)
module.exports = {
  name: 'url',
  aliases: ['tourl', 'tourl'],
  async execute(ctx) {
    const {
      socket, msg, sender, args, q, reply,
      sessionConfig, prefix, BOT_NAME_FANCY, NEWSLETTER_CONTEXT
    } = ctx;

    const botName = sessionConfig?.botName || BOT_NAME_FANCY;
    const PAIRING_SITE = 'https://miyora-mini.site';

    const channelContext = {
      forwardingScore: 1,
      isForwarded: true,
      forwardedNewsletterMessageInfo: {
        newsletterJid: NEWSLETTER_CONTEXT?.forwardedNewsletterMessageInfo?.newsletterJid || '',
        newsletterName: botName,
        serverMessageId: 999,
      }
    };

    if (!q) {
      return reply(
        `╭─┈〔 📥 *MEDIA URL CONVERTER* 〕┈─╮\n\n` +
        `> 📌 *Please provide a direct media URL!*\n\n` +
        `*Usage:* \`${prefix}url <direct_media_url>\`\n\n` +
        `*Examples:*\n` +
        `• \`${prefix}url https://example.com/image.jpg\`\n` +
        `• \`${prefix}url https://example.com/video.mp4\`\n` +
        `• \`${prefix}url https://example.com/audio.mp3\`\n\n` +
        `╭─────────────────╮\n` +
        `    🔗 *ᴘᴀɪʀɪɴɢ ꜱɪᴛᴇ* 🔗\n` +
        `╰─────────────────╯\n` +
        `    ➥ ${PAIRING_SITE}\n\n` +
        `> ɢᴏʟᴅᴇɴ ǫᴜᴇᴇɴ ᴍᴅ ᴘʀᴏ ✨ ʙʏ ᴠɪᴍ🇦\n\n` +
        `*${botName}* 🖤`
      );
    }

    const inputUrl = q.trim();

    if (!inputUrl.startsWith('http://') && !inputUrl.startsWith('https://')) {
      return reply(`⚠️ *Invalid URL format!* The URL must start with http:// or https://`);
    }

    try {
      await socket.sendMessage(sender, { react: { text: '⏳', key: msg.key } });

      const lowerUrl = inputUrl.toLowerCase();
      let messagePayload = {};

      // 1. Image Check (.jpg, .jpeg, .png, .webp, .gif)
      if (lowerUrl.match(/\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i) || lowerUrl.includes('image')) {
        messagePayload = {
          image: { url: inputUrl },
          caption: `🖼️ *Converted Image*\n\n🔗 *Pairing Site:* ${PAIRING_SITE}\n\n> ɢᴏʟᴅᴇɴ ǫᴜᴇᴇɴ ᴍᴅ ᴘʀᴏ ✨ ʙʏ ᴠɪᴍ🇦`,
          contextInfo: channelContext
        };
      }
      // 2. Video Check (.mp4, .mkv, .avi, .mov, .webm)
      else if (lowerUrl.match(/\.(mp4|mkv|avi|mov|webm)(\?.*)?$/i) || lowerUrl.includes('video')) {
        messagePayload = {
          video: { url: inputUrl },
          caption: `🎬 *Converted Video*\n\n🔗 *Pairing Site:* ${PAIRING_SITE}\n\n> ɢᴏʟᴅᴇɴ ǫᴜᴇᴇɴ ᴍᴅ ᴘʀᴏ ✨ ʙʏ ᴠɪᴍ🇦`,
          mimetype: 'video/mp4',
          contextInfo: channelContext
        };
      }
      // 3. Audio / Voice Note Check (.mp3, .ogg, .wav, .m4a, .aac)
      else if (lowerUrl.match(/\.(mp3|ogg|wav|m4a|aac)(\?.*)?$/i) || lowerUrl.includes('audio')) {
        messagePayload = {
          audio: { url: inputUrl },
          mimetype: 'audio/mp4',
          ptt: false,
          contextInfo: channelContext
        };
      }
      // 4. Fallback General Document Download
      else {
        const extractedFileName = inputUrl.split('/').pop().split('?')[0] || 'downloaded_media.bin';
        messagePayload = {
          document: { url: inputUrl },
          fileName: extractedFileName,
          mimetype: 'application/octet-stream',
          caption: `📁 *Converted Document*\n\n🔗 *Pairing Site:* ${PAIRING_SITE}\n\n> ɢᴏʟᴅᴇɴ ǫᴜᴇᴇɴ ᴍ提 ᴘʀᴏ ✨ ʙʏ ᴠɪᴍ🇦`,
          contextInfo: channelContext
        };
      }

      await socket.sendMessage(sender, { react: { text: '📥', key: msg.key } });

      // Send converted WhatsApp media message
      await socket.sendMessage(sender, messagePayload, { quoted: msg });

      await socket.sendMessage(sender, { react: { text: '✅', key: msg.key } });

    } catch (error) {
      console.error('URL Converter Error:', error);
      await socket.sendMessage(sender, { react: { text: '❌', key: msg.key } });
      return reply(`❌ *Failed to convert media from URL!*\n\n_Reason: ${error.message}_`);
    }
  }
};
