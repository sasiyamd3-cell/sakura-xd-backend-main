const axios = require('axios');

module.exports = {
  name: 'song',
  aliases: ['music', 'ytmp3', 'yt'],
  async execute(ctx) {
    const {
      socket, msg, sender, args, prefix,
      sessionConfig, BOT_NAME_FANCY, NEWSLETTER_CONTEXT, resolveReplyJid
    } = ctx;

    const botName = sessionConfig?.botName || BOT_NAME_FANCY || 'MIYORA-MD';
    const songQuery = args.join(" ").trim();

    if (!songQuery) {
      return await socket.sendMessage(sender, {
        text: `꒰ᵎ 🎵 *Song Downloader* ᵎ꒱

⚠️ Please provide a song name!

📌 *Usage:* ${prefix}song <song name>
📌 *Example:* ${prefix}song Manike Mage Hithe

  ˚₊‧꒰ა 🌸 ໒꒱‧₊˚
*${botName}* 🖤`
      }, { quoted: msg });
    }

    // 1. Searching React
    await socket.sendMessage(sender, { react: { text: '🔍', key: msg.key } }).catch(() => {});

    try {
      // 2. YouTube Search මඟින් සින්දුවේ URL එක ලබාගැනීම
      const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(songQuery + ' audio')}`;
      const searchRes = await axios.get(searchUrl);
      const match = searchRes.data.match(/var ytInitialData = ({.*?});<\/script>/);

      if (!match) throw new Error('Search failed');
      const json = JSON.parse(match[1]);
      const contents = json.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents;

      let videoId = null;
      let sTitle = songQuery;

      if (contents) {
        for (const c of contents) {
          const items = c.itemSectionRenderer?.contents;
          if (items) {
            for (const i of items) {
              if (i.videoRenderer) {
                videoId = i.videoRenderer.videoId;
                sTitle = i.videoRenderer.title?.runs?.[0]?.text || songQuery;
                break;
              }
            }
          }
          if (videoId) break;
        }
      }

      if (!videoId) throw new Error('Video ID not found');
      const targetYouTubeUrl = `https://www.youtube.com/watch?v=${videoId}`;

      // 3. Multi-Source Fallback Engine (කෙලින්ම බොට් එක ඇතුළෙන්ම ක්‍රියාත්මක වේ)
      let downloadUrl = null;
      const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

      // Method 1: SaveNow
      try {
        const res1 = await fetch('https://p.savenow.to/v1/convert', {
          method: 'POST',
          headers: { 'accept': '*/*', 'content-type': 'application/json', 'origin': 'https://en.savefrom.net', 'referer': 'https://en.savefrom.net/', 'user-agent': USER_AGENT },
          body: JSON.stringify({ url: targetYouTubeUrl })
        });
        const data1 = await res1.json();
        if (data1 && data1.url) {
          downloadUrl = data1.url;
          sTitle = data1.title || sTitle;
        }
      } catch (e1) {}

      // Method 2: CNV.cx Fallback
      if (!downloadUrl) {
        try {
          const res2 = await fetch('https://cnv.cx/v2/converter', {
            method: 'POST',
            headers: { 'accept': '*/*', 'content-type': 'application/x-www-form-urlencoded', 'origin': 'https://frame.y2meta-uk.com', 'referer': 'https://frame.y2meta-uk.com/', 'user-agent': USER_AGENT },
            body: new URLSearchParams({ 'link': targetYouTubeUrl, 'format': 'mp3', 'audioBitrate': '128', 'videoQuality': '720', 'filenameStyle': 'pretty', 'vCodec': 'h264' }).toString()
          });
          const data2 = await res2.json();
          if (data2 && data2.url) {
            downloadUrl = data2.url;
            sTitle = data2.filename || sTitle;
          }
        } catch (e2) {}
      }

      // Method 3: Cobalt Fallback
      if (!downloadUrl) {
        try {
          const res3 = await fetch('https://co.wuk.sh/api/json', {
            method: 'POST',
            headers: { 'accept': 'application/json', 'content-type': 'application/json', 'user-agent': 'Mozilla/5.0' },
            body: JSON.stringify({ url: targetYouTubeUrl, isAudioOnly: true, dubLang: false })
          });
          const data3 = await res3.json();
          if (data3 && data3.url) {
            downloadUrl = data3.url;
            sTitle = data3.filename || sTitle;
          }
        } catch (e3) {}
      }

      if (!downloadUrl) {
        throw new Error('All download backends failed');
      }

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

      // 4. Interactive Format Menu (1, 2 හෝ 3 තෝරාගැනීමට)
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

      // 5. User Reply එක (1, 2, හෝ 3) ලබා ගැනීම
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

      // 6. Direct Audio Buffer ලබා ගැනීම
      const audioBufferRes = await axios.get(downloadUrl, {
        responseType: 'arraybuffer',
        timeout: 90000,
        headers: { 'User-Agent': USER_AGENT }
      });

      const audioBuffer = Buffer.from(audioBufferRes.data);

      // 7. තෝරාගත් ආකෘතියට අනුව යැවීම
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

      await socket.sendMessage(sender, { react: { text: '🎵', key: msg.key } }).catch(() => {});

    } catch (e) {
      console.error('[song error]:', e.message);
      await socket.sendMessage(sender, {
        text: `꒰ᵎ ❌ *Error* ᵎ꒱\n\n⚠️ Failed to process song download!\n\n*${botName}* 🖤`
      }, { quoted: msg });
    }
  }
};
