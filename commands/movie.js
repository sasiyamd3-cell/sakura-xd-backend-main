const axios = require('axios');

const API_KEY = 'supun_201a6aed9c5fe527e4912294630e7235';

module.exports = {
  name: 'movie',
  aliases: ['chithrapata', 'film', 'cine', 'searchmovie'],
  async execute(ctx) {
    const { socket, msg, sender, args, q, reply, sessionConfig, BOT_NAME_FANCY, NEWSLETTER_CONTEXT, resolveReplyJid } = ctx;

    const botName = sessionConfig?.botName || BOT_NAME_FANCY || 'MIYORA-MD';
    const searchQuery = args.join(' ').trim() || q;

    if (!searchQuery) {
      return await socket.sendMessage(sender, {
        text: `꒰ᵎ 🎬 *Movie Search & Downloader* ᵎ꒱

⚠️ Please provide a movie name to search!

📌 *Usage:* .movie < name>
📌 *Example:* .movie 

　　˚₊‧꒰ა 🌸 ໒꒱‧₊˚
*${botName}* 🖤 | *𝐁ʟᴀᴄᴋ 𝐂ᴀᴛ 𝐎ꜰᴄ*`
      }, { quoted: msg });
    }

    // 1. සර්ච් වෙනකොට පේන්න රියැක්ට් එකක් දැමීම
    await socket.sendMessage(sender, {
      react: { text: '🔍', key: msg.key }
    }).catch(() => {});

    try {
      // 2. Chithrapata Search API එකට රික්වෙස්ට් එක යැවීම
      const searchApi = `https://supunofc.site/api/movie/chithrapata/search?query=${encodeURIComponent(searchQuery)}&page=1&apikey=${API_KEY}`;
      const { data } = await axios.get(searchApi, { timeout: 25000 });

      if (!data || data.success !== true || !data.result || !data.result.length) {
        throw new Error(`No movies found for "${searchQuery}"!`);
      }

      const movies = data.result.slice(0, 5); // පළමු මූවිස් 5 පමණක් පෙන්වීම
      let listText = `꒰ᵎ 🎬 *Movie Search Results* ᵎ꒱\n\n🔎 *Query:* ${searchQuery}\n\n`;

      movies.forEach((movie, index) => {
        listText += `  *${index + 1}*. ${movie.title || 'Unknown Title'}\n`;
        if (movie.year) listText += `     📅 *Year:* ${movie.year}\n`;
        listText += `\n`;
      });

      listText += `> 💬 *Please reply with the number (1-${movies.length}) to download!* 👆\n\n　　˚₊‧꒰ა 🌸 ໒꒱‧₊˚\n*${botName}* 🖤`;

      // 3. රිසල්ට්ස් ලිස්ට් එක යැවීම
      const sentMsg = await socket.sendMessage(sender, {
        text: listText,
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
        react: { text: '📋', key: msg.key }
      }).catch(() => {});

      // 4. යූසර්ගේ අංකයේ රිප්ලයි එක (1 සිට 5 දක්වා) ලබා ගැනීම
      const collected = await new Promise((resolve) => {
        const listener = ({ messages }) => {
          for (const m2 of messages) {
            const isReply = m2.message?.extendedTextMessage?.contextInfo?.stanzaId === sentMsg.key.id;
            const text = (m2.message?.conversation || m2.message?.extendedTextMessage?.text || '').trim();
            const choiceNum = parseInt(text);
            const isValid = !isNaN(choiceNum) && choiceNum >= 1 && choiceNum <= movies.length;
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
          text: `꒰ᵎ ⏰ *Time Out* ᵎ꒱\n\n⌛ 60 seconds expired!\n> Please use *${prefix || '.movie'}* command again 🌸\n\n*${botName}* 🖤`
        }, { quoted: sentMsg });
      }

      const choiceIndex = parseInt((collected.message?.conversation || collected.message?.extendedTextMessage?.text || '').trim()) - 1;
      const selectedMovie = movies[choiceIndex];

      await socket.sendMessage(sender, {
        text: `꒰ᵎ 📥 *Downloading* ᵎ꒱\n\n⏳ Preparing *${selectedMovie.title}*...\n\n　　˚₊‧꒰ა 🌸 ໒꒱‧₊˚`
      }, { quoted: collected });

      await socket.sendMessage(sender, {
        react: { text: '⏳', key: collected.key }
      }).catch(() => {});

      // 5. මූවි ලින්ක් එකෙන් ඩිරෙක්ට් ෆයිල් එක ඩවුන්ලෝඩ් කරගැනීම (සෙලෙක්ට් කළ මූවි එකේ ඩීටේල්ස් හෝ ඩවුන්ලෝඩ් ලින්ක් එක ලබා ගැනීම)
      // (සමහර API රිසල්ට් වල ඩිරෙක්ට් ඩවුන්ලෝඩ් ලින්ක් එක ඇත, නැතහොත් මූවි පේජ් ලින්ක් එක හරහා බෆර් කරයි)
      const downloadUrl = selectedMovie.dl_link || selectedMovie.download || selectedMovie.url;

      if (!downloadUrl) {
        throw new Error('Direct download link not available for this movie!');
      }

      const fileResp = await axios.get(downloadUrl, {
        responseType: 'arraybuffer',
        timeout: 120000,
        headers: { 'User-Agent': 'Mozilla/5.0' }
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

      // 6. WhatsApp එකට Document (MP4) එකක් විදිහට යැවීම
      await socket.sendMessage(sender, {
        document: fileBuffer,
        mimetype: 'video/mp4',
        fileName: `${selectedMovie.title || 'Movie'}.mp4`,
        caption: `꒰ᵎ 🎬 *Movie Downloader* ᵎ꒱\n\n✨ *Title* ➜ ${selectedMovie.title}\n📥 *Status* ➜ Downloaded Successfully!\n\n　　˚₊‧꒰ა 🌸 ໒꒱‧₊˚\n> *${botName}* 🖤`,
        contextInfo: nlCtx
      }, { quoted: collected });

      await socket.sendMessage(sender, {
        react: { text: '✅', key: collected.key }
      }).catch(() => {});

    } catch (e) {
      console.error('[Movie Search Error]:', e.message);
      await socket.sendMessage(sender, {
        text: `꒰ᵎ ❌ *Error* ᵎ꒱\n\n⚠️ Failed to process movie!\n*Reason:* ${e.message}\n\n*${botName}* 🖤`
      }, { quoted: msg });
    }
  }
};
