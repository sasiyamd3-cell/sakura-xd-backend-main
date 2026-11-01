const axios = require('axios');

const VERCEL_API = 'https://song-api-2.vercel.app';

module.exports = {
  name: 'song',
  aliases: ['music', 'ytmp3', 'yt'],
  async execute(ctx) {
    const { socket, msg, sender, args, prefix, sessionConfig, BOT_NAME_FANCY, NEWSLETTER_CONTEXT } = ctx;
    const botName = sessionConfig?.botName || BOT_NAME_FANCY || 'NEXUS-MD';

    const query = args.join(" ").trim();
    if (!query) {
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
      // 2. Fetch Direct Audio Buffer from your new Vercel API
      const apiResp = await axios.get(`${VERCEL_API}/api/audio?q=${encodeURIComponent(query)}`, {
        responseType: 'arraybuffer',
        timeout: 90000,
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });

      const audioBuffer = Buffer.from(apiResp.data);
      const encodedTitle = apiResp.headers['x-song-title'];
      const songTitle = encodedTitle ? decodeURIComponent(encodedTitle) : query;

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

      // 3. Send Directly as MP3 Audio File
      await socket.sendMessage(sender, {
        audio: audioBuffer,
        mimetype: 'audio/mpeg',
        fileName: `${songTitle}.mp3`,
        ptt: false, // false නිසා මියුසික් ප්ලේයර් එකක ප්ලේ වෙන ඩිරෙක්ට් MP3 එකක් විදිහට යන්නේ
        contextInfo: nlCtx
      }, { quoted: msg });

      // Success React
      await socket.sendMessage(sender, { react: { text: '🎵', key: msg.key } }).catch(() => {});

    } catch (e) {
      console.error('[song error]:', e.message);
      await socket.sendMessage(sender, {
        text: `꒰ᵎ ❌ *Error* ᵎ꒱\n\n⚠️ Failed to download direct song from scraper API!\n\n*${botName}* 🖤`
      }, { quoted: msg });
    }
  }
};
