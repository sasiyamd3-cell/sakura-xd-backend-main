// Command: song (aliases: music, ytmp3, yt)
// Auto-extracted from sakura.js switch-case during commandLoader refactor.
module.exports = {
  name: 'song',
  aliases: ['music', 'ytmp3', 'yt'],
  async execute(ctx) {
    const {
      socket, msg, sender, from, command, args, q, reply,
      sessionConfig, number, prefix, config, BOT_NAME_FANCY,
      NEWSLETTER_CONTEXT, resolveReplyJid, downloadQuotedMedia,
      getSriLankaTimestamp, formatMessage, os
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

      const sanitized = (number || '').replace(/[^0-9]/g, '');
      const cfg = sessionConfig; // reused from top of handler (was: extra Mongo query per command)
      const botName = cfg.botName || BOT_NAME_FANCY;

      const POWER_HEADERS = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Connection': 'keep-alive'
      };

      const songQuery = args.join(" ").trim();

      if (!songQuery) {
        return reply(`꒰ᵎ 🎵 *Song Downloader* ᵎ꒱

    ⚠️ Please provide a song name!

    📌 *Usage:* ${prefix}song <song name>
    📌 *Example:* ${prefix}song Shape of You

    　　˚₊‧꒰ა 🌸 ໒꒱‧₊˚
    *${botName}* 🖤 | *𝐁ʟᴀᴄᴋ 𝐂ᴀᴛ 𝐎ꜰᴄ*`);
      }

      await socket.sendMessage(sender, {
        react: { text: '🔍', key: msg.key }
      });

      const search = await yts(songQuery);
      if (!search?.videos?.length) {
        return reply(`꒰ᵎ 🎵 *Song Downloader* ᵎ꒱

    ❌ No results found for *${songQuery}*!

    　　˚₊‧꒰ა 🌸 ໒꒱‧₊˚
    *${botName}* 🖤 | *𝐁ʟᴀᴄᴋ 𝐂ᴀᴛ 𝐎ꜰᴄ*`);
      }

      const video     = search.videos[0];
      const sMetadata = video;
      const rawUrl    = video.url;
      const videoId   = video.videoId || rawUrl.split('v=')[1]?.split('&')[0] || rawUrl.split('youtu.be/')[1]?.split('?')[0];
      const sUrl      = videoId ? `https://www.youtube.com/watch?v=${videoId}` : rawUrl;

      const thumbUrl = videoId
        ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
        : sMetadata.thumbnail;

      let sDownloadUrl = null;
      let sTitle       = sMetadata.title || 'Song';

      const isAudioUrl = (u) => {
        if (typeof u !== 'string' || !/^https?:\/\//i.test(u)) return false;
        if (/^https?:\/\/(www\.|m\.|music\.)?(youtube\.com|youtu\.be)\//i.test(u)) return false;
        if (/^https?:\/\/(i\.ytimg\.com|img\.youtube\.com|yt3\.ggpht\.com)\//i.test(u)) return false;
        if (/\.(jpg|jpeg|png|webp|gif|svg|ico)(\?.*)?$/i.test(u)) return false;
        if (/whatsapp\.com|t\.me\/|github\.com|instagram\.com|facebook\.com/i.test(u)) return false;
        return true;
      };

      const findDownloadUrl = (obj) => {
        if (!obj) return null;
        if (typeof obj === 'string') return isAudioUrl(obj) ? obj : null;
        if (Array.isArray(obj)) {
          for (const item of obj) {
            const found = findDownloadUrl(item);
            if (found) return found;
          }
          return null;
        }
        if (typeof obj === 'object') {
          const priorityKeys = [
            'downloadUrl', 'download_url', 'dl_link', 'dlink', 'mp3',
            'audio', 'download', 'downloads', 'download_links', 'direct',
            'items', 'url', 'link', 'result', 'data', 'hd', 'sd'
          ];
          for (const key of priorityKeys) {
            if (key in obj) {
              const found = findDownloadUrl(obj[key]);
              if (found) return found;
            }
          }
          for (const [key, val] of Object.entries(obj)) {
            if (/thumb|image|cover|avatar|channel|author|creator|owner/i.test(key)) continue;
            const found = findDownloadUrl(val);
            if (found) return found;
          }
        }
        return null;
      };

      const apiList = [
        `https://mr-thinuzz-api-build.vercel.app/api/ytmp3/download?url=${encodeURIComponent(sUrl)}&apiKey=key_6c38f6ff3c678b114a98e98af4b3240c`,
        `https://mr-thinuzz-api-build.vercel.app/api/ytmp3/download?url=${encodeURIComponent(sUrl)}&apiKey=key_faa62e4037a95cda`,
        `https://mr-thinuzz-api-build.vercel.app/api/ytmp3?url=${encodeURIComponent(sUrl)}&apiKey=key_faa62e4037a95cda`,
        `https://sasa-dev-api.xyz/api/ytmp3/dl?url=${encodeURIComponent(sUrl)}&apikey=Sasa_Dev_Api_24408478357382abb8c9957d89df67059af8168d`,
        `https://sasa-dev-api.xyz/api/ytmp3?url=${encodeURIComponent(sUrl)}&apikey=Sasa_Dev_Api_24408478357382abb8c9957d89df67059af8168d`,
        `https://sasa-dev-api.xyz/api/youtube/mp3?url=${encodeURIComponent(sUrl)}&apikey=Sasa_Dev_Api_24408478357382abb8c9957d89df67059af8168d`,
        `https://podda-api.zone.id/ytmp3?url=${encodeURIComponent(sUrl)}`
      ];

      for (const apiUrl of apiList) {
        try {
          const apiResp = await axios.get(apiUrl, {
            timeout: 45000,
            headers: POWER_HEADERS,
            maxRedirects: 10
          });
          const resData = apiResp.data;
          if (resData) {
            const foundUrl = findDownloadUrl(resData);
            if (foundUrl) {
              sDownloadUrl = foundUrl;
              const dataObj = resData.data || resData.result || resData;
              sTitle = dataObj?.title || resData?.title || sTitle;
              break;
            }
          }
        } catch (e) {
          console.log('[song] API error:', e.message);
        }
      }

      if (!sDownloadUrl) {
        return reply(`꒰ᵎ 🎵 *Song Downloader* ᵎ꒱

    ❌ Download failed! 📍 unavailable.

    　　˚₊‧꒰ა 🌸 ໒꒱‧₊˚
    *${botName}* 🖤 | *𝐁ʟᴀᴄᴋ 𝐂ᴀᴛ 𝐎ꜰᴄ*`);
      }

      const caption = `꒰ᵎ 🎵 *Song Downloader* ᵎ꒱

    🎶 *Title* ➜ ${sTitle}
    ⏱️ *Duration* ➜ ${sMetadata.timestamp || 'N/A'}
    👁️ *Views* ➜ ${sMetadata.views?.toLocaleString() || 'N/A'}
    🔗 *URL* ➜ ${sUrl}

    ✨ *Select your format!*

    　1️⃣ ➜ 🎵 MP3 File
    　2️⃣ ➜ 🎤 Voice Message
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
      });

      const collected = await new Promise((resolve) => {
        const listener = ({ messages }) => {
          for (const m2 of messages) {
            const isReply  = m2.message?.extendedTextMessage?.contextInfo?.stanzaId === sentMsg.key.id;
            const text     = (m2.message?.conversation || m2.message?.extendedTextMessage?.text || '').trim();
            const isValid  = ['1', '2', '3'].includes(text);
            const isSame   = resolveReplyJid(m2) === sender;
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

    > Please use *${prefix}song* command again 🌸

    　　˚₊‧꒰ა 🌸 ໒꒱‧₊˚
    *${botName}* 🖤 | *𝐁ʟᴀᴄᴋ 𝐂ᴀᴛ 𝐎ꜰᴄ*`
        }, { quoted: sentMsg });
      }

      const choice      = (collected.message?.conversation || collected.message?.extendedTextMessage?.text || '').trim();
      const formatLabel = choice === '1' ? 'MP3 🎵' : choice === '2' ? 'Voice Message 🎤' : 'Document 📄';

      await socket.sendMessage(sender, {
        text: `꒰ᵎ 📥 *Downloading* ᵎ꒱

    ⏳ Processing *${formatLabel}*...
    🎶 *${sTitle}*

    　　˚₊‧꒰ა 🌸 ໒꒱‧₊˚`
      }, { quoted: collected });

      const _id    = crypto.randomBytes(8).toString('hex');
      const tmpMp3  = path.join(osModule.tmpdir(), `song_${_id}.mp3`);
      const tmpTag  = path.join(osModule.tmpdir(), `tag_${_id}.mp3`);
      const tmpOpus = path.join(osModule.tmpdir(), `song_${_id}.opus`);
      const tmpOut  = path.join(osModule.tmpdir(), `song_out_${_id}.mp3`);

      try {
        const dlResp = await axios.get(sDownloadUrl, {
          responseType: 'stream',
          timeout: 120000,
          maxRedirects: 10,
          headers: POWER_HEADERS
        }).catch(() => null);

        if (!dlResp?.data) {
          return socket.sendMessage(sender, {
            text: `꒰ᵎ ❌ *Error* ᵎ꒱\n\n⚠️ Download failed!\n\n*${botName}* 🖤`
          }, { quoted: collected });
        }

        await new Promise((resolve, reject) => {
          const writer = fs.createWriteStream(tmpMp3);
          dlResp.data.pipe(writer);
          writer.on('finish', resolve);
          writer.on('error', reject);
        });

        try {
          const tagText  = `Powered by ${botName}`;
          const sTagUrl  = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(tagText)}&tl=en&client=tw-ob`;
          const tagResp  = await axios.get(sTagUrl, { responseType: 'stream' }).catch(() => null);
          if (tagResp) {
            await new Promise((resolve) => {
              const writer = fs.createWriteStream(tmpTag);
              tagResp.data.pipe(writer);
              writer.on('finish', resolve);
              writer.on('error', () => resolve());
            });
          }
        } catch (e) {}

        const mixWithWatermark = (inputFile, outputFile, format, codec) => {
          return new Promise((resolve, reject) => {
            let ff = ffmpeg(inputFile).noVideo();
            if (fs.existsSync(tmpTag)) {
              ff.input(tmpTag).complexFilter([
                '[1:a]adelay=1000|1000,volume=2.0[tag]',
                '[0:a][tag]amix=inputs=2:duration=first'
              ]);
            }
            ff.audioCodec(codec)
              .format(format)
              .on('end', resolve)
              .on('error', reject)
              .save(outputFile);
          });
        };

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
          await mixWithWatermark(tmpMp3, tmpOut, 'mp3', 'libmp3lame');
          const buf = fs.readFileSync(tmpOut);
          await socket.sendMessage(sender, {
            audio: buf,
            mimetype: 'audio/mpeg',
            fileName: `${sTitle}.mp3`,
            ptt: false,
            contextInfo: nlCtx
          }, { quoted: collected });

        } else if (choice === '2') {
          await mixWithWatermark(tmpMp3, tmpOpus, 'opus', 'libopus');
          const buf = fs.readFileSync(tmpOpus);
          await socket.sendMessage(sender, {
            audio: buf,
            mimetype: 'audio/ogg; codecs=opus',
            ptt: true,
            contextInfo: nlCtx
          }, { quoted: collected });

        } else if (choice === '3') {
          await mixWithWatermark(tmpMp3, tmpOut, 'mp3', 'libmp3lame');
          const buf = fs.readFileSync(tmpOut);
          await socket.sendMessage(sender, {
            document: buf,
            mimetype: 'audio/mpeg',
            fileName: `${sTitle}.mp3`,
            contextInfo: nlCtx
          }, { quoted: collected });
        }

        await socket.sendMessage(sender, {
          react: { text: '🎵', key: msg.key }
        });

      } finally {
        [tmpMp3, tmpTag, tmpOpus, tmpOut].forEach(f => {
          try { if (fs.existsSync(f)) fs.unlinkSync(f); } catch (e) {}
        });
      }

  }
};
