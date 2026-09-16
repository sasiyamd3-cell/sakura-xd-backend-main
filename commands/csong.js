// Command: csong (aliases: channelsong, cwtmusic)
// Download YouTube song directly to a WhatsApp Channel
module.exports = {
  name: 'csong',
  aliases: ['channelsong', 'cwtmusic'],
  async execute(ctx) {
    const {
      socket, msg, sender, from, command, args, q, reply,
      sessionConfig, number, prefix, config, BOT_NAME_FANCY,
      NEWSLETTER_CONTEXT
    } = ctx;

    const yts    = require('yt-search');
    const axios  = require('axios');
    const ffmpeg = require('fluent-ffmpeg');
    const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
    const path   = require('path');
    const osModule = require('os');
    const fs     = require('fs');
    const crypto = require('crypto');

    ffmpeg.setFfmpegPath(ffmpegInstaller.path);

    const cfg = sessionConfig;
    const botName = cfg?.botName || BOT_NAME_FANCY || 'Black Cat';
    const YT_API = 'https://youtube-scrap-ecru.vercel.app';

    // Input format: .csong <Channel JID> | <Song Name>
    // Example: .csong 120363161234567890@newsletter | Shape of You
    const inputParts = args.join(" ").split('|');
    const channelJid = (inputParts[0] || '').trim();
    const songQuery  = (inputParts[1] || '').trim();

    if (!channelJid || !songQuery) {
      return reply(`꒰ᵎ 📻 *Channel Song Downloader* ᵎ꒱

⚠️ Please provide the Channel JID and the song name correctly!

📌 *Usage:* ${prefix}csong <Channel JID> | <Song Name>
📌 *Example:* ${prefix}csong 120363161234567890@newsletter | Shape of You

　　˚₊‧꒰ა 🌸 ໒꒱‧₊˚
*${botName}* 🖤 | *𝐁ʟᴀᴄᴋ 𝐂ᴀᴛ 𝐎ꜰᴄ*`);
    }

    await socket.sendMessage(sender, {
      react: { text: '🔍', key: msg.key }
    });

    const search = await yts(songQuery);
    if (!search?.videos?.length) {
      return reply(`꒰ᵎ 📻 *Channel Song Downloader* ᵎ꒱

❌ No song found for *${songQuery}*!

　　˚₊‧꒰ა 🌸 ໒꒱‧₊˚
*${botName}* 🖤 | *𝐁ʟᴀᴄᴋ 𝐂ᴀᴛ 𝐎ꜰᴄ*`);
    }

    const video = search.videos[0];
    const sUrl = video.url;
    const sTitle = video.title || 'Song';

    let sDownloadUrl = null;
    try {
      const apiResp = await axios.get(`${YT_API}/api/mp3?url=${encodeURIComponent(sUrl)}`, {
        timeout: 30000
      });
      if (apiResp.data?.status && apiResp.data?.url) {
        sDownloadUrl = apiResp.data.url;
      }
    } catch (e) {
      console.log('[csong] API error:', e.message);
    }

    if (!sDownloadUrl) {
      return reply(`꒰ᵎ 📻 *Channel Song Downloader* ᵎ꒱

❌ Download failed due to an API error.

　　˚₊‧꒰ა 🌸 ໒꒱‧₊˚
*${botName}* 🖤 | *𝐁ʟᴀᴄᴋ 𝐂ᴀᴛ 𝐎ꜰᴄ*`);
    }

    await reply(`꒰ᵎ 📥 *Channel Song* ᵎ꒱

⏳ Downloading and sending song to the channel...
🎶 *${sTitle}*

　　˚₊‧꒰ა 🌸 ໒꒱‧₊˚`);

    const _id = crypto.randomBytes(8).toString('hex');
    const tmpMp3 = path.join(osModule.tmpdir(), `csong_${_id}.mp3`);
    const tmpTag = path.join(osModule.tmpdir(), `ctag_${_id}.mp3`);
    const tmpOut = path.join(osModule.tmpdir(), `csong_out_${_id}.mp3`);

    try {
      const dlResp = await axios.get(sDownloadUrl, {
        responseType: 'stream',
        timeout: 120000,
        headers: { 'User-Agent': 'Mozilla/5.0' }
      }).catch(() => null);

      if (!dlResp?.data) {
        return reply(`❌ Failed to download the audio stream!`);
      }

      await new Promise((resolve, reject) => {
        const writer = fs.createWriteStream(tmpMp3);
        dlResp.data.pipe(writer);
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      // Adding audio watermark tag
      try {
        const tagText = `Powered by ${botName}`;
        const sTagUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(tagText)}&tl=en&client=tw-ob`;
        const tagResp = await axios.get(sTagUrl, { responseType: 'stream' }).catch(() => null);
        if (tagResp) {
          await new Promise((resolve) => {
            const writer = fs.createWriteStream(tmpTag);
            tagResp.data.pipe(writer);
            writer.on('finish', resolve);
            writer.on('error', () => resolve());
          });
        }
      } catch (e) {}

      await new Promise((resolve, reject) => {
        let ff = ffmpeg(tmpMp3).noVideo();
        if (fs.existsSync(tmpTag)) {
          ff.input(tmpTag).complexFilter([
            '[1:a]adelay=1000|1000,volume=2.0[tag]',
            '[0:a][tag]amix=inputs=2:duration=first'
          ]);
        }
        ff.audioCodec('libmp3lame')
          .format('mp3')
          .on('end', resolve)
          .on('error', reject)
          .save(tmpOut);
      });

      const buf = fs.readFileSync(tmpOut);
      const caption = `🎶 *${sTitle}*

✨ *Powered by ${botName}*`;

      // Sending audio directly to the WhatsApp Channel JID
      await socket.sendMessage(channelJid, {
        audio: buf,
        mimetype: 'audio/mpeg',
        fileName: `${sTitle}.mp3`,
        caption: caption,
        ptt: false,
        contextInfo: {
          forwardingScore: 1,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: NEWSLETTER_CONTEXT?.forwardedNewsletterMessageInfo?.newsletterJid || '',
            newsletterName: botName,
            serverMessageId: 999,
          }
        }
      });

      await reply(`꒰ᵎ ✅ *Success* ᵎ꒱\n\n🎵 Song successfully sent to the channel!\n\n*${botName}* 🖤`);

    } catch (err) {
      console.log('[csong] Error:', err);
      await reply(`꒰ᵎ ❌ *Error* ᵎ꒱\n\n⚠️ Failed to send to the channel. Please check if the Channel JID is correct and the bot has access.\n\n*${botName}* 🖤`);
    } finally {
      [tmpMp3, tmpTag, tmpOut].forEach(f => {
        try { if (fs.existsSync(f)) fs.unlinkSync(f); } catch (e) {}
      });
    }

  }
};
