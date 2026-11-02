
const fs = require('fs');
const path = require('path');

const SETTINGS_FILE = path.join(__dirname, 'st-settings.json');

const VOICE_URL =
  'https://mp3tourl.com/audio/1793614308201-17329790-6d74-4f2e-aa77-f0c274d62703.opus';

function loadSettings() {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('[ST] Settings error:', e.message);
  }

  return { enabled: true };
}

function saveSettings(settings) {
  fs.writeFileSync(
    SETTINGS_FILE,
    JSON.stringify(settings, null, 2)
  );
}

module.exports = {
  name: 'st',

  aliases: [
    'mk',
    'moko',
    'mokada',
    'wyd',
    'whatsup',
    'whatdoing',
    'stvoice'
  ],

  async execute(ctx) {
    const {
      socket,
      msg,
      from,
      args = [],
      reply
    } = ctx;

    const chatJid = from || msg.key.remoteJid;
    const settings = loadSettings();

    const action = args.join(' ').trim().toLowerCase();

    // Sinhala and English ON commands
    if (['on', 'enable', 'start', 'ක්‍රියාත්මක'].includes(action)) {
      settings.enabled = true;
      saveSettings(settings);

      return reply('🟢 *ST VOICE SYSTEM ON*\n\nVoice replies enabled!');
    }

    // Sinhala and English OFF commands
    if (['off', 'disable', 'stop', 'නවත්වන්න'].includes(action)) {
      settings.enabled = false;
      saveSettings(settings);

      return reply('🔴 *ST VOICE SYSTEM OFF*\n\nVoice replies disabled!');
    }

    if (['status', 'info', 'තත්ත්වය'].includes(action)) {
      return reply(
        `🎙️ *ST VOICE STATUS*\n\nStatus: ${
          settings.enabled ? '🟢 ON' : '🔴 OFF'
        }`
      );
    }

    if (!settings.enabled) return;

    try {
      await socket.sendMessage(
        chatJid,
        {
          audio: { url: VOICE_URL },
          mimetype: 'audio/ogg; codecs=opus',
          ptt: true
        },
        { quoted: msg }
      );

    } catch (error) {
      console.error('[ST Voice Error]', error);
      return reply('❌ Voice sending failed!');
    }
  }
};
