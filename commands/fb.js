// Command: fb (aliases: fbdl, facebook, fbd)
module.exports = {
  name: 'fb',
  aliases: ['fbdl', 'facebook', 'fbd'],
  async execute(ctx) {
    const {
      socket, msg, sender, from, command, args, q, reply,
      sessionConfig, number, prefix, config, BOT_NAME_FANCY,
      NEWSLETTER_CONTEXT, resolveReplyJid, downloadQuotedMedia,
      getSriLankaTimestamp, formatMessage, fs, path, os
    } = ctx;

      const axios = require('axios');

      const sanitized = (number || '').replace(/[^0-9]/g, '');
      const cfg = sessionConfig; 
      const botName = cfg?.botName || BOT_NAME_FANCY || 'MIYORA-MD';

      const url = args[0] || q;
      if (!url) {
        return reply(`꒰ᵎ 🎬 *FB Downloader* ᵎ꒱

    ⚠️ Please provide a Facebook link!

    📌 *Usage:* ${prefix}fb <url>
    📌 *Example:* ${prefix}fb https://www.facebook.com/watch?v=xxx

    　　˚₊‧꒰ა 🌸 ໒꒱‧₊˚
    *${botName}* 🖤 | *𝐁ʟᴀᴄᴋ 𝐂ᴀᴛ 𝐎ꜰᴄ*`);
      }

      if (!url.includes('facebook.com') && !url.includes('fb.watch')) {
        return reply(`꒰ᵎ 🎬 *FB Downloader* ᵎ꒱

    ❌ Please provide a valid Facebook link!

    　　˚₊‧꒰ა 🌸 ໒꒱‧₊˚
    *${botName}* 🖤 | *𝐁ʟᴀᴄᴋ 𝐂ᴀᴛ 𝐎ꜰᴄ*`);
      }

      await socket.sendMessage(sender, {
        react: { text: '⏳', key: msg.key }
      }).catch(() => {});

      try {
        // 1. SupunOFC API එකට රික්වෙස්ට් එක යැවීම
        const apiKey = 'supun_201a6aed9c5fe527e4912294630e7235';
        const apiUrl = `https://supunofc.site/api/download/facebook/dl?url=${encodeURIComponent(url)}&apikey=${apiKey}`;

        const { data } = await axios.get(apiUrl, { timeout: 25000 });

        if (!data || data.success !== true || !data.result) {
          throw new Error(data?.message || 'Failed to fetch video from API!');
        }

        const res = data.result;
        const title = res.title || 'Facebook Video';
        const thumbnail = res.thumbnail || cfg?.logo || config?.IMAGE_PATH || 'https://i.ibb.co/3134J4y/placeholder.jpg';
        
        // SD සහ HD ලින්ක්ස් ලබා ගැනීම (API එකේ එන ස්ට්‍රක්චර් එක අනුව)
        const sdLink = res.sd || res.sd_link || res.normalQualityLink;
        const hdLink = res.hd || res.hd_link || res.hdQualityLink || sdLink;

        if (!sdLink && !hdLink) {
          throw new Error('No download links found in API response!');
        }

        const caption = `꒰ᵎ 🎬 *FB Downloader* ᵎ꒱

    🎥 *Title* ➜ ${title}

    ✨ *Select your quality!*

    　1️⃣ ➜ SD Quality 📱
    　2️⃣ ➜ HD Quality 🎯

    　　˚₊‧꒰ა 🌸 ໒꒱‧₊˚
    > 💬 *Reply 1 or 2* 👆`;

        const sentMsg = await socket.sendMessage(sender, {
          image: { url: thumbnail },
          caption: caption,
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

        // 2. යූසර්ගේ රිප්ලයි එක (1 හෝ 2) ලබා ගැනීම
        const collected = await new Promise((resolve) => {
          const listener = ({ messages }) => {
            for (const m2 of messages) {
              const isReply = m2.message?.extendedTextMessage?.contextInfo?.stanzaId === sentMsg.key.id;
              const text = (m2.message?.conversation || m2.message?.extendedTextMessage?.text || '').trim();
              const isValid = ['1', '2'].includes(text);
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
          return socket.sendMessage(sender, {
            text: `꒰ᵎ ⏰ *Time Out* ᵎ꒱

    ⌛ 60 seconds expired!

    > Please use *${prefix}fb* command again 🌸

    　　˚₊‧꒰ა 🌸 ໒꒱‧₊˚
    *${botName}* 🖤 | *𝐁ʟᴀᴄᴋ 𝐂ᴀᴛ 𝐎ꜰᴄ*`
          }, { quoted: sentMsg });
        }

        const choice = (collected.message?.conversation || collected.message?.extendedTextMessage?.text || '').trim();
        const downloadLink = choice === '2' ? hdLink : sdLink;
        const qualityLabel = choice === '2' ? 'HD 🎯' : 'SD 📱';

        await socket.sendMessage(sender, {
          text: `꒰ᵎ 📥 *Downloading* ᵎ꒱

    ⏳ Downloading *${qualityLabel}* video...
    🎥 *${title}*

    　　˚₊‧꒰ა 🌸 ໒꒱‧₊˚`
        }, { quoted: collected });

        // 3. වීඩියෝව යැවීම
        await socket.sendMessage(sender, {
          video: { url: downloadLink },
          caption: `꒰ᵎ 🎬 *FB Downloader* ᵎ꒱

    ✅ *Download Complete!*

    🎥 *Title* ➜ ${title}
    📊 *Quality* ➜ ${qualityLabel}

    　　˚₊‧꒰ა 🌸 ໒꒱‧₊˚
    *${botName}* 🖤 | *𝐁ʟᴀᴄᴋ 𝐂ᴀᴛ 𝐎ꜰᴄ*`,
          contextInfo: {
            forwardingScore: 1,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
              newsletterJid: NEWSLETTER_CONTEXT.forwardedNewsletterMessageInfo.newsletterJid,
              newsletterName: botName,
              serverMessageId: 999,
            }
          }
        }, { quoted: collected });

        await socket.sendMessage(sender, {
          react: { text: '🎬', key: msg.key }
        }).catch(() => {});

      } catch (e) {
        console.error('[FB Downloader Error]:', e.message);
        await socket.sendMessage(sender, {
          text: `꒰ᵎ ❌ *Error* ᵎ꒱\n\n⚠️ Failed to download Facebook video!\n*Reason:* ${e.message}\n\n*${botName}* 🖤 | *𝐁ʟᴀᴄᴋ 𝐂ᴀᴛ 𝐎ꜰᴄ*`
        }, { quoted: msg });
      }
  }
};
