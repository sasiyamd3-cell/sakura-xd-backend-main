const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Direct Audio URL එක
const AUDIO_URL = 'https://mp3tourl.com/audio/1793614308201-17329790-6d74-4f2e-aa77-f0c274d62703.opus';

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
      // 1. මයික් රියැක්ට් එකක් දැමීම
      await socket.sendMessage(sender, { react: { text: '🎙️', key: msg.key } }).catch(() => {});

      const mediaDir = path.join(__dirname, '../media');
      if (!fs.existsSync(mediaDir)) {
        fs.mkdirSync(mediaDir, { recursive: true });
      }

      const audioPath = path.join(mediaDir, 'custom_voice.opus');

      // 2. ෆයිල් එක ලෝකල් ෆෝල්ඩර් එකේ නැත්නම් Direct URL එකෙන් ඩවුන්ලෝඩ් කරගැනීම
      if (!fs.existsSync(audioPath)) {
        const response = await axios.get(AUDIO_URL, { 
          responseType: 'arraybuffer',
          timeout: 15000,
          headers: { 'User-Agent': 'Mozilla/5.0' }
        });
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

      // 3. WhatsApp Voice Message (PTT - Push To Talk) එක විදිහට යැවීම
      await socket.sendMessage(sender, {
        audio: audioBuffer,
        mimetype: 'audio/ogg; codecs=opus',
        ptt: true,
        contextInfo: nlCtx
      }, { quoted: msg });

      // 4. සක්සස් රියැක්ට් එකක් දැමීම
      await socket.sendMessage(sender, { react: { text: '🔊', key: msg.key } }).catch(() => {});

    } catch (e) {
      console.error('[autovoice error]:', e.message);
      // ලින්ක් එකෙන් ඩවුන්ලෝඩ් වෙන්න බරක් වුණොත් සයිලන්ට් ඉන්නවා, බොට් ක්‍රෑෂ් වෙන්නේ නැහැ
    }
  }
};
