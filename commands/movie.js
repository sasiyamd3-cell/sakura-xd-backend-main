const axios = require('axios');


const API_KEY = 'supun_55997eba6e54705892b878304809e52d';

const API_BASE = 'https://supunofc.site/api/movie/baiscopes/dl';
const MAX_FILE_SIZE = 100 * 1024 * 1024;

const client = axios.create({
  timeout: 35000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36'
  }
});

function safeFileName(name) {
  return String(name || 'movie')
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 100) || 'movie';
}

function extractDownloadUrl(data) {
  if (!data) return null;

  if (typeof data === 'string') {
    return /^https?:\/\//i.test(data) ? data : null;
  }

  if (Array.isArray(data)) {
    for (const item of data) {
      const result = extractDownloadUrl(item);
      if (result) return result;
    }
    return null;
  }

  if (typeof data === 'object') {
    const keys = [
      'dl_link',
      'download',
      'downloadUrl',
      'download_url',
      'url',
      'link'
    ];

    for (const key of keys) {
      const value = data[key];

      if (typeof value === 'string' && /^https?:\/\//i.test(value)) {
        return value;
      }

      if (value && typeof value === 'object') {
        const result = extractDownloadUrl(value);
        if (result) return result;
      }
    }

    if (data.data) {
      return extractDownloadUrl(data.data);
    }
  }

  return null;
}

module.exports = {
  name: 'movie',
  aliases: ['cine', 'film', 'baiscope'],

  async execute(ctx) {
    const {
      socket,
      msg,
      sender,
      args,
      sessionConfig,
      BOT_NAME_FANCY,
      NEWSLETTER_CONTEXT
    } = ctx;

    const botName =
      sessionConfig?.botName ||
      BOT_NAME_FANCY ||
      'MIYORA-MD';

    const query = args.join(' ').trim();

    const react = async (emoji) => {
      await socket.sendMessage(sender, {
        react: {
          text: emoji,
          key: msg.key
        }
      }).catch(() => {});
    };

    if (!query) {
      return socket.sendMessage(sender, {
        text: `꒰ᵎ 🎬 *Movie Downloader* ᵎ꒱

⚠️ Please provide a movie name!

📌 *Usage:* .movie <movie name>
📌 *Example:* .movie Leo

˚₊‧꒰ა 🌸 ໒꒱‧₊˚
*${botName}* 🖤 | *𝐌𝐈𝐘𝐎𝐑𝐀 𝐌𝐃*`
      }, { quoted: msg });
    }

    await react('🔍');

    try {
      const searchUrl =
        `https://baiscopes.lk/?s=${encodeURIComponent(query)}`;

      const apiResponse = await client.get(API_BASE, {
        params: {
          url: searchUrl,
          apikey: API_KEY
        }
      });

      const apiData = apiResponse.data;

      if (!apiData || apiData.status === false) {
        throw new Error(
          apiData?.message || 'Movie not found!'
        );
      }

      const downloadUrl = extractDownloadUrl(apiData);

      if (!downloadUrl) {
        console.log('[MOVIE API RESPONSE]', apiData);
        throw new Error('Direct download link not found in API response!');
      }

      const parsedUrl = new URL(downloadUrl);

      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        throw new Error('Invalid download URL!');
      }

      const movieTitle = safeFileName(
        apiData.title ||
        apiData.filename ||
        apiData.data?.title ||
        query
      );

      await react('📥');

      const fileResponse = await client.get(downloadUrl, {
        responseType: 'arraybuffer',
        timeout: 120000,
        maxContentLength: MAX_FILE_SIZE,
        maxBodyLength: MAX_FILE_SIZE,
        headers: {
          Accept: 'video/mp4,video/*,application/octet-stream'
        }
      });

      const fileBuffer = Buffer.from(fileResponse.data);

      if (!fileBuffer.length) {
        throw new Error('Downloaded file is empty!');
      }

      if (fileBuffer.length > MAX_FILE_SIZE) {
        throw new Error('Movie exceeds the 100MB file limit!');
      }

      const contentType =
        fileResponse.headers['content-type'] || '';

      if (
        contentType.includes('text/html') ||
        contentType.includes('application/json')
      ) {
        throw new Error('Invalid movie file received!');
      }

      const contextInfo = {};

      const newsletterInfo =
        NEWSLETTER_CONTEXT?.forwardedNewsletterMessageInfo;

      if (newsletterInfo?.newsletterJid) {
        contextInfo.forwardingScore = 1;
        contextInfo.isForwarded = true;
        contextInfo.forwardedNewsletterMessageInfo = {
          newsletterJid: newsletterInfo.newsletterJid,
          newsletterName: botName,
          serverMessageId: 999
        };
      }

      await socket.sendMessage(sender, {
        document: fileBuffer,
        mimetype: 'video/mp4',
        fileName: `${movieTitle}.mp4`,
        caption: `꒰ᵎ 🎬 *Movie Hub* ᵎ꒱

✨ *Title* ➜ ${movieTitle}
📦 *Size* ➜ ${(fileBuffer.length / (1024 * 1024)).toFixed(2)} MB
📥 *Status* ➜ Downloaded Successfully!

˚₊‧꒰ა 🌸 ໒꒱‧₊˚
> *${botName}* 🖤 | *𝐌𝐈𝐘𝐎𝐑𝐀 𝐌𝐃*`,
        ...(Object.keys(contextInfo).length
          ? { contextInfo }
          : {})
      }, { quoted: msg });

      await react('✅');

    } catch (error) {
      console.error('[MOVIE ERROR]', error.message);

      await react('❌');

      let reason = error.message || 'Unknown error';

      if (error.code === 'ECONNABORTED') {
        reason = 'Request timed out. Try again later.';
      } else if (
        error.response?.status === 404
      ) {
        reason = 'Movie or download link not found.';
      } else if (
        error.response?.status >= 500
      ) {
        reason = 'Movie API server unavailable.';
      }

      await socket.sendMessage(sender, {
        text: `꒰ᵎ ❌ *Movie Download Failed* ᵎ꒱

🎬 *Movie:* ${query}
⚠️ *Reason:* ${reason}

💡 Please try again later.

˚₊‧꒰ა 🌸 ໒꒱‧₊˚
*${botName}* 🖤 | *𝐌𝐈𝐘𝐎𝐑𝐀 𝐌𝐃*`
      }, { quoted: msg });
    }
  }
};
