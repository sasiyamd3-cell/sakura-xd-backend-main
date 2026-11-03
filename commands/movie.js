const axios = require('axios');

// SupunOFC API Key එක
const API_KEY = 'supun_55997eba6e54705892b878304809e52d';

module.exports = {
  name: 'movie',
  aliases: ['cine', 'film', 'baiscope'],
  async execute(ctx) {
    const { socket, msg, sender, args, sessionConfig, BOT_NAME_FANCY, NEWSLETTER_CONTEXT } = ctx;

    const botName = sessionConfig?.botName || BOT_NAME_FANCY || 'MIYORA-MD';
    const query = args.join(" ").trim();

    if (!query) {
      return await socket.sendMessage(sender, {
        text: `꒰ᵎ 🎬 *Movie Downloader* ᵎ꒱

⚠️ Please provide a movie name!

📌 *Usage:* .movie <movie name>
📌 *Example:* .movie Leo

　　˚₊‧꒰ა 🌸 ໒꒱‧₊˚
*${botName}* 🖤 | *𝐁ʟᴀᴄᴋ 𝐂ᴀᴛ 𝐎ꜰᴄ*`
      }, { quoted: msg });
    }

    // 1. සර්ච් වෙනකොට පේන්න රියැක්ට් එකක් දැමීම
    await socket.sendMessage(sender, {
      react: { text: '🔍', key: msg.key }
    }).catch(() => {});

    try {
      // 2. Baiscopes සයිට් එකෙන් හෝ API එක හරහා මූවි එක සෙවුම් කර ලින්ක් එක ලබා ගැනීම
      // මෙතැනදී යූසර් දෙන නම අනුව බයිස්කෝප් සර්ච් යූටීඑල් එක හැදේ
      const searchWebUrl = `https://baiscopes.lk/?s=${encodeURIComponent(query)}`;
      
      // අපි SupunOFC API එක පාවිච්චි කරලා සර්ච් හෝ ඩිරෙක්ට් ඩවුන්ලෝඩ් ලින්ක් එක ලබා ගනිමු
      const apiUrl = `https://supunofc.site/api/movie/baiscopes/dl?url=${encodeURIComponent(searchWebUrl)}&apikey=${API_KEY}`;

      const apiResp = await axios.get(apiUrl, { timeout: 35000 });
      const resData = apiResp.data;

      if (!resData || (!resData.dl_link && !resData.download && !resData.url && !resData.data)) {
        throw new Error('Movie not found or direct link unavailable!');
      }

      const downloadUrl = resData.dl_link || resData.download || resData.url || resData.data;
      const movieTitle = resData.title || resData.filename || query;

      await socket.sendMessage(sender, {
        react: { text: '📥', key: msg.key }
      }).catch(() => {});

      // 3. මූවි ෆයිල් බෆර් එක ඩවුන්ලෝඩ් කරගැනීම
      const fileResp = await axios.get(downloadUrl, {
        responseType: 'arraybuffer',
        timeout: 120000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const fileBuffer = Buffer.from(fileResp.data);

      const nlCtx = {
        forwardingScore: 1,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: NEWSLETTER_CONTEXT.forwardedNewsletterMessageInfo.newsletterJid,
          newsletterName: botName,
          serverMessageId: 999,
        }
      };

      // 4. WhatsApp එකට Document (MP4) එකක් විදිහට යැවීම
      await socket.sendMessage(sender, {
        document: fileBuffer,
        mimetype: 'video/mp4',
        fileName: `${movieTitle}.mp4`,
        caption: `꒰ᵎ 🎬 *Movie Hub* ᵎ꒱

✨ *Title* ➜ ${movieTitle}
📥 *Status* ➜ Downloaded Successfully!

　　˚₊‧꒰ა 🌸 ໒꒱‧₊˚
> *${botName}* 🖤 | *𝐁ʟᴀᴄᴋ 𝐂ᴀᴛ 𝐎ꜰᴄ*`,
        contextInfo: nlCtx
      }, { quoted: msg });

      await socket.sendMessage(sender, {
        react: { text: '✅', key: msg.key }
      }).catch(() => {});

    } catch (e) {
      console.error('[movie error]:', e.message);
      await socket.sendMessage(sender, {
        text: `꒰ᵎ ❌ *Error* ᵎ꒱\n\n⚠️ Failed to download movie!\n*Reason:* ${e.message}\n\n*${botName}* 🖤 | *𝐁ʟᴀᴄᴋ 𝐂ᴀᴛ 𝐎ꜰᴄ*`
      }, { quoted: msg });
    }
  }
};
