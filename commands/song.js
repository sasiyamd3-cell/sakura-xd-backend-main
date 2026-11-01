const axios = require('axios');
const crypto = require('crypto');
const osModule = require('os');
const path = require('path');
const fs = require('fs');

const VERCEL_API = 'https://song-api-3.vercel.app';

module.exports = {
  name: 'song',
  aliases: ['music', 'ytmp3', 'yt'],
  async execute(ctx) {
    const {
      socket, msg, sender, args, prefix,
      sessionConfig, BOT_NAME_FANCY, NEWSLETTER_CONTEXT, resolveReplyJid
    } = ctx;

    const botName = sessionConfig?.botName || BOT_NAME_FANCY || 'NEXUS-MD';
    const songQuery = args.join(" ").trim();

    if (!songQuery) {
      return await socket.sendMessage(sender, {
        text: `꒰ᵎ 🎵 *Song Downloader* ᵎ꒱

⚠️ Please provide a song name!

📌 *Usage:* ${prefix}song <song name>
📌 *Example:* ${prefix}song Manike Mage Hithe

　　˚₊‧꒰ა 🌸 ໒꒱‧₊˚
*${botName}* 🖤 | *𝐁ʟᴀᴄᴋ 𝐂ᴀᴛ 𝐎ꜰᴄ*`
      }, { quoted: msg });
    }

    // 1. Searching React
    await socket.sendMessage(sender, { react: { text: '🔍', key: msg.key } }).catch(() => {});

    try {
      // 2. Fetching from your new Vercel API
      const apiResp = await axios.get(`${VERCEL_API}/api/audio?q=${encodeURIComponent(songQuery)}`, {
        responseType: 'arraybuffer',
        timeout: 90000,
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });

      const audioBuffer = Buffer.from(apiResp.data);
      const encodedTitle = apiResp.headers['x-song-title'];
      const sTitle = encodedTitle ? decodeURIComponent(encodedTitle) : songQuery;

      await socket.sendMessage(sender, { react: { text: '📥', key: msg.key } }).catch(() => {});

      const nlCtx = {
        forwardingScore: 1,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: NEWSLETTER_CONTEXT.forwardedNewsletterMessageInfo.newsletterJid,
          newsletterName: botName,
          serverMessageId: 999,
        }
      };

      // Menu message asking for format (MP3, Voice Note, Document)
      const caption = `꒰ᵎ 🎵 *Song Downloader* ᵎ꒱

🎶 *Title* ➜ ${sTitle}

✨ *Select your format!*

　1️⃣ ➜ 🎵 MP3 File
　2️⃣ ➜ 🎤 Voice Message
　3️⃣ ➜ 📄 Document

　　˚₊‧꒰ა 🌸 ໒꒱‧₊˚
> 💬 *Reply 1, 2 or 3* 👆`;

      const sentMsg = await socket.sendMessage(sender, {
        text: caption,
        contextInfo: nlCtx
      }, { quoted: msg });

      await socket.sendMessage(sender, { react: { text: '✅', key: msg.key } }).catch(() => {});

      // 3. Collect User Choice (1, 2 or 3)
      const collected = await new Promise((resolve) => {
        const listener = ({ messages }) => {
          for (const m2 of messages) {
            const isReply = m2.message?.extendedTextMessage?.contextInfo?.stanzaId === sentMsg.key.id;
            const text = (m2.message?.conversation || m2.message?.extendedTextMessage?.text || '').trim();
            const isValid = ['1', '2', '3'].includes(text);
            const isSame = resolveReplyJid(m2) === sender;
            if (isReply && isValid && isSame) {
              clearTimeout(timeout);
              socket.ev.off('messages.upsert', listener);
              resolve(m2);
            }
          }
        };
        const timeout = setTimeout(() => {
          socket.ev.off('messages.upsert', listener);
          resolve(null);
        }, 60000);
        socket.ev.on('messages.upsert', listener);
      });

      if (!collected) {
        return await socket.sendMessage(sender, {
          text: `꒰ᵎ ⏰ *Time Out* ᵎ꒱\n\n⌛ 60 seconds expired! Please use *${prefix}song* again 🌸\n\n*${botName}* 🖤`
        }, { quoted: sentMsg });
      }

      const choice = (collected.message?.conversation || collected.message?.extendedTextMessage?.text || '').trim();

      // 4. Send according to chosen format
      if (choice === '1') {
        // Direct MP3 Audio File
        await socket.sendMessage(sender, {
          audio: audioBuffer,
          mimetype: 'audio/mpeg',
          fileName: `${sTitle}.mp3`,
          ptt: false,
          contextInfo: nlCtx
        }, { quoted: collected });

      } else if (choice === '2') {
        // Voice Message (PTT)
        await socket.sendMessage(sender, {
          audio: audioBuffer,
          mimetype: 'audio/ogg; codecs=opus',
          ptt: true,
          contextInfo: nlCtx
        }, { quoted: collected });

      } else if (choice === '3') {
        // Document File
        await socket.sendMessage(sender, {
          document: audioBuffer,
          mimetype: 'audio/mpeg',
          fileName: `${sTitle}.mp3`,
          contextInfo: nlCtx
        }, { quoted: collected });
      }

      await socket.sendMessage(sender, { react: { text: '🎵', key: msg.key } }).catch(() => {});

    } catch (e) {
      console.error('[song error]:', e.message);
      await socket.sendMessage(sender, {
        text: `꒰ᵎ ❌ *Error* ᵎ꒱\n\n⚠️ Failed to fetch song from API!\n\n*${botName}* 🖤`
      }, { quoted: msg });
    }
  }
};
