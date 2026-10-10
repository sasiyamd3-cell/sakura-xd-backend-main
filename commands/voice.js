// Command: voice (aliases: tts, speak, aivoice)
// Advanced Text-to-Speech & Custom Audio Synthesizer Module
module.exports = {
  name: 'voice',
  aliases: ['tts', 'speak', 'aivoice'],
  async execute(ctx) {
    const {
      socket, msg, sender, from, command, args, q, reply,
      sessionConfig, number, prefix, config, BOT_NAME_FANCY,
      NEWSLETTER_CONTEXT, resolveReplyJid, fs, path, os
    } = ctx;

      const cfg = sessionConfig; 
      const botName = cfg.botName || BOT_NAME_FANCY;

      const channelContext = {
        forwardingScore: 1,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: NEWSLETTER_CONTEXT.forwardedNewsletterMessageInfo.newsletterJid,
          newsletterName: botName,
          serverMessageId: 999,
        }
      };

      // ටෙක්ස්ට් එකක් දීලා නැත්නම් හෝ මැසේජ් එකක් කෝට් කරලා නැත්නම්
      let textToSpeak = q.trim();
      const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      
      if (!textToSpeak && quoted) {
        textToSpeak = quoted.conversation || quoted.extendedTextMessage?.text || '';
      }

      if (!textToSpeak) {
        return reply(`꒰ᵎ 🎙️ *AI Voice Synthesizer* ᵎ꒱

    ⚠️ Please provide text or reply to a message to convert into a voice note!

    📌 *Usage:* ${prefix}voice Hello darling, welcome to our bot!
    📌 *Or reply to any text message with:* ${prefix}voice

    　　˚₊‧꒰ა 🌸 ໒꒱‧₊˚
    *${botName}* 🖤`);
      }

      await socket.sendMessage(sender, {
        react: { text: '🎙️', key: msg.key }
      });

      try {
        const axios = require('axios');
        const crypto = require('crypto');
        const ffmpeg = require('fluent-ffmpeg');
        const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
        ffmpeg.setFfmpegPath(ffmpegInstaller.path);

        // Google TTS API හෝ ස්මාර්ට් ස්පීච් සර්විස් එක පාවිච්චි කරමින් ඕඩියෝ ස්ට්‍රීම් එක ලබා ගැනීම
        // (සිංහල සහ ඉංග්‍රීසි භාෂා දෙකටම මරුට වැඩ කරයි)
        const lang = /[\u0D80-\u0DFF]/.test(textToSpeak) ? 'si' : 'en'; // සිංහල අකුරු ඇත්නම් si නැත්නම් en
        const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(textToSpeak)}&tl=${lang}&client=tw-ob`;

        const response = await axios.get(ttsUrl, {
          responseType: 'arraybuffer',
          timeout: 30000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
          }
        });

        const _id = crypto.randomBytes(6).toString('hex');
        const mp3Path = path.join(os.tmpdir(), `tts_${_id}.mp3`);
        const opusPath = path.join(os.tmpdir(), `tts_${_id}.opus`);

        fs.writeFileSync(mp3Path, Buffer.from(response.data));

        // MP3 එක WhatsApp PTT (Voice Note) Opus ෆෝමැට් එකට කන්වට් කිරීම
        await new Promise((resolve, reject) => {
          ffmpeg(mp3Path)
            .noVideo()
            .audioCodec('libopus')
            .format('opus')
            .on('end', resolve)
            .on('error', reject)
            .save(opusPath);
        });

        const opusBuffer = fs.readFileSync(opusPath);

        await socket.sendMessage(sender, {
          audio: opusBuffer,
          mimetype: 'audio/ogg; codecs=opus',
          ptt: true, // true දැමීමෙන් WhatsApp Voice Note එකක් ලෙස ප්ලේ වේ
          contextInfo: channelContext
        }, { quoted: msg });

        await socket.sendMessage(sender, {
          react: { text: '✨', key: msg.key }
        });

        // තාවකාලික ෆයිල් ඉවත් කිරීම (Cleanup)
        try {
          if (fs.existsSync(mp3Path)) fs.unlinkSync(mp3Path);
          if (fs.existsSync(opusPath)) fs.unlinkSync(opusPath);
        } catch (e) {}

      } catch (error) {
        console.error('[voice] Error:', error.message);
        await socket.sendMessage(sender, {
          react: { text: '❌', key: msg.key }
        });
        return reply(`꒰ᵎ ❌ *Error* ᵎ꒱\n\n⚠️ Failed to synthesize voice note!\n\n_Reason: ${error.message}_\n\n*${botName}* 🖤`);
      }

  }
};
