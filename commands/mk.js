
module.exports = {
  name: 'mk',

  aliases: [
    'moko',
    'mokada',
    'මොකද',
    'මොකදකරන්නෙ',
    'මොකදකරන්නේ',
    'මොකදවෙන්නේ',
    'what',
    'whatdoing',
    'whatareyoudoing',
    'whatsup',
    'wyd'
  ],

  async execute(ctx) {
    const { socket, msg } = ctx;

    const jid = msg.key.remoteJid;

    const voiceUrl =
      'https://mp3tourl.com/audio/1793614308201-17329790-6d74-4f2e-aa77-f0c274d62703.opus';

    try {
      await socket.sendMessage(
        jid,
        {
          audio: { url: voiceUrl },
          mimetype: 'audio/ogg; codecs=opus',
          ptt: true
        },
        { quoted: msg }
      );

    } catch (error) {
      console.error('MK Voice Error:', error);

      await socket.sendMessage(
        jid,
        { text: '❌ Voice එක යැවීමට නොහැකි වුණා.' },
        { quoted: msg }
      );
    }
  }
};
