// Command: menu (aliases: help, allmenu)
const { getImageBuffer } = require('../utils/imageCache'); // path එක ඔයාගේ folder structure එකට හදාගන්න

const PAIRING_SITE = 'https://miyora-mini.site';
const MENU_TIMEOUT_MS = 60000;

// Sub menu එක image එක්කම යවන්නද? false = text විතරයි (ගොඩක් ඉක්මන්)
const SUBMENU_WITH_IMAGE = false;

// එකම chat එකට menu ගොඩක් listener ගොඩ ගැහෙන එක නවත්තන්න
const activeMenus = new Map();

async function sendWithLogo(socket, sender, logo, config, caption, contextInfo, quoted) {
  try {
    let buf;
    try { buf = await getImageBuffer(logo); }
    catch (e) {
      console.log('[menu] logo load fail:', logo, e.message);
      buf = await getImageBuffer(config.IMAGE_PATH);
    }
    return await socket.sendMessage(sender, { image: buf, caption, contextInfo }, { quoted });
  } catch (e) {
    console.log('[menu] image send fail:', e.message);
    return await socket.sendMessage(sender, { text: caption, contextInfo }, { quoted });
  }
}

module.exports = {
  name: 'menu',
  aliases: ['help', 'allmenu'],
  async execute(ctx) {
    const {
      socket, msg, sender, sessionConfig, number, prefix, config,
      BOT_NAME_FANCY, NEWSLETTER_CONTEXT, resolveReplyJid
    } = ctx;

    const cfg = sessionConfig || {};
    const botName = cfg.botName || BOT_NAME_FANCY;
    const logo = cfg.logo || config.IMAGE_PATH;

    const channelContext = {
      forwardingScore: 1,
      isForwarded: true,
      forwardedNewsletterMessageInfo: {
        newsletterJid: NEWSLETTER_CONTEXT.forwardedNewsletterMessageInfo.newsletterJid,
        newsletterName: botName,
        serverMessageId: 999,
      }
    };

    const menuCaption =
      `🌸⃝⃘̉̉̉̉̉̉🧚‍♀️ *${botName} 𝐌𝐄𝐍𝐔* 🧚‍♀️🌸⃝⃘̉̉̉̉̉̉\n\n` +
      `┊ ┊ ✫ ˚♡ ⋆｡❀\n` +
      `┊ ☪︎⋆\n\n` +
      `> 💌 *ᴡᴇʟᴄᴏᴍᴇ ᴅᴀʀʟɪɴɢ, ᴘɪᴄᴋ ᴀ ᴄᴀᴛᴇɢᴏʀʏ~*\n\n` +
      `❍ 1┊ ❮ *📋 ᴍᴀɪɴ ᴍᴇɴᴜ* ❯\n` +
      `❍ 2┊ ❮ *📥 ᴅᴏᴡɴʟᴏᴀᴅ ᴍᴇɴᴜ* ❯\n` +
      `❍ 3┊ ❮ *👑 ᴏᴡɴᴇʀ ᴍᴇɴᴜ* ❯\n` +
      `❍ 4┊ ❮ *👥 ɢʀᴏᴜᴘ ᴍᴀɴᴀɢᴇ ᴍᴇɴᴜ* ❯\n` +
      `❍ 5┊ ❮ *🤖 ᴀɪ sʏsᴛᴇᴍ* ❯\n` +
      `❍ 6┊ ❮ *🌙 ᴏᴛʜᴇʀ ᴍᴇɴᴜ* ❯\n\n` +
      `* \`📩 Reply To Number (1-6)\`\n\n` +
      `🔗 *Pairing Site:* ${PAIRING_SITE}\n\n` +
      `🧚‍♀️ *©ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝐁ʟᴀᴄᴋ 𝐂ᴀᴛ 𝐎ꜰᴄ*\n\n` +
      `*${botName}* 🖤 | *𝐁ʟᴀᴄᴋ 𝐂ᴀᴛ 𝐎ꜰᴄ*`;

    // react එක background එකේ (await නැහැ)
    socket.sendMessage(sender, { react: { text: '🌸', key: msg.key } }).catch(() => {});

    const menuMsg = await sendWithLogo(socket, sender, logo, config, menuCaption, channelContext, msg);

    const subMenus = {
      '1': {
        title: '📋 ᴍᴀɪɴ ᴍᴇɴᴜ',
        body:
          `❍ *${prefix}menu* ┊ Show this cute menu\n` +
          `❍ *${prefix}alive* ┊ Check bot status\n` +
          `❍ *${prefix}ping* ┊ Check bot speed`
      },
      '2': {
        title: '📥 ᴅᴏᴡɴʟᴏᴀᴅ ᴍᴇɴᴜ',
        body:
          `❍ *${prefix}song* ┊ Download a YouTube song\n` +
          `❍ *${prefix}movie* ┊ Download Sinhala sub movie\n` +
          `❍ *${prefix}pcgame* ┊ Download PC games\n` +
          `❍ *${prefix}cartoon* ┊ Download Sinhala cartoon\n` +
          `❍ *${prefix}anime* ┊ Download anime\n` +
          `❍ *${prefix}tiktok* ┊ Download TikTok video\n` +
          `❍ *${prefix}fb* ┊ Download Facebook video\n` +
          `❍ *${prefix}ig* ┊ Download Instagram media\n` +
          `❍ *${prefix}mediafire* ┊ Download MediaFire file\n` +
          `❍ *${prefix}image* ┊ Search Google images`
      },
      '3': {
        title: '👑 ᴏᴡɴᴇʀ ᴍᴇɴᴜ',
        body: `❍ *${prefix}owner* ┊ Get owner contact card`
      },
      '4': {
        title: '👥 ɢʀᴏᴜᴘ ᴍᴀɴᴀɢᴇ ᴍᴇɴᴜ',
        body:
          `❍ *${prefix}grup open* 🔓 ┊ Open group for everyone\n` +
          `❍ *${prefix}grup close* 🔒 ┊ Close group for admins\n` +
          `❍ *${prefix}grup name* ✏️ ┊ Change group name\n` +
          `❍ *${prefix}grup desc* 📝 ┊ Change group description\n` +
          `❍ *${prefix}grup lock* 📌 ┊ Lock group settings\n` +
          `❍ *${prefix}grup unlock* 🔓 ┊ Unlock group settings\n` +
          `❍ *${prefix}grup add* ➕ ┊ Add a member by number\n` +
          `❍ *${prefix}grup kick* 👢 ┊ Remove quoted/mentioned user\n` +
          `❍ *${prefix}grup promote* 👑 ┊ Promote user to admin\n` +
          `❍ *${prefix}grup demote* 🔻 ┊ Demote admin from user\n` +
          `❍ *${prefix}grup tagall* 🏷️ ┊ Tag all group members\n` +
          `❍ *${prefix}grup antilink* 🛡️ ┊ Toggle auto-delete links\n` +
          `❍ *${prefix}grup antistatus* 🛡️ ┊ Toggle status/promo links`
      },
      '5': {
        title: '🤖 ᴀɪ sʏsᴛᴇᴍ',
        body:
          `❍ *${prefix}ai* ┊ Chat with AI assistant\n` +
          `❍ *${prefix}gpt* ┊ Ask from ChatGPT AI\n` +
          `❍ *${prefix}gemini* ┊ Ask from Google Gemini AI\n` +
          `❍ *${prefix}imagine* ┊ Generate AI image\n` +
          `📌 *Example:* ${prefix}ai What is quantum physics?`
      },
      '6': {
        title: '🌙 ᴏᴛʜᴇʀ ᴍᴇɴᴜ',
        body:
          `❍ *${prefix}vv* ┊ Unlock view-once media\n` +
          `❍ *${prefix}send* ┊ Send media by url/reply\n` +
          `❍ *${prefix}getpp* ┊ Get a user's profile picture\n` +
          `❍ *${prefix}tts* ┊ Convert text to voice note\n` +
          `❍ *${prefix}short* ┊ Shorten long URLs\n` +
          `❍ *${prefix}qr* ┊ Generate QR code for text/link\n` +
          `❍ *${prefix}quote* ┊ Get a random inspiring quote\n` +
          `❍ *${prefix}weather* ┊ Check city weather details`
      }
    };

    // menu message එක යැවුණේ නැත්නම් listener එකක් හදලා වැඩක් නැහැ
    const menuId = menuMsg?.key?.id;
    if (!menuId) return;

    const key = `${number}|${sender}`;
    const old = activeMenus.get(key);
    if (old) {
      socket.ev.off('messages.upsert', old.listener);
      clearTimeout(old.timer);
      activeMenus.delete(key);
    }

    const listener = async ({ messages }) => {
      try {
        const reply2 = messages[0];
        if (!reply2?.message) return;

        const stanzaId = reply2.message?.extendedTextMessage?.contextInfo?.stanzaId;
        if (stanzaId !== menuId) return;
        if (resolveReplyJid(reply2) !== sender) return;

        const text = (reply2.message?.conversation || reply2.message?.extendedTextMessage?.text || '').trim();
        const chosen = subMenus[text];
        if (!chosen) return;

        socket.sendMessage(sender, { react: { text: '✨', key: reply2.key } }).catch(() => {});

        const subCaption =
          `🌸⃝⃘̉̉̉̉̉̉🧚‍♀️ *${chosen.title}* 🧚‍♀️🌸⃝⃘̉̉̉̉̉̉\n\n` +
          `┊ ┊ ✫ ˚♡ ⋆｡❀\n\n` +
          `${chosen.body}\n\n` +
          `🔗 *Pairing Site:* ${PAIRING_SITE}\n\n` +
          `🧚‍♀️ *©ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝐁ʟᴀᴄᴋ 𝐂ᴀᴛ 𝐎ꜰᴄ*\n\n` +
          `*${botName}* 🖤 | *𝐁ʟᴀᴄᴋ 𝐂ᴀᴛ 𝐎ꜰᴄ*`;

        if (SUBMENU_WITH_IMAGE) {
          await sendWithLogo(socket, sender, logo, config, subCaption, channelContext, reply2);
        } else {
          await socket.sendMessage(sender, { text: subCaption, contextInfo: channelContext }, { quoted: reply2 });
        }
      } catch (e) {
        console.error('[menu] listener error:', e.message || e);
      }
    };

    socket.ev.on('messages.upsert', listener);

    const timer = setTimeout(() => {
      socket.ev.off('messages.upsert', listener);
      if (activeMenus.get(key)?.listener === listener) activeMenus.delete(key);
    }, MENU_TIMEOUT_MS);
    timer.unref?.();

    activeMenus.set(key, { listener, timer });
  }
};
