
const yts = require('yt-search');
const axios = require('axios');

const YT_API = 'https://apis.davidcyriltech.my.id/youtube/mp3';
const BACKUP_API = 'https://youtube-scrap-ecru.vercel.app/api/mp3';

const REQUEST_TIMEOUT = 60000;
const MAX_AUDIO_SIZE = 30 * 1024 * 1024;

function safeFileName(name) {
  return String(name || 'song')
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 150) || 'song';
}

function extractDownloadData(data) {
  const result = data?.result || data?.data || data;

  const url =
    result?.download ||
    result?.download_url ||
    result?.url ||
    result?.link;

  if (!url || typeof url !== 'string') return null;

  return {
    url,
    title: result?.title || null
  };
}

async function getAudioUrl(videoUrl) {
  const apis = [
    `${YT_API}?url=${encodeURIComponent(videoUrl)}`,
    `${BACKUP_API}?url=${encodeURIComponent(videoUrl)}`
  ];

  for (const apiUrl of apis) {
    try {
      const response = await axios.get(apiUrl, {
        timeout: 30000,
        headers: { Accept: 'application/json' },
        maxContentLength: 2 * 1024 * 1024
      });

      const result = extractDownloadData(response.data);

      if (result) {
        const parsedUrl = new URL(result.url);

        if (!['https:', 'http:'].includes(parsedUrl.protocol)) {
          throw new Error('Unsupported audio URL protocol');
        }

        return result;
      }
    } catch (error) {
      console.error('[csong] Download API failed:', error.message);
    }
  }

  throw new Error('Both audio download APIs failed.');
}

async function downloadAudio(url) {
  const response = await axios.get(url, {
    responseType: 'arraybuffer',
    timeout: REQUEST_TIMEOUT,
    maxContentLength: MAX_AUDIO_SIZE,
    maxBodyLength: MAX_AUDIO_SIZE,
    headers: { Accept: 'audio/*, application/octet-stream' }
  });

  const buffer = Buffer.from(response.data);

  if (!buffer.length) {
    throw new Error('Downloaded audio is empty.');
  }

  if (buffer.length > MAX_AUDIO_SIZE) {
    throw new Error('Audio exceeds the 30 MB limit.');
  }

  return buffer;
}

async function downloadThumbnail(url) {
  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 15000,
      maxContentLength: 5 * 1024 * 1024
    });

    const buffer = Buffer.from(response.data);
    const contentType = String(
      response.headers['content-type'] || ''
    );

    if (!contentType.startsWith('image/')) {
      throw new Error('Thumbnail URL did not return an image.');
    }

    return buffer;
  } catch {
    return null;
  }
}

module.exports = {
  name: 'csong',
  aliases: ['channelsong', 'chsong'],

  async execute(ctx) {
    const {
      socket,
      msg,
      sender,
      args,
      reply,
      sessionConfig,
      BOT_NAME_FANCY
    } = ctx;

    const botName =
      sessionConfig?.botName ||
      BOT_NAME_FANCY ||
      'MIYORA MD';

    const input = args.join(' ').trim();

    if (!input.includes('|')) {
      return reply(
        `🌸 *CHANNEL SONG POSTER*\n\n` +
        `🎵 Usage:\n` +
        `\`.csong Song Name | CHANNEL_JID\`\n\n` +
        `📌 Example:\n` +
        `\`.csong Shape of You | 120363291234567890@newsletter\`\n\n` +
        `🤖 ${botName}`
      );
    }

    const separator = input.lastIndexOf('|');
    const songQuery = input.slice(0, separator).trim();
    const targetChannel = input.slice(separator + 1).trim();

    if (!songQuery || !targetChannel.endsWith('@newsletter')) {
      return reply(
        '❌ Song name එක හෝ Channel JID එක වැරදියි.'
      );
    }

    // Channel-specific sending API must exist.
    if (typeof socket.newsletterSendMessage !== 'function') {
      return reply(
        '❌ මේ Baileys socket එකේ newsletterSendMessage() ' +
        'method එක නැහැ. Channel posting support එක පරීක්ෂා කරන්න.'
      );
    }

    try {
      await socket.sendMessage(sender, {
        react: { text: '🔍', key: msg.key }
      }).catch(() => {});

      await reply('⏳ YouTube එකෙන් song එක හොයනවා...');

      const search = await yts(songQuery);
      const video = search?.videos?.[0];

      if (!video?.url) {
        return reply('❌ Song එක හොයාගන්න බැරි වුණා.');
      }

      await reply(
        `🎵 *${video.title}*\n\n` +
        `⏳ Audio එක download කරලා Channel එකට යවනවා...`
      );

      const downloadInfo = await getAudioUrl(video.url);
      const audioBuffer = await downloadAudio(downloadInfo.url);

      const title = safeFileName(
        downloadInfo.title || video.title
      );

      const audioCaption =
        `🌸 *NEW SONG RELEASE* 🌸\n\n` +
        `🎵 *Title:* ${title}\n` +
        `⏱️ *Duration:* ${video.timestamp || 'N/A'}\n` +
        `👁️ *Views:* ${video.views?.toLocaleString() || 'N/A'}\n` +
        `🔗 *YouTube:* ${video.url}\n\n` +
        `✨ *Powered by ${botName}*`;

      const videoId = video.videoId;
      const thumbnailUrl = videoId
        ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
        : video.thumbnail;

      const thumbnail = thumbnailUrl
        ? await downloadThumbnail(thumbnailUrl)
        : null;

      // Send the thumbnail/caption first, if available.
      if (thumbnail) {
        await socket.newsletterSendMessage(
          targetChannel,
          {
            image: thumbnail,
            caption: audioCaption
          }
        );
      } else {
        await socket.newsletterSendMessage(
          targetChannel,
          { text: audioCaption }
        );
      }

      // Send audio using the Channel-specific API.
      await socket.newsletterSendMessage(
        targetChannel,
        {
          audio: audioBuffer,
          mimetype: 'audio/mpeg',
          fileName: `${title}.mp3`,
          ptt: false
        }
      );

      await socket.sendMessage(sender, {
        react: { text: '✅', key: msg.key }
      }).catch(() => {});

      return reply(
        `✅ *Channel posting completed*\n\n` +
        `🎵 *Song:* ${title}\n` +
        `📢 *Channel:* ${targetChannel}\n\n` +
        `⚠️ WhatsApp Channel එකේ post එක පෙනෙනවාද ` +
        `කියලා එක වරක් පරීක්ෂා කරන්න.`
      );

    } catch (error) {
      console.error('[csong] Error:', error);

      await socket.sendMessage(sender, {
        react: { text: '❌', key: msg.key }
      }).catch(() => {});

      return reply(
        `❌ *Song posting failed*\n\n` +
        `Reason: ${error.message || 'Unknown error'}\n\n` +
        `Baileys logs සහ download API එක පරීක්ෂා කරන්න.`
      );
    }
  }
};
