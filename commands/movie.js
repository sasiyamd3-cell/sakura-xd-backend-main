
// MIYORA MD - DIRECT MOVIE DOWNLOAD
// API: movies-one-wheat.vercel.app

const axios = require('axios');
const { pipeline } = require('stream/promises');
const { Transform } = require('stream');

module.exports = {
  name: 'movie',
  aliases: ['movies', 'film', 'sinsub'],

  async execute(ctx) {
    const {
      socket,
      msg,
      sender,
      command,
      q,
      reply,
      sessionConfig,
      prefix,
      config,
      BOT_NAME_FANCY,
      NEWSLETTER_CONTEXT,
      resolveReplyJid,
      fs,
      path,
      os
    } = ctx;

    const API = 'https://movies-one-wheat.vercel.app';

    const TIMEOUT = 120000;
    const SESSION_TIMEOUT = 5 * 60 * 1000;
    const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200 MB

    const cfg = sessionConfig || {};
    const botName = cfg.botName || BOT_NAME_FANCY || 'MIYORA MD';
    const fallbackBanner = cfg.logo || config?.IMAGE_PATH;

    const newsletterInfo =
      NEWSLETTER_CONTEXT?.forwardedNewsletterMessageInfo;

    const contextInfo = newsletterInfo
      ? {
          forwardingScore: 1000,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            ...newsletterInfo,
            newsletterName: botName
          }
        }
      : {};

    // Send image caption or normal text
    const sendCard = async (jid, image, caption, quoted) => {
      if (image && /^https?:\/\//i.test(image)) {
        return socket.sendMessage(
          jid,
          {
            image: { url: image },
            caption,
            contextInfo
          },
          { quoted }
        );
      }

      return socket.sendMessage(
        jid,
        { text: caption, contextInfo },
        { quoted }
      );
    };

    // Strict number validation
    const getNumber = (value) => {
      const text = String(value || '').trim();

      if (!/^\d+$/.test(text)) return null;

      const number = Number(text);

      return Number.isSafeInteger(number) ? number : null;
    };

    // Wait for a reply to a specific message
    const waitForSelection = (
      targetMessageID,
      maxNumber,
      targetSender
    ) => {
      return new Promise((resolve, reject) => {
        let finished = false;
        let processing = false;

        const cleanup = () => {
          clearTimeout(timer);
          socket.ev.off('messages.upsert', listener);
        };

        const finish = (error, result) => {
          if (finished) return;

          finished = true;
          cleanup();

          if (error) reject(error);
          else resolve(result);
        };

        const timer = setTimeout(() => {
          finish(new Error('SESSION_EXPIRED'));
        }, SESSION_TIMEOUT);

        const listener = async (upsert) => {
          if (finished || processing) return;

          try {
            for (const incoming of upsert?.messages || []) {
              if (!incoming?.message) continue;

              if (resolveReplyJid(incoming) !== targetSender) {
                continue;
              }

              const quotedID =
                incoming.message?.extendedTextMessage
                  ?.contextInfo?.stanzaId;

              if (quotedID !== targetMessageID) continue;

              const text =
                incoming.message?.extendedTextMessage?.text ||
                incoming.message?.conversation ||
                '';

              const number = getNumber(text);

              if (!number || number < 1 || number > maxNumber) {
                processing = true;

                await socket.sendMessage(
                  targetSender,
                  {
                    text:
                      `❌ *Invalid Selection!*\n\n` +
                      `1 සිට ${maxNumber} දක්වා අංකයක් Reply කරන්න.`
                  },
                  { quoted: incoming }
                );

                processing = false;
                continue;
              }

              finish(null, {
                number,
                message: incoming
              });

              return;
            }
          } catch (error) {
            processing = false;
            console.error('Movie selection error:', error);
          }
        };

        socket.ev.on('messages.upsert', listener);
      });
    };

    // Download actual MP4 file to temporary storage
    const downloadDirectFile = async (url, filePath) => {
      if (
        typeof url !== 'string' ||
        !/^https?:\/\//i.test(url)
      ) {
        throw new Error('Invalid download URL.');
      }

      const response = await axios.get(url, {
        responseType: 'stream',
        timeout: TIMEOUT,
        maxRedirects: 5,
        maxContentLength: MAX_FILE_SIZE,
        maxBodyLength: MAX_FILE_SIZE,
        headers: {
          'User-Agent': 'Mozilla/5.0',
          Accept: 'video/mp4, application/octet-stream, */*'
        }
      });

      const contentLength = Number(
        response.headers['content-length'] || 0
      );

      if (contentLength > MAX_FILE_SIZE) {
        response.data.destroy();
        throw new Error('File size exceeds 200 MB.');
      }

      let downloaded = 0;

      const sizeLimiter = new Transform({
        transform(chunk, encoding, callback) {
          downloaded += chunk.length;

          if (downloaded > MAX_FILE_SIZE) {
            callback(new Error('File size exceeds 200 MB.'));
            return;
          }

          callback(null, chunk);
        }
      });

      await pipeline(
        response.data,
        sizeLimiter,
        fs.createWriteStream(filePath)
      );

      const stats = await fs.promises.stat(filePath);

      if (!stats.size) {
        throw new Error('Downloaded file is empty.');
      }

      if (stats.size > MAX_FILE_SIZE) {
        throw new Error('File size exceeds 200 MB.');
      }

      // Verify real MP4 file signature
      const fileHandle = await fs.promises.open(filePath, 'r');

      try {
        const header = Buffer.alloc(12);

        const { bytesRead } = await fileHandle.read(
          header,
          0,
          12,
          0
        );

        const isMP4 =
          bytesRead >= 8 &&
          header.toString('ascii', 4, 8) === 'ftyp';

        if (!isMP4) {
          throw new Error(
            'The server did not return a valid MP4 file. ' +
            'It may have returned an HTML page or redirect.'
          );
        }
      } finally {
        await fileHandle.close();
      }

      return stats;
    };

    // Main command
    try {
      if (!q || !q.trim()) {
        return reply(
          `❌ *Movie name ekak denna!*\n\n` +
          `Example: *${prefix}movie Vincenzo*`
        );
      }

      await reply(
        `🔍 *${botName} MOVIE SEARCH*\n\n` +
        `🎬 Searching: ${q.trim()}\n\n` +
        `Please wait...`
      );

      // STEP 1: SEARCH MOVIES
      const searchRes = await axios.get(
        `${API}/api/screech=${encodeURIComponent(q.trim())}`,
        { timeout: 30000 }
      );

      const results = searchRes.data?.results;

      if (
        !searchRes.data?.status ||
        !Array.isArray(results) ||
        results.length === 0
      ) {
        return reply(
          `❌ *Movie not found!*\n\n` +
          `Search: ${q}\n\n` +
          `Venas keyword ekakin try karanna.`
        );
      }

      const movies = results
        .filter(m => m?.title && m?.link)
        .slice(0, 10);

      if (!movies.length) {
        return reply('❌ Valid movies found wenne na.');
      }

      // STEP 2: SHOW SEARCH RESULTS
      let listText =
        `🎬 *${botName}*\n\n` +
        `🔍 *Search Results:* ${q}\n` +
        `━━━━━━━━━━━━━━━━━━━━\n\n`;

      movies.forEach((movie, index) => {
        listText += `*${index + 1}.* ${movie.title}\n`;
      });

      listText +=
        `\n━━━━━━━━━━━━━━━━━━━━\n` +
        `_Reply with a number (1-${movies.length})_`;

      const listBanner = movies[0]?.poster || fallbackBanner;

      const listMsg = await sendCard(
        sender,
        listBanner,
        listText,
        msg
      );

      // STEP 3: SELECT MOVIE
      const movieSelection = await waitForSelection(
        listMsg.key.id,
        movies.length,
        sender
      ).catch(error => {
        if (error.message === 'SESSION_EXPIRED') {
          return null;
        }

        throw error;
      });

      if (!movieSelection) {
        return socket.sendMessage(sender, {
          text:
            `⌛ *Movie session expired!*\n\n` +
            `Use *${prefix}movie* again.`
        });
      }

      const selected = movies[movieSelection.number - 1];
      const selectionMsg = movieSelection.message;

      await socket.sendMessage(
        sender,
        {
          text:
            `🔍 *Loading Movie Details...*\n\n` +
            `🎬 ${selected.title}\n\n` +
            `Please wait...`
        },
        { quoted: selectionMsg }
      );

      // STEP 4: FETCH MOVIE DATA + DOWNLOAD OPTIONS
      const [detailsResponse, downloadResponse] =
        await Promise.all([
          axios.get(
            `${API}/api/data=${encodeURIComponent(selected.link)}`,
            { timeout: 30000 }
          ),

          axios.get(
            `${API}/api/dreclink=${encodeURIComponent(selected.link)}`,
            { timeout: 90000 }
          )
        ]);

      const movieData = detailsResponse.data;
      const dlData = downloadResponse.data;

      if (!movieData?.status) {
        return socket.sendMessage(sender, {
          text: '❌ Movie details load failed.'
        });
      }

      // STEP 5: FILTER DOWNLOAD OPTIONS
      const blockedHosts = [
        'cdn.sinhalasub.net',
        'filespayouts.com',
        'ddl.sinhalasub.net'
      ];

      const downloads = (dlData?.downloads || []).filter(item => {
        if (
          !item?.mp4 ||
          typeof item.mp4 !== 'string' ||
          !/^https?:\/\//i.test(item.mp4)
        ) {
          return false;
        }

        const host = String(item.host || '').toLowerCase();

        return !blockedHosts.some(hostname =>
          host.includes(hostname)
        );
      });

      if (!downloads.length) {
        return socket.sendMessage(sender, {
          text:
            `❌ *${movieData.title || selected.title}*\n\n` +
            `No download options available.\n` +
            `Passe try karanna.`
        });
      }

      // STEP 6: SHOW QUALITY OPTIONS
      let detailText =
        `🎬 *${botName} MOVIE DOWNLOADER*\n\n` +
        `📌 *${movieData.title || selected.title}*\n`;

      if (movieData.year) {
        detailText += `📅 *Year:* ${movieData.year}\n`;
      }

      if (movieData.language) {
        detailText += `🗣️ *Language:* ${movieData.language}\n`;
      }

      if (movieData.genres?.length) {
        detailText +=
          `🎭 *Genre:* ${movieData.genres.join(', ')}\n`;
      }

      if (movieData.director) {
        detailText +=
          `🎬 *Director:* ${movieData.director}\n`;
      }

      detailText += `━━━━━━━━━━━━━━━━━━━━\n\n`;

      if (movieData.description) {
        const description = String(movieData.description);

        detailText +=
          `📖 *About:*\n` +
          `${description.substring(0, 350)}` +
          `${description.length > 350 ? '...' : ''}\n\n`;
      }

      detailText +=
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `📥 *Select Download Quality:*\n\n`;

      downloads.forEach((item, index) => {
        detailText +=
          `*${index + 1}.* 📀 ${item.quality || 'Unknown'}` +
          `${item.size ? ` | 💾 ${item.size}` : ''}\n`;
      });

      detailText +=
        `\n━━━━━━━━━━━━━━━━━━━━\n` +
        `_Reply with a number to download the file._`;

      const detailMsg = await sendCard(
        sender,
        movieData.poster || listBanner,
        detailText,
        selectionMsg
      );

      // STEP 7: SELECT QUALITY
      const qualitySelection = await waitForSelection(
        detailMsg.key.id,
        downloads.length,
        sender
      ).catch(error => {
        if (error.message === 'SESSION_EXPIRED') {
          return null;
        }

        throw error;
      });

      if (!qualitySelection) {
        return socket.sendMessage(sender, {
          text:
            `⌛ *Download session expired!*\n\n` +
            `Use *${prefix}movie* again.`
        });
      }

      const chosen =
        downloads[qualitySelection.number - 1];

      const downloadMsg = qualitySelection.message;

      // STEP 8: CREATE TEMPORARY FILE
      const tempDirectory = await fs.promises.mkdtemp(
        path.join(os.tmpdir(), 'miyora-movie-')
      );

      const safeTitle = String(
        movieData.title || selected.title
      )
        .replace(/[\\/:*?"<>|\x00-\x1F]/g, '')
        .trim()
        .substring(0, 120) || 'Movie';

      const safeQuality = String(
        chosen.quality || 'Unknown'
      ).replace(/[\\/:*?"<>|\x00-\x1F]/g, '');

      const fileName = `${safeTitle} - ${safeQuality}.mp4`;
      const filePath = path.join(tempDirectory, fileName);

      try {
        await socket.sendMessage(
          sender,
          {
            text:
              `⬇️ *DIRECT FILE DOWNLOADING...*\n\n` +
              `🎬 *${safeTitle}*\n` +
              `📀 *Quality:* ${chosen.quality || 'Unknown'}\n` +
              `${chosen.size ? `💾 *Size:* ${chosen.size}\n` : ''}` +
              `\nPlease wait...`
          },
          { quoted: downloadMsg }
        );

        // Download the actual binary file.
        const stats = await downloadDirectFile(
          chosen.mp4,
          filePath
        );

        const actualSize = (
          stats.size / (1024 * 1024)
        ).toFixed(2);

        // STEP 9: SEND REAL MP4 FILE TO WHATSAPP
        const caption =
          `🎬 *${safeTitle}*\n\n` +
          `📀 *Quality:* ${chosen.quality || 'Unknown'}\n` +
          `💾 *File Size:* ${actualSize} MB\n\n` +
          `_Powered by ${botName}_ 🖤`;

        await socket.sendMessage(
          sender,
          {
            document: { url: filePath },
            mimetype: 'video/mp4',
            fileName,
            caption,
            contextInfo
          },
          { quoted: downloadMsg }
        );

        await socket.sendMessage(sender, {
          react: {
            text: '✅',
            key: downloadMsg.key
          }
        });

      } finally {
        // Remove temporary file after upload completes.
        await fs.promises.rm(tempDirectory, {
          recursive: true,
          force: true
        }).catch(err => {
          console.error('Movie temp cleanup error:', err);
        });
      }

    } catch (error) {
      console.error('MIYORA MOVIE ERROR:', error);

      const errorMessage =
        error.message === 'SESSION_EXPIRED'
          ? 'Movie session expired.'
          : error.message;

      await socket.sendMessage(sender, {
        text:
          `❌ *MOVIE DOWNLOAD ERROR*\n\n` +
          `${errorMessage}\n\n` +
          `Venas quality ekak try karanna.`
      }).catch(() => {});
    }
  }
};
