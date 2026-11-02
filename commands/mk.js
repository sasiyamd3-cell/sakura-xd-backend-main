const fs = require('fs');
const path = require('path');
const axios = require('axios');

// GitHub එකේ Raw ෆයිල් එකේ ලින්ක් එක
const GITHUB_AUDIO_URL = 'https://raw.githubusercontent.com/sasiyamd3-cell/mk-voice-bot/main/AUD-20261102-WA0039.opus';

module.exports = {
  name: 'autovoice',
  async execute(ctx) {
    const { socket, msg, sender, args, body, sessionConfig, BOT_NAME_FANCY, NEWSLETTER_CONTEXT } = ctx;

    const botName = sessionConfig?.botName || BOT_NAME_FANCY || 'MIYORA-MD';
    const text = (body || args.join(" ") || '').toLowerCase();

    // සිංහල, ඉංග්‍රීසි, දෙමළ කීවර්ඩ්ස් ලැයිස්තුව
    const keywords = [
      'mk',
      'මොකද කරන්නෙ', 'මොකද කරන්නේ', 'මොකද වෙන්නෙ', 'මොකද වෙන්නේ',
      'mokada karanne', 'mokada wenne', 'what are you doing', 'what happens',
      'என்ன பண்றீங்க', 'என்ன நடக்குது'
    ];

    const isMatched = keywords.some(keyword => text.includes(keyword));
    if (!isMatched) return;

    try {
      await socket.sendMessage(sender, { react: { text: '🎙️', key: msg.key } }).catch(() => {});

      const mediaDir = path.join(__dirname, '../media');
      if (!fs.existsSync(mediaDir)) {
        fs.mkdirSync(mediaDir, { recursive: true });
      }

      const audioPath = path.join(mediaDir, 'mk.opus');

      // ෆයිල් එක ලෝකල් ෆෝල්ඩර් එකේ නැත්නම් GitHub එකෙන් ඩවුන්ලෝඩ් කරගැනීම
      if (!fs.existsSync(audioPath)) {
        const response = await axios.get(GITHUB_AUDIO_URL, { responseType: 'arraybuffer' });
        fs.writeFileSync(audioPath, Buffer.from(response.data));
      }

      const audioBuffer = fs.readFileSync(audioPath);

      const nlCtx = {
        forwardingScore: 1,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: NEWSLETTER_CONTEXT.forwardedNewsletterMessageInfo.newsletterJid,
          newsletterName: botName,
          serverMessageId: 999,
        }
      };

      // Voice Message (PTT) එක විදිහට යැවීම
      await socket.sendMessage(sender, {
        audio: audioBuffer,
        mimetype: 'audio/ogg; codecs=opus',
        ptt: true,
        contextInfo: nlCtx
      }, { quoted: msg });

      await socket.sendMessage(sender, { react: { text: '🔊', key: msg.key } }).catch(() => {});

    } catch (e) {
      console.error('[autovoice error]:', e.message);
    }
  }
};
