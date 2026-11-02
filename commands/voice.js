const axios = require('axios');

const AUDIO_URL = 'https://mp3tourl.com/audio/1793614308201-17329790-6d74-4f2e-aa77-f0c274d62703.opus';

module.exports = {
  name: 'autovoice',
  async execute(ctx) {
    const { socket, msg, sender, args, body, sessionConfig, BOT_NAME_FANCY, NEWSLETTER_CONTEXT } = ctx;

    const botName = sessionConfig?.botName || BOT_NAME_FANCY || 'MIYORA-MD';

    // මැසේජ් ටෙක්ස්ට් එක ගෘප් හෝ ප්‍රයිවට් ඕනෑම තැනක සිට නිවැරදිව ලබා ගැනීම
    const textBody = (
      body ||
      args.join(" ") ||
      msg.message?.conversation ||
      msg.message?.extendedTextMessage?.text ||
      msg.message?.imageMessage?.caption ||
      msg.message?.videoMessage?.caption ||
      ''
    ).toLowerCase().trim();

    const keywords = [
      'mk',
      'මොකද කරන්නෙ', 'මොකද කරන්නේ', 'මොකද වෙන්නෙ', 'මොකද වෙන්නේ',
      'mokada karanne', 'mokada wenne', 'what are you doing', 'what happens',
      'என்ன பண்றீங்க', 'என்ன நடக்குது'
    ];

    const isMatched = keywords.some(keyword => textBody.includes(keyword));
    if (!isMatched) return;

    try {
      // 1. මයික් රියැක්ට් දැමීම (ਗෘප් එකේදී කන්ටෙක්ට් එකටම රියැක්ට් වේ)
      await socket.sendMessage(sender, { react: { text: '🎙️', key: msg.key } }).catch(() => {});

      console.log('🔄 [AutoVoice Group/Private] Downloading audio from URL...');
      const response = await axios.get(AUDIO_URL, {
        responseType: 'arraybuffer',
        timeout: 20000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const audioBuffer = Buffer.from(response.data);
      console.log('✅ [AutoVoice] Audio buffer ready, sending to:', sender);

      const nlCtx = {
        forwardingScore: 1,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: NEWSLETTER_CONTEXT.forwardedNewsletterMessageInfo.newsletterJid,
          newsletterName: botName,
          serverMessageId: 999,
        }
      };

      // 2. WhatsApp Voice Note (PTT) එක ගෘප් එකට හෝ චැට් එකට යැවීම
      await socket.sendMessage(sender, {
        audio: audioBuffer,
        mimetype: 'audio/ogg; codecs=opus',
        ptt: true,
        contextInfo: nlCtx
      }, { quoted: msg });

      await socket.sendMessage(sender, { react: { text: '🔊', key: msg.key } }).catch(() => {});

    } catch (e) {
      console.error('❌ [AutoVoice Error Details]:', e.message);
      
      // ගෘප් වලදී බ්ලොක් නොවී ටර්මිනල් එකේ එරර් එක පෙන්වනු ඇත
    }
  }
};
