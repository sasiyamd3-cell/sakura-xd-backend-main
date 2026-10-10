// Command: url (aliases: tourl, media, sendurl)
// Auto-extracted from sakura.js switch-case. Converts quoted or direct media URLs into native WhatsApp messages.
module.exports = {
  name: 'url',
  aliases: ['tourl', 'media', 'sendurl'],
  async execute(ctx) {
    const {
      socket, msg, sender, from, command, args, q, reply,
      sessionConfig, number, prefix, config, BOT_NAME_FANCY,
      NEWSLETTER_CONTEXT, resolveReplyJid, downloadQuotedMedia,
      getSriLankaTimestamp, formatMessage, fs, path, os
    } = ctx;

      const sanitized = (number || '').replace(/[^0-9]/g, '');
      const cfg = sessionConfig; 
      const botName = cfg.botName || BOT_NAME_FANCY;

      const channelContext = {
        forwardingScore: 1,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: NEWSLETTER_CONTEXT.forwardedNewsletterMessageInfo.newsletterJid,
          newsletterName: botName,
          serverMessageId: 999,
        }
      };

      // මැසේජ් එකක් ක්වොට් කරලා (Reply) ඇද්ද බැලීම හෝ text එකෙන් ලින්ක් එක දාලා ඇද්ද බැලීම
      let targetUrl = q.trim();
      const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      
      if (!targetUrl && quoted) {
        // Quoted message එකේ කොන්වර්ෂන් හෝ ටෙක්ස්ට් එකෙන් ලින්ක් එකක් තියෙනවද බලනවා
        const quotedText = quoted.conversation || quoted.extendedTextMessage?.text || '';
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const matches = quotedText.match(urlRegex);
        if (matches && matches.length > 0) {
          targetUrl = matches[0];
        }
      }

      if (!targetUrl) {
        return reply(`꒰ᵎ 📥 *URL Converter* ᵎ꒱

    ⚠️ Please provide a direct media URL or reply to a message containing a URL!

    📌 *Usage:* ${prefix}url <direct_url>
    📌 *Or reply to a message with* ${prefix}url

    　　˚₊‧꒰ა 🌸 ໒꒱‧₊˚
    *${botName}* 🖤 | *𝐁ʟᴀᴄᴋ 𝐂ᴀᴛ 𝐎ꜰᴄ*`);
      }

      if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
        return reply(`꒰ᵎ ❌ *Error* ᵎ꒱

    ⚠️ Invalid URL format! Must start with http:// or https://

    　　˚₊‧꒰ა 🌸 ໒꒱‧₊˚
    *${botName}* 🖤 | *𝐁ʟᴀᴄᴋ 𝐂ᴀᴛ 𝐎ꜰᴄ*`);
      }

      await socket.sendMessage(sender, {
        react: { text: '⏳', key: msg.key }
      });

      try {
        const lowerUrl = targetUrl.toLowerCase();
        let messagePayload = {};

        // 1. Image Check (.jpg, .jpeg, .png, .webp, .gif)
        if (lowerUrl.match(/\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i) || lowerUrl.includes('image')) {
          messagePayload = {
            image: { url: targetUrl },
            caption: `꒰ᵎ 🖼️ *Converted Image* ᵎ꒱\n\n🔗 *URL* ➜ ${targetUrl}\n\n　　˚₊‧꒰ა 🌸 ໒꒱‧₊˚\n*${botName}* 🖤 | *𝐁ʟᴀᴄᴋ 𝐂ᴀᴛ 𝐎ꜰᴄ*`,
            contextInfo: channelContext
          };
        }
        // 2. Video Check (.mp4, .mkv, .avi, .mov, .webm)
        else if (lowerUrl.match(/\.(mp4|mkv|avi|mov|webm)(\?.*)?$/i) || lowerUrl.includes('video')) {
          messagePayload = {
            video: { url: targetUrl },
            caption: `꒰ᵎ 🎬 *Converted Video* ᵎ꒱\n\n🔗 *URL* ➜ ${targetUrl}\n\n　　˚₊‧꒰ა 🌸 ໒꒱‧₊˚\n*${botName}* 🖤 | *𝐁ʟᴀᴄᴋ 𝐂ᴀᴛ 𝐎ꜰᴄ*`,
            mimetype: 'video/mp4',
            contextInfo: channelContext
          };
        }
        // 3. Audio / Voice Check (.mp3, .ogg, .wav, .m4a, .aac)
        else if (lowerUrl.match(/\.(mp3|ogg|wav|m4a|aac)(\?.*)?$/i) || lowerUrl.includes('audio')) {
          messagePayload = {
            audio: { url: targetUrl },
            mimetype: 'audio/mp4',
            ptt: false,
            contextInfo: channelContext
          };
        }
        // 4. Fallback Document File
        else {
          const fileName = targetUrl.split('/').pop().split('?')[0] || 'downloaded_file.bin';
          messagePayload = {
            document: { url: targetUrl },
            fileName: fileName,
            mimetype: 'application/octet-stream',
            caption: `꒰ᵎ 📁 *Converted Document* ᵎ꒱\n\n🔗 *URL* ➜ ${targetUrl}\n\n　　˚₊‧꒰ა 🌸 ໒꒱‧₊˚\n*${botName}* 🖤 | *𝐁ʟᴀᴄᴋ 𝐂ᴀᴛ 𝐎ꜰᴄ*`,
            contextInfo: channelContext
          };
        }

        await socket.sendMessage(sender, {
          react: { text: '📥', key: msg.key }
        });

        // WhatsApp වෙත මීඩියා පේලෝඩ් එක යැවීම
        await socket.sendMessage(sender, messagePayload, { quoted: msg });

        await socket.sendMessage(sender, {
          react: { text: '✅', key: msg.key }
        });

      } catch (error) {
        console.error('[url] Error:', error.message);
        await socket.sendMessage(sender, {
          react: { text: '❌', key: msg.key }
        });
        return reply(`꒰ᵎ ❌ *Error* ᵎ꒱\n\n⚠️ Failed to process media URL!\n\n_Reason: ${error.message}_\n\n*${botName}* 🖤`);
      }

  }
};
