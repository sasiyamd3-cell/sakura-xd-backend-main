
// Command: tiktok
// MIYORA MD / Sakura XD
// TikTok Downloader - Original MIYORA Font Edition

module.exports = {
  name: 'tiktok',
  aliases: [],

  async execute(ctx) {
    const {
      socket, msg, sender, q, reply,
      sessionConfig, BOT_NAME_FANCY
    } = ctx;

    const axios = require('axios');

    const botName =
      sessionConfig?.botName || BOT_NAME_FANCY || 'MIYORA MD';

    let listener = null;
    let timeout = null;
    let finished = false;

    const cleanup = () => {
      if (listener) {
        socket.ev.off('messages.upsert', listener);
        listener = null;
      }

      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
    };

    const validUrl = (url) => {
      try {
        const parsed = new URL(url);

        return (
          parsed.protocol === 'https:' &&
          /(^|\.)tiktok\.com$/i.test(parsed.hostname)
        );
      } catch {
        return false;
      }
    };

    const isMediaUrl = (url) => {
      try {
        return new URL(url).protocol === 'https:';
      } catch {
        return false;
      }
    };

    const getMedia = async (url, type) => {
      if (!isMediaUrl(url)) {
        throw new Error('Invalid media URL');
      }

      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 90000,
        maxRedirects: 10,
        maxContentLength: 80 * 1024 * 1024,
        headers: {
          'User-Agent': 'Mozilla/5.0'
        }
      });

      const buffer = Buffer.from(response.data);
      const contentType =
        response.headers['content-type'] || '';

      if (!buffer.length) {
        throw new Error('Empty media file');
      }

      if (
        type === 'video' &&
        !/video|octet-stream/i.test(contentType)
      ) {
        throw new Error('Invalid video response');
      }

      if (
        type === 'audio' &&
        !/audio|octet-stream/i.test(contentType)
      ) {
        throw new Error('Invalid audio response');
      }

      return buffer;
    };

    const getTikTokData = async (url) => {
      const errors = [];

      // PRIMARY API
      try {
        const response = await axios.get(
          'https://www.movanest.xyz/v2/tiktok',
          {
            params: { url },
            timeout: 25000,
            headers: {
              'User-Agent': 'Mozilla/5.0'
            }
          }
        );

        const data = response.data;
        const result = data?.results || data;

        const video =
          result?.no_watermark ||
          result?.download_url ||
          result?.video_url ||
          result?.links?.hd ||
          result?.links?.sd;

        const audio =
          result?.music ||
          result?.audio_url ||
          result?.music_url ||
          result?.links?.audio;

        if (video && isMediaUrl(video)) {
          return {
            title: result?.title || 'TikTok Video',
            video,
            audio: isMediaUrl(audio) ? audio : null
          };
        }

        throw new Error('Primary API returned no video');

      } catch (error) {
        errors.push(error.message);
      }

      // FALLBACK API
      try {
        const response = await axios.get(
          'https://tdownv4.sl-bjs.workers.dev/',
          {
            params: { down: url },
            timeout: 30000,
            headers: {
              'User-Agent': 'Mozilla/5.0'
            }
          }
        );

        const data = response.data;

        const video =
          data?.download_url ||
          data?.video_url ||
          data?.links?.hd ||
          data?.links?.sd;

        const audio =
          data?.author?.audio_url ||
          data?.audio_url ||
          data?.music_url ||
          data?.links?.audio;

        if (!video || !isMediaUrl(video)) {
          throw new Error('Fallback API returned no video');
        }

        return {
          title: data?.title || 'TikTok Video',
          video,
          audio: isMediaUrl(audio) ? audio : null
        };

      } catch (error) {
        errors.push(error.message);
      }

      throw new Error(errors.join(' | '));
    };

    try {
      await socket.sendMessage(sender, {
        react: {
          text: '🖥️',
          key: msg.key
        }
      });

      if (!q) {
        return reply(
          `\n\n✰${botName}✰\n\n` +
          `❌ Please give me a TikTok video URL.`
        );
      }

      const match = q.match(/https?:\/\/[^\s]+/i);
      const url = match
        ? match[0].replace(/[),]+$/, '')
        : '';

      if (!validUrl(url)) {
        return reply(
          `❌ Please provide a valid TikTok URL.`
        );
      }

      await socket.sendMessage(sender, {
        text:
          `\n\n✰${botName}✰ ` +
          `𝚃𝙸𝙺𝚃𝙾𝙺 𝚅𝙸𝙳𝙴𝙾 ` +
          `𝙳𝙾𝚆𝙽𝙻𝙾𝙰𝙳𝙸𝙽𝙶.....`
      }, { quoted: msg });

      await socket.sendMessage(sender, {
        react: {
          text: '⤵',
          key: msg.key
        }
      });

      const data = await getTikTokData(url);

      const videoBuffer = await getMedia(
        data.video,
        'video'
      );

      // ORIGINAL MIYORA FONT AND MENU
      const caption =
        `\n❍ 𝚃𝙸𝙺𝚃𝙾𝙺 𝚅𝙸𝙳𝙴𝙾 𝙳𝙾𝚆𝙽𝙻𝙾𝙰𝙳\n` +
        `  ❯❯❯❯❯❯❯❯❯❯❯❮❮❮❮❮❮❮❮❮❮❮\n\n` +
        `📝 ${data.title}\n\n` +
        `* 𝙾𝚃𝙷𝙴𝚁 𝚀𝚄𝙰𝙻𝙸𝚃𝚈 𝙳𝙾𝚆𝙽𝙻𝙾𝙰𝙳📥\n\n` +
        `❍ 1┊ ❮ *𝙽𝙾 𝚆𝙰𝚃𝙴𝚁𝙼𝙰𝚁𝙺 𝚅𝙸𝙳𝙴𝙾* ❯\n` +
        `❍ 2┊ ❮ *𝙰𝚄𝙳𝙸𝙾 𝙼𝙿3* ❯\n` +
        `❍ 3┊ ❮ *𝙳𝙾𝙲𝚄𝙼𝙴𝙽𝚃* ❯\n` +
        `❍ 4┊ ❮ *𝚅𝙾𝙸𝙲𝙴 𝚃𝚈𝙿𝙴* ❯\n\n` +
        `* \`📩 Reply To Number\`\n\n` +
        `*${botName}*`;

      const sent = await socket.sendMessage(sender, {
        video: videoBuffer,
        mimetype: 'video/mp4',
        caption
      }, { quoted: msg });

      await socket.sendMessage(sender, {
        react: {
          text: '⬇',
          key: msg.key
        }
      });

      // REPLY LISTENER
      listener = async (update) => {
        try {
          for (const replyMsg of update.messages || []) {
            const message = replyMsg.message;

            if (!message || replyMsg.key.fromMe) continue;

            const context =
              message.extendedTextMessage?.contextInfo;

            if (context?.stanzaId !== sent.key.id) continue;

            if (finished) return;

            const selected = (
              message.conversation ||
              message.extendedTextMessage?.text ||
              ''
            ).trim();

            if (!['1', '2', '3', '4'].includes(selected)) {
              continue;
            }

            finished = true;
            cleanup();

            await socket.sendMessage(sender, {
              react: {
                text: '⬇️',
                key: replyMsg.key
              }
            });

            try {
              switch (selected) {

                // NO WATERMARK VIDEO
                case '1':
                  await socket.sendMessage(sender, {
                    video: videoBuffer,
                    mimetype: 'video/mp4',
                    caption:
                      `\n❍ 𝚃𝙸𝙺𝚃𝙾𝙺 𝚅𝙸𝙳𝙴𝙾\n\n` +
                      `> 𝙳𝙾𝚆𝙽𝙻𝙾𝙰𝙳𝙴𝙳 𝚂𝚄𝙲𝙲𝙴𝚂𝚂𝙵𝚄𝙻𝙻𝚈 ✅\n\n` +
                      `*${botName}*`
                  }, { quoted: replyMsg });
                  break;

                // AUDIO MP3
                case '2':
                case '4': {
                  if (!data.audio) {
                    throw new Error(
                      'Audio is not available for this video.'
                    );
                  }

                  const audioBuffer = await getMedia(
                    data.audio,
                    'audio'
                  );

                  await socket.sendMessage(sender, {
                    audio: audioBuffer,
                    mimetype: selected === '4'
                      ? 'audio/ogg; codecs=opus'
                      : 'audio/mpeg',
                    fileName: 'tiktok_audio.mp3',
                    ptt: selected === '4'
                  }, { quoted: replyMsg });

                  break;
                }

                // DOCUMENT
                case '3':
                  await socket.sendMessage(sender, {
                    document: videoBuffer,
                    mimetype: 'video/mp4',
                    fileName: 'tiktok_video.mp4',
                    caption:
                      `> 𝙳𝙾𝚆𝙽𝙻𝙾𝙰𝙳𝙴𝙳 𝙰𝚂 𝙳𝙾𝙲𝚄𝙼𝙴𝙽𝚃 📄`
                  }, { quoted: replyMsg });
                  break;
              }

              await socket.sendMessage(sender, {
                react: {
                  text: '⬆️',
                  key: replyMsg.key
                }
              });

            } catch (error) {
              await socket.sendMessage(sender, {
                text:
                  `\n\n✰${botName}✰\n\n` +
                  `❌ Download Failed!\n\n` +
                  `📝 ${error.message}`
              }, { quoted: replyMsg });
            }

            return;
          }
        } catch (error) {
          console.error(
            '[MIYORA TIKTOK LISTENER]',
            error.message
          );
        }
      };

      socket.ev.on('messages.upsert', listener);

      timeout = setTimeout(() => {
        cleanup();
      }, 60000);

    } catch (error) {
      cleanup();

      console.error('[MIYORA TIKTOK ERROR]', error);

      await socket.sendMessage(sender, {
        react: {
          text: '❌',
          key: msg.key
        }
      });

      return reply(
        `\n\n✰${botName}✰\n\n` +
        `❌ 𝚃𝙸𝙺𝚃𝙾𝙺 𝙳𝙾𝚆𝙽𝙻𝙾𝙰𝙳 𝙵𝙰𝙸𝙻𝙴𝙳!\n\n` +
        `📝 ${error.message}\n\n` +
        `> Please try again later.`
      );
    }
  }
};
