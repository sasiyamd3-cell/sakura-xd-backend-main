const axios = require('axios');
const https = require('https');

// SSL certificate verification bypass කිරීමට
const agent = new https.Agent({  
  rejectUnauthorized: false
});

module.exports = {
  name: 'lyrics',
  aliases: ['lyric', 'songlyrics'],
  async execute(ctx) {
    const { socket, msg, sender, args, reply, BOT_NAME_FANCY } = ctx;
    const botName = BOT_NAME_FANCY || 'Black Cat';
    const query = args.join(' ');

    if (!query) {
      return reply('❌ Please provide a song name!\n📌 *Example:* `.lyrics Shape of You`');
    }

    try {
      await reply('⏳ *Searching for lyrics, please wait a moment...*');

      // LRCLIB Public API එක හරහා ගීතයේ පදමාලාව සෙවීම
      const searchUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(query)}`;
      const response = await axios.get(searchUrl, { httpsAgent: agent });
      const tracks = response.data;

      if (!tracks || tracks.length === 0) {
        return reply(`❌ No lyrics found for "*${query}*". Try searching including the artist name!`);
      }

      const track = tracks[0]; // පළමු ගැළපෙන ප්‍රතිඵලය ලබාගැනීම
      const title = track.trackName || 'Unknown Title';
      const artist = track.artistName || 'Unknown Artist';
      const lyrics = track.plainLyrics || track.syncedLyrics || 'No lyrics text available.';

      // WhatsApp මැසේජ් සීමාවට ගැලපෙන ලෙස ට්‍රිම් කරගැනීම (අවශ්‍ය නම්)
      let formattedLyrics = lyrics.length > 3500 ? lyrics.substring(0, 3500) + '\n\n...(Truncated for length)' : lyrics;

      const caption = 
        `🌸⃝⃘̉̉̉̉̉̉🧚‍♀️ *SMART LYRICS FINDER* 🧚‍♀️🌸⃝⃘̉̉̉̉̉̉\n\n` +
        `🎵 *Title:* ${title}\n` +
        `🎤 *Artist:* ${artist}\n\n` +
        `-------------------\n` +
        `${formattedLyrics}\n\n` +
        `-------------------\n` +
        `🧚‍♀️ *©ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝐁ʟᴀᴄᴋ 𝐂ᴀᴛ 𝐎ꜰᴄ*\n\n` +
        `*${botName}* 🖤 | *𝐁ʟᴀᴄᴋ 𝐂ᴀᴛ 𝐎ꜰᴄ*`;

      await socket.sendMessage(sender, { text: caption }, { quoted: msg });

    } catch (e) {
      console.error('[lyrics error]:', e);
      return reply(`❌ Failed to fetch lyrics: ${e.message}`);
    }
  }
};
