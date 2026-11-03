const axios = require('axios');

module.exports = {
  name: 'movie',
  aliases: ['cine', 'cinesubz', 'film', 'video'],
  async execute(ctx) {
    const { socket, msg, sender, args, sessionConfig, BOT_NAME_FANCY, NEWSLETTER_CONTEXT } = ctx;

    const botName = sessionConfig?.botName || BOT_NAME_FANCY || 'MIYORA-MD';
    const query = args.join(" ").trim();

    if (!query) {
      return await socket.sendMessage(sender, {
        text: `꒰ᵎ 🎬 *Movie & MP4 Downloader* ᵎ꒱

⚠️ Please provide a movie or video name!

📌 *Usage:* .movie <name>
📌 *Example:* .movie Avatar 2 trailer

　　˚₊‧꒰ა 🌸 ໒꒱‧₊˚
*${botName}* 🖤`
      }, { quoted: msg });
    }

    // 1. සර්ච් වෙනකොට පේන්න රියැක්ට් එකක් දැමීම
    await socket.sendMessage(sender, { react: { text: '🔍', key: msg.key } }).catch(() => {});

    try {
      // 2. YouTube හෝ නිදහස් සෝස් එකකින් අදාළ වීඩියෝව සෙවුම් කර MP4 ලින්ක් එක ලබා ගැනීම
      const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query + ' trailer mp4')}`;
      const searchRes = await axios.get(searchUrl);
      const match = searchRes.data.match(/var ytInitialData = ({.*?});<\/script>/);

      if (!match) throw new Error('Search failed');
      const json = JSON.parse(match[1]);
      const contents = json.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents;

      let videoId = null;
      let mTitle = query;

      if (contents) {
        for (const c of contents) {
          const items = c.itemSectionRenderer?.contents;
          if (items) {
            for (const i of items) {
              if (i.videoRenderer) {
                videoId = i.videoRenderer.videoId;
                mTitle = i.videoRenderer.title?.runs?.[0]?.text || query;
                break;
              }
            }
          }
          if (videoId) break;
        }
      }

      if (!videoId) throw new Error('Video not found');
      const targetYouTubeUrl = `https://www.youtube.com/watch?v=${videoId}`;

      await socket.sendMessage(sender, { react: { text: '📥', key: msg.key } }).catch(() => {});

      // 3. Cobalt API මඟින් ඩිරෙක්ට් MP4 ඩවුන්ලෝඩ් ලින්ක් එක ලබා ගැනීම
      let downloadUrl = null;
      try {
        const cobaltRes = await axios.post('https://co.wuk.sh/api/json', {
          url: targetYouTubeUrl,
          isAudioOnly: false,
          videoQuality: '720'
        }, {
          headers: { 'accept': 'application/json', 'content-type': 'application/json' }
        });

        if (cobaltRes.data && cobaltRes.data.url) {
          downloadUrl = cobaltRes.data.url;
        }
      } catch (err) {
        console.log('Cobalt fallback failed...');
      }

      if (!downloadUrl) {
        throw new Error('Failed to get MP4 download link');
      }

      // 4. MP4 වීඩියෝ බෆර් එක ඩවුන්ලෝඩ් කරගැනීම
      const videoBufferRes = await axios.get(downloadUrl, {
        responseType: 'arraybuffer',
        timeout: 90000,
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });

      const videoBuffer = Buffer.from(videoBufferRes.data);

      const nlCtx = {
        forwardingScore: 1,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: NEWSLETTER_CONTEXT.forwardedNewsletterMessageInfo.newsletterJid,
          newsletterName: botName,
          serverMessageId: 999,
        }
      };

      // 5. WhatsApp එකට ඩිරෙක්ට් MP4 වීඩියෝ ෆයිල් එක යැවීම
      await socket.sendMessage(sender, {
        video: videoBuffer,
        mimetype: 'video/mp4',
        caption: `꒰ᵎ 🎬 *Movie / Video Hub* ᵎ꒱\n\n✨ *Title:* ${mTitle}\n\n　　˚₊‧꒰ა 🌸 ໒꒱‧₊˚\n> *${botName}* 🖤`,
        contextInfo: nlCtx
      }, { quoted: msg });

      await socket.sendMessage(sender, { react: { text: '✅', key: msg.key } }).catch(() => {});

    } catch (e) {
      console.error('[movie mp4 error]:', e.message);
      await socket.sendMessage(sender, {
        text: `꒰ᵎ ❌ *Error* ᵎ꒱\n\n⚠️ Failed to download MP4 video!\n\n*${botName}* 🖤`
      }, { quoted: msg });
    }
  }
};
