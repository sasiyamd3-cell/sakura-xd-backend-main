// Command: csong (aliases: channelsong, chsong)
const yts   = require('yt-search');
const axios = require('axios');
const https = require('https');

const agent = new https.Agent({ rejectUnauthorized: false });

module.exports = {
  name: 'csong',
  aliases: ['channelsong', 'chsong'],
  async execute(ctx) {
    const {
      socket, msg, sender, args, reply,
      sessionConfig, BOT_NAME_FANCY
    } = ctx;

    const cfg = sessionConfig || {};
    const botName = cfg.botName || BOT_NAME_FANCY || 'Black Cat';
    const YT_API = 'https://apis.davidcyriltech.my.id/youtube/mp3';

    // 1. යූසර් දුන් ආදානය පරීක්ෂා කිරීම
    const input = args.join(' ').trim();
    if (!input || !input.includes('|')) {
      return reply(
        `꒰ᵎ 📢 *Channel Song Poster* ᵎ꒱\n\n` +
        `⚠️ Please provide both song name and channel JID using '|' separator!\n\n` +
        `📌 *Usage:* \`.csong <song name> | <channel_jid>\`\n` +
        `📌 *Example:* \`.csong Shape of You | 120363291234567890@newsletter\`\n\n` +
        `　　˚₊‧꒰ა 🌸 ໒꒱‧₊˚\n` +
        `*${botName}* 🖤 | *𝐁ʟᴀᴄᴋ 𝐂ᴀᴛ 𝐎ꜰᴄ*`
      );
    }

    // `|` ලකුණෙන් සින්දුවේ නම සහ ඕනෑම Channel JID එක වෙන් කිරීම
    const parts = input.split('|');
    const songQuery = parts[0].trim();
    const targetChannel = parts[1].trim();

    if (!targetChannel.endsWith('@newsletter')) {
      return reply('❌ Invalid Channel JID! A valid WhatsApp channel JID must end with `@newsletter`.');
    }

    await socket.sendMessage(sender, { react: { text: '🔍', key: msg.key } });

    try {
      // 2. YouTube එකෙන් සින්දුව සර්ච් කිරීම
      const search = await yts(songQuery);
      if (!search?.videos?.length) {
        return reply(`❌ No song results found for *${songQuery}*!`);
      }

      const video = search.videos[0];
      const sUrl = video.url;
      const videoId = sUrl.split('v=')[1]?.split('&')[0] || sUrl.split('youtu.be/')[1]?.split('?')[0];
      const thumbUrl = videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : video.thumbnail;

      // 3. Audio Downloader API එකෙන් MP3 Direct Link එක ලබාගැනීම
      const apiResp = await axios.get(`${YT_API}?url=${encodeURIComponent(sUrl)}`, {
        timeout: 35000,
        httpsAgent: agent
      });

      const resultData = apiResp.data?.result || apiResp.data;
      const sDownloadUrl = resultData?.download || resultData?.url;
      const sTitle = resultData?.title || video.title;

      if (!sDownloadUrl) {
        return reply('❌ Failed to fetch audio download link! API is currently unavailable.');
      }

      await reply(`⏳ *Uploading "${sTitle}" to the target WhatsApp Channel...*`);

      // 4. අදාළ Channel එකට සින්දුවේ විස්තර සහ Thumbnail එක යැවීම
      const channelCaption = 
        `🌸⃝⃘̉̉̉̉̉̉🧚‍♀️ *NEW SONG RELEASE* 🧚‍♀️🌸⃝⃘̉̉̉̉̉̉\n\n` +
        `🎵 *Title:* ${sTitle}\n` +
        `⏱️ *Duration:* ${video.timestamp || 'N/A'}\n` +
        `👁️ *Views:* ${video.views?.toLocaleString() || 'N/A'}\n` +
        `🔗 *YouTube:* ${sUrl}\n\n` +
        `🧚‍♀️ *©ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝐁ʟᴀᴄᴋ 𝐂ᴀᴛ 𝐎ꜰᴄ*\n\n` +
        `*${botName}* 🖤 | *𝐁ʟᴀᴄᴋ 𝐂ᴀᴛ 𝐎ꜰᴄ*`;

      // (A) Thumbnail එක Caption එක සමඟ Channel එකට යැවීම
      await socket.sendMessage(targetChannel, {
        image: { url: thumbUrl },
        caption: channelCaption
      });

      // (B) Audio File එක Channel එකට යැවීම
      await socket.sendMessage(targetChannel, {
        audio: { url: sDownloadUrl },
        mimetype: 'audio/mpeg',
        fileName: `${sTitle}.mp3`,
        ptt: false
      });

      await socket.sendMessage(sender, { react: { text: '🚀', key: msg.key } });
      return reply(`✅ Successfully posted *"${sTitle}"* to the given WhatsApp Channel!`);

    } catch (e) {
      console.error('[csong error]:', e);
      return reply(`❌ Failed to post song to channel: ${e.message}`);
    }
  }
};
