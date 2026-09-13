const path = require('path');

const BOT_NAME_FANCY = '♡⸝⸝> ̫ <⸝⸝♡ 𝐒𝐊𝐔𝐑𝐀 𝐗𝐃 🌸';

const LOGO_PATH = path.join(__dirname, 'img', 'main.png');

const config = {
  AUTO_VIEW_STATUS: 'true',
  AUTO_LIKE_STATUS: 'true',
  AUTO_RECORDING: 'false',
  AUTO_VV_UNLOCK: 'false',
  AUTO_VV_UNLOCK_MODE: 'inbox',
  AUTO_ANTIDELETE: 'true',
  AUTO_ANTIDELETE_MODE: 'inbox',
  AUTO_LIKE_EMOJI: [
    '🔥','👍','❤️','💜','💙','💚','🧡','🤍','🖤',
    '💖','💗','💓','💞','💕','💝','💘','💟',
    '✨','🌟','💫','⚡','☀️','🌈','🌙','🌸','🌷','🌼','🌺','🌻',
    '🍓','🍒','🍎','🍉','🍇','🍰','🧁','🍭','🍬','🍫','🍩','🍪',
    '🐣','🐥','🐤','🐰','🐼','🐨','🦊','🧸','🐶','🐱','🐭',
    '🎀','🎁','🎈','🎉','🎊','💎','👑','🏆','🎶','🎵'
  ],
  PREFIX: '.',
  MAX_RETRIES: 3,

  GROUP_INVITE_LINK: 'https://chat.whatsapp.com/KBy93MkplPmGLwbPU3GSnd',
  CHANNEL_LINK: 'https://whatsapp.com/channel/0029Vb6UR8S8fewn0otjcc0g',
  NEWSLETTER_JID: '120363409995383814@newsletter',

  OWNER_NUMBER: process.env.OWNER_NUMBER || '94764014979',
  OWNER_NAME: 'Thilina Anuhas',

  OWNER_CONTACTS: [
    { name: 'Nimesh Mihiranga Owner', number: '94721584279' },
    { name: 'Nimeshka Mihiran 👑 No.2', number: '94721584279' },
    { name: 'Nimeshka Mihiran 🌍 No.3', number: '94728304801' },
  ],

  BOT_NAME: 'SAKURA XD',
  BOT_VERSION: 'V1',
  BOT_FOOTER: 'ᴘᴏᴡᴇʀᴅ ʙʏ ʙʟᴀᴄᴋ ᴄᴀᴛ ᴏꜰᴄ',

  RCD_IMAGE_PATH: LOGO_PATH,
  IMAGE_PATH: LOGO_PATH,
  PRIVATE_IMAGE: 'image url',
  BUTTON_IMAGES: {
    ALIVE: LOGO_PATH
  },

  OTP_EXPIRY: 300000,

  MODE: process.env.BOT_MODE || 'public'
};

const NEWSLETTER_CONTEXT = {
  forwardingScore: 1,
  isForwarded: true,
  forwardedNewsletterMessageInfo: {
    newsletterJid: '120363424190766692@newsletter',
    newsletterName: '♡⸝⸝> ꜱᴀᴋᴜʀᴀ xᴅ̫ <⸝⸝♡ ',
    serverMessageId: 999
  }
};

const MONGO_URI = process.env.MONGO_URI || 'mongo url';
const MONGO_DB = process.env.MONGO_DB || 'SAKURADB';

const SETTINGS_URI = process.env.SETTINGS_URI || 'mongo url';
const SETTINGS_DB = process.env.SETTINGS_DB || 'SETTINGSDB';

module.exports = {
  BOT_NAME_FANCY,
  config,
  NEWSLETTER_CONTEXT,
  MONGO_URI,
  MONGO_DB,
  SETTINGS_URI,
  SETTINGS_DB
};
