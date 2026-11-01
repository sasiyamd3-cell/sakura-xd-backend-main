// Command: song (aliases: music, ytmp3, yt)
const yts = require('yt-search');
const axios = require('axios');
const path = require('path');
const osModule = require('os');
const fs = require('fs');
const crypto = require('crypto');

module.exports = {
  name: 'song',
  aliases: ['music', 'ytmp3', 'yt'],
  async execute(ctx) {
    const {
      socket, msg, sender, args, prefix,
      sessionConfig, BOT_NAME_FANCY, NEWSLETTER_CONTEXT, resolveReplyJid
    } = ctx;

    const cfg = sessionConfig || {};
    const botName = cfg.botName || BOT_NAME_FANCY || 'NEXUS-MD';

    const songQuery = args.join(" ").trim();

    if (!songQuery) {
      return await socket.sendMessage(sender, {
        text: `꒰ᵎ 🎵 *Song Downloader* ᵎ꒱

⚠️ Please provide a song name or YouTube link!

📌 *Usage:* ${prefix}song <song name>
📌 *Example:* ${prefix}song Manike Mage Hithe

　　˚₊‧꒰ა 🌸 ໒꒱‧₊˚
*${botName}* 🖤 | *𝐁ʟᴀᴄᴋ 𝐂ᴀᴛ 𝐎ꜰᴄ*`
      }, { quoted: msg });
    }

    await socket.sendMessage(sender, {
      react: { text: '🔍', key: msg.key }
    }).catch(() => {});

    try {
      const search = await yts(songQuery);
      if (!search?.videos?.length) {
        return await socket.sendMessage(sender, {
          text: `꒰ᵎ 🎵 *Song Downloader* ᵎ꒱

❌ No results found for *${songQuery}*!

　　˚₊‧꒰ა 🌸 ໒꒱‧₊˚
*${botName}* 🖤 | *𝐁ʟᴀᴄᴋ 𝐂ᴀᴛ 𝐎ꜰᴄ*`
        }, { quoted: msg });
      }

      const video = search.videos[0];
      const sUrl = video.url;
      const sTitle = video.title || 'Song';
      const thumbUrl = video.thumbnail;
      const duration = video.timestamp || 'N/A';
      const views = video.views?.toLocaleString() || 'N/A';

      // Multi-API Fallback Strategy (එකක් ෆේල් වුණොත් අනිත් එකට ට්‍රයි කරයි)
      let sDownloadUrl = null;
      const apis = [
        async () => {
          const res = await axios.get(`https://api.vreden.web.id/api/ytmp3?url=${encodeURIComponent(sUrl)}`, { timeout: 15000 });
          return res.data?.result?.download?.url || res.data?.result?.url;
        },
        async () => {
          const res = await axios.get(`https://delirius-apii-oficial.vercel.app/download/ytmp3?url=${encodeURIComponent(sUrl)}`, { timeout: 15000 });
          return res.data?.data?.download?.url;
        },
        async () => {
          const res = await axios.get(`https://api.siputzx.my.id/api/s/youtube?query=${encodeURIComponent(sUrl)}`, { timeout: 15000 });
          return res.data?.data?.audio;
        },
        async () => {
          const res = await axios.get(`https://widipe.com/download/ytmp3?url=${encodeURIComponent(sUrl)}`, { timeout: 15000 });
          return res.data?.result?.audio || res.data?.result?.download?.url;
        }
      ];

      for (const apiFn of apis) {
        try {
          sDownloadUrl = await apiFn();
          if (sDownloadUrl) break;
        } catch (err) {
          continue; // Try next API
        }
      }

      if (!sDownloadUrl) {
        return await socket.sendMessage(sender, {
          text: `꒰ᵎ 🎵 *Song Downloader* ᵎ꒱

❌ Download failed! All audio APIs are currently down. Please try again later.

　　˚₊‧꒰ა 🌸 ໒꒱‧₊˚
*${botName}* 🖤 | *𝐁ʟᴀᴄᴋ 𝐂ᴀᴛ 𝐎ꜰᴄ*`
        }, { quoted: msg });
      }

      const caption = `꒰ᵎ 🎵 *Song Downloader* ᵎ꒱

🎶 *Title* ➜ ${sTitle}
⏱️ *Duration* ➜ ${duration}
👁️ *Views* ➜ ${views}
🔗 *URL* ➜ ${sUrl}

✨ *Select your format!*

　1️⃣ ➜ 🎵 MP3 File
　2️⃣ ➜ 🎤 Voice Message (PTT)
　3️⃣ ➜ 📄 Document

　　˚₊‧꒰ა 🌸 ໒꒱‧₊˚
> 💬 *Reply 1, 2 or 3* 👆`;

      const sentMsg = await socket.sendMessage(sender, {
        image: { url: thumbUrl },
        caption,
        contextInfo: {
          forwardingScore: 1,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: NEWSLETTER_CONTEXT.forwardedNewsletterMessageInfo.newsletterJid,
            newsletterName: botName,
            serverMessageId: 999,
          }
        }
      }, { quoted: msg });

      await socket.sendMessage(sender, {
        react: { text: '✅', key: msg.key }
      }).catch(() => {});

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
          text: `꒰ᵎ ⏰ *Time Out* ᵎ꒱\n\n⌛ 60 seconds expired!\nPlease use *${prefix}song* command again 🌸\n\n*${botName}* 🖤`
        }, { quoted: sentMsg });
      }

      const choice = (collected.message?.conversation || collected.message?.extendedTextMessage?.text || '').trim();
      const formatLabel = choice === '1' ? 'MP3 Audio 🎵' : choice === '2' ? 'Voice Message 🎤' : 'Document 📄';

      await socket.sendMessage(sender, {
        text: `꒰ᵎ 📥 *Downloading* ᵎ꒱\n\n⏳ Processing *${formatLabel}*...\n🎶 *${sTitle}*\n\n*${botName}* 🖤`
      }, { quoted: collected });

      const dlResp = await axios.get(sDownloadUrl, {
        responseType: 'arraybuffer',
        timeout: 120000,
        headers: { 'User-Agent': 'Mozilla/5.0' }
      }).catch(() => null);

      if (!dlResp?.data) {
        return await socket.sendMessage(sender, {
          text: `꒰ᵎ ❌ *Error* ᵎ꒱\n\n⚠️ Failed to download audio stream!\n\n*${botName}* 🖤`
        }, { quoted: collected });
      }

      const audioBuffer = Buffer.from(dlResp.data);

      const nlCtx = {
        forwardingScore: 1,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: NEWSLETTER_CONTEXT.forwardedNewsletterMessageInfo.newsletterJid,
          newsletterName: botName,
          serverMessageId: 999,
        }
      };

      if (choice === '1') {
        await socket.sendMessage(sender, {
          audio: audioBuffer,
          mimetype: 'audio/mpeg',
          fileName: `${sTitle}.mp3`,
          ptt: false,
          contextInfo: nlCtx
        }, { quoted: collected });

      } else if (choice === '2') {
        await socket.sendMessage(sender, {
          audio: audioBuffer,
          mimetype: 'audio/ogg; codecs=opus',
          ptt: true,
          contextInfo: nlCtx
        }, { quoted: collected });

      } else if (choice === '3') {
        await socket.sendMessage(sender, {
          document: audioBuffer,
          mimetype: 'audio/mpeg',
          fileName: `${sTitle}.mp3`,
          contextInfo: nlCtx
        }, { quoted: collected });
      }

      await socket.sendMessage(sender, {
        react: { text: '🎵', key: msg.key }
      }).catch(() => {});

    } catch (e) {
      console.error('[song command error]:', e.message || e);
      await socket.sendMessage(sender, {
        text: `꒰ᵎ ❌ *Error* ᵎ꒱\n\n⚠️ Failed to process song command!\n\n*${botName}* 🖤`
      }, { quoted: msg });
    }
  }
};
