const axios = require('axios');
const { cmd } = require('../command');

const API_URL = 'https://supunofc.site/api/movie/baiscopes/dl';
const API_KEY = process.env.BAISCOPES_API_KEY || 'YOUR_API_KEY_HERE';

cmd({
    pattern: 'baiscopes',
    alias: ['baiscope', 'bsdl'],
    desc: 'Download movies from Baiscopes',
    category: 'download',
    use: '.baiscopes <Baiscopes URL>',
    filename: __filename
}, async (conn, mek, m, {
    from,
    q,
    reply
}) => {
    try {
        const url = String(q || '').trim();

        if (!url) {
            return reply(
                '*🎬 BAISCOPES DOWNLOADER*\n\n' +
                'Please provide a Baiscopes movie link.\n\n' +
                '*Example:*\n' +
                '.baiscopes https://baiscopes.lk/links/tvpxp7zus8/\n\n' +
                '> Powered by SUPUN-MD'
            );
        }

        let parsedUrl;

        try {
            parsedUrl = new URL(url);
        } catch {
            return reply('❌ Invalid URL. Please provide a valid Baiscopes link.');
        }

        if (
            !['baiscopes.lk', 'www.baiscopes.lk'].includes(
                parsedUrl.hostname.toLowerCase()
            )
        ) {
            return reply('❌ Only Baiscopes.lk links are supported.');
        }

        if (!API_KEY || API_KEY === 'YOUR_API_KEY_HERE') {
            return reply('❌ API key is not configured. Please set BAISCOPES_API_KEY.');
        }

        await reply('⏳ *Processing your Baiscopes link...*\n\nPlease wait.');

        const response = await axios.get(API_URL, {
            params: {
                url: url,
                apikey: API_KEY
            },
            timeout: 90000,
            headers: {
                'User-Agent': 'Mozilla/5.0 SUPUN-MD WhatsApp Bot'
            }
        });

        const data = response.data;

        if (!data || data.success !== true || !data.result?.ok) {
            return reply(
                '❌ *Download Failed!*\n\n' +
                `Message: ${data?.message || 'Unable to process this movie link.'}`
            );
        }

        const movie = data.result;

        if (!movie.downloadUrl) {
            return reply('❌ API did not return a download URL.');
        }

        const message = `
╭━━━〔 🎬 BAISCOPES DOWNLOADER 〕━━━

┃ ✅ Status: Success
┃ 🎥 Title: ${movie.title || 'Unknown'}
┃ 📁 File: ${movie.fileName || 'Unknown'}
┃ 🌐 Host: ${movie.host || 'Unknown'}
┃ ⏳ Wait: ${movie.waitSeconds ?? 0} seconds

╠━━━━━━━━━━━━━━━━━━━━

┃ 📥 *DOWNLOAD LINK*
┃ ${movie.downloadUrl}

┃ 🎞️ *MOVIE PAGE*
┃ ${movie.moviePageUrl || 'Not Available'}

╰━━━━━━━━━━━━━━━━━━━━

> ᴘᴏᴡᴇʀᴇᴅ ʙʏ ꜱᴜᴘᴜɴ ᴍᴅ
`.trim();

        await conn.sendMessage(
            from,
            { text: message },
            { quoted: mek }
        );

    } catch (error) {
        console.error('[BAISCOPES ERROR]', error.response?.data || error.message);

        const errorMessage = error.code === 'ECONNABORTED'
            ? 'API request timed out. Please try again.'
            : error.response?.data?.message || 'Something went wrong while processing the link.';

        await reply(`❌ *BAISCOPES ERROR*\n\n${errorMessage}`);
    }
});
