// ============================================================
// 🌸 MIYORA MD — PREMIUM ORGANIZED MENU
// Commands: menu | help | allmenu
// ============================================================

const { getImageBuffer } = require('../utils/imageCache');

const PAIRING_SITE = 'https://miyora-mini.site';
const MENU_TIMEOUT_MS = 60000;

// false = Submenus as text (faster)
// true  = Submenus with logo image
const SUBMENU_WITH_IMAGE = false;

// Prevent duplicate listeners per user/chat.
const activeMenus = new Map();

// ------------------------------------------------------------
// 🖼️ Send menu with logo fallback
// ------------------------------------------------------------
async function sendWithLogo(
  socket,
  sender,
  logo,
  config,
  caption,
  contextInfo,
  quoted
) {
  try {
    let buffer;

    try {
      buffer = await getImageBuffer(logo);
    } catch (error) {
      console.log('[MIYORA MENU] Primary logo failed:', error.message);

      if (!config?.IMAGE_PATH) {
        throw error;
      }

      buffer = await getImageBuffer(config.IMAGE_PATH);
    }

    return await socket.sendMessage(
      sender,
      {
        image: buffer,
        caption,
        contextInfo
      },
      { quoted }
    );
  } catch (error) {
    console.error('[MIYORA MENU] Image error:', error.message);

    return await socket.sendMessage(
      sender,
      {
        text: caption,
        contextInfo
      },
      { quoted }
    );
  }
}

// ------------------------------------------------------------
// 🧹 Clean up an active menu session
// ------------------------------------------------------------
function removeMenuSession(socket, key) {
  const session = activeMenus.get(key);

  if (!session) return;

  socket.ev.off('messages.upsert', session.listener);
  clearTimeout(session.timer);
  activeMenus.delete(key);
}

// ------------------------------------------------------------
// 📋 MENU COMMAND
// ------------------------------------------------------------
module.exports = {
  name: 'menu',
  aliases: ['help', 'allmenu'],

  async execute(ctx) {
    const {
      socket,
      msg,
      sender,
      sessionConfig,
      number,
      prefix,
      config,
      BOT_NAME_FANCY,
      NEWSLETTER_CONTEXT,
      resolveReplyJid
    } = ctx;

    const cfg = sessionConfig || {};

    const botName =
      cfg.botName ||
      BOT_NAME_FANCY ||
      '🌸 MIYORA MD';

    const logo =
      cfg.logo ||
      config?.IMAGE_PATH;

    const p = prefix || '.';

    // --------------------------------------------------------
    // 📡 Safe newsletter forwarding context
    // --------------------------------------------------------
    const newsletterInfo =
      NEWSLETTER_CONTEXT?.forwardedNewsletterMessageInfo;

    const channelContext = newsletterInfo
      ? {
          forwardingScore: 1,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: newsletterInfo.newsletterJid,
            newsletterName: botName,
            serverMessageId: 999
          }
        }
      : {};

    // --------------------------------------------------------
    // 🌸 Common footer
    // --------------------------------------------------------
    const footer =
      `\n\n╭━━〔 🌸 MIYORA MD 〕━━╮\n` +
      `┃ ✨ SIMPLE • FAST • POWERFUL\n` +
      `┃ 🌐 ${PAIRING_SITE}\n` +
      `╰━━━━━━━━━━━━━━━━━━╯`;

    // --------------------------------------------------------
    // 📚 ORGANIZED SUBMENUS
    // Keep the existing category numbers 1–6.
    // --------------------------------------------------------
    const subMenus = {
      '1': {
        title: '📋 ᴍᴀɪɴ ᴍᴇɴᴜ',
        description: 'Basic commands and bot information',

        body:
          `╭━━〔 🌸 BASIC COMMANDS 〕━━╮\n` +
          `┃\n` +
          `┃ ❍ *${p}menu*\n` +
          `┃   └ Open the main menu\n` +
          `┃\n` +
          `┃ ❍ *${p}alive*\n` +
          `┃   └ Check bot online status\n` +
          `┃\n` +
          `┃ ❍ *${p}ping*\n` +
          `┃   └ Check bot response speed\n` +
          `┃\n` +
          `┃ ❍ *${p}owner*\n` +
          `┃   └ Get owner contact details\n` +
          `┃\n` +
          `╰━━━━━━━━━━━━━━━━━━╯`
      },

      '2': {
        title: '📥 ᴅᴏᴡɴʟᴏᴀᴅ ᴍᴇɴᴜ',
        description: 'Music, videos, games and media',

        body:
          `╭━━〔 🎵 MUSIC & LYRICS 〕━━╮\n` +
          `┃ ❍ *${p}song* — Download a song\n` +
          `┃ ❍ *${p}lyrics* — Find song lyrics\n` +
          `╰━━━━━━━━━━━━━━━━━━╯\n\n` +

          `╭━━〔 🎬 SOCIAL MEDIA 〕━━╮\n` +
          `┃ ❍ *${p}tiktok* — TikTok video downloader\n` +
          `┃ ❍ *${p}fb* — Facebook video downloader\n` +
          `┃ ❍ *${p}ig* — Instagram media downloader\n` +
          `╰━━━━━━━━━━━━━━━━━━╯\n\n` +

          `╭━━〔 🎮 ENTERTAINMENT 〕━━╮\n` +
          `┃ ❍ *${p}movie* — Sinhala subtitle movies\n` +
          `┃ ❍ *${p}pcgame* — PC games\n` +
          `┃ ❍ *${p}cartoon* — Sinhala cartoons\n` +
          `┃ ❍ *${p}anime* — Anime content\n` +
          `╰━━━━━━━━━━━━━━━━━━╯\n\n` +

          `╭━━〔 🖼️ MEDIA & FILES 〕━━╮\n` +
          `┃ ❍ *${p}mediafire* — MediaFire file downloader\n` +
          `┃ ❍ *${p}image* — Search for images\n` +
          `╰━━━━━━━━━━━━━━━━━━╯`
      },

      '3': {
        title: '👑 ᴏᴡɴᴇʀ ᴍᴇɴᴜ',
        description: 'Owner contact and information',

        body:
          `╭━━〔 👑 OWNER CENTER 〕━━╮\n` +
          `┃\n` +
          `┃ ❍ *${p}owner*\n` +
          `┃   └ Get the owner contact card\n` +
          `┃\n` +
          `┃ 🔐 Owner-only commands depend on\n` +
          `┃ the permissions implemented in\n` +
          `┃ your bot's command handlers.\n` +
          `┃\n` +
          `╰━━━━━━━━━━━━━━━━━━╯`
      },

      '4': {
        title: '👥 ɢʀᴏᴜᴘ ᴍᴀɴᴀɢᴇ ᴍᴇɴᴜ',
        description: 'Group administration and protection',

        body:
          `╭━━〔 🔐 GROUP SETTINGS 〕━━╮\n` +
          `┃ ❍ *${p}grup open* — Open group chat\n` +
          `┃ ❍ *${p}grup close* — Close group chat\n` +
          `┃ ❍ *${p}grup name* — Change group name\n` +
          `┃ ❍ *${p}grup desc* — Change group description\n` +
          `┃ ❍ *${p}grup lock* — Lock group settings\n` +
          `┃ ❍ *${p}grup unlock* — Unlock group settings\n` +
          `╰━━━━━━━━━━━━━━━━━━╯\n\n` +

          `╭━━〔 👤 MEMBER MANAGEMENT 〕━━╮\n` +
          `┃ ❍ *${p}grup add* — Add a group member\n` +
          `┃ ❍ *${p}grup kick* — Remove a member\n` +
          `┃ ❍ *${p}grup promote* — Promote to admin\n` +
          `┃ ❍ *${p}grup demote* — Remove admin status\n` +
          `┃ ❍ *${p}grup tagall* — Mention all members\n` +
          `╰━━━━━━━━━━━━━━━━━━╯\n\n` +

          `╭━━〔 🛡️ GROUP PROTECTION 〕━━╮\n` +
          `┃ ❍ *${p}grup antilink* — Toggle link protection\n` +
          `┃ ❍ *${p}grup antistatus* — Toggle status/promo protection\n` +
          `╰━━━━━━━━━━━━━━━━━━╯\n\n` +

          `📌 Admin permissions may be required.`
      },

      '5': {
        title: '🤖 ᴀɪ sʏsᴛᴇᴍ',
        description: 'AI assistants and creative tools',

        body:
          `╭━━〔 🧠 AI ASSISTANTS 〕━━╮\n` +
          `┃ ❍ *${p}ai* — Chat with the AI assistant\n` +
          `┃ ❍ *${p}gpt* — Ask the GPT assistant\n` +
          `┃ ❍ *${p}gemini* — Ask the Gemini assistant\n` +
          `╰━━━━━━━━━━━━━━━━━━╯\n\n` +

          `╭━━〔 🎨 CREATIVE STUDIO 〕━━╮\n` +
          `┃ ❍ *${p}voice* — Generate an AI voice\n` +
          `┃ ❍ *${p}imagine* — Generate an AI image\n` +
          `╰━━━━━━━━━━━━━━━━━━╯\n\n` +

          `╭━━〔 💡 EXAMPLE 〕━━╮\n` +
          `┃ *${p}ai* Explain quantum physics\n` +
          `╰━━━━━━━━━━━━━━━━━━╯`
      },

      '6': {
        title: '🌙 ᴏᴛʜᴇʀ ᴍᴇɴᴜ',
        description: 'Utilities, media tools and extra features',

        body:
          `╭━━〔 🧰 MEDIA TOOLS 〕━━╮\n` +
          `┃ ❍ *${p}vv* — View-once media tool\n` +
          `┃ ❍ *${p}url* — Convert media to a URL\n` +
          `┃ ❍ *${p}send* — Send media by URL/reply\n` +
          `┃ ❍ *${p}getpp* — Get a profile picture\n` +
          `╰━━━━━━━━━━━━━━━━━━╯\n\n` +

          `╭━━〔 🌐 WEB & NETWORK 〕━━╮\n` +
          `┃ ❍ *${p}ss* — Capture a website screenshot\n` +
          `┃ ❍ *${p}ip* — IP/domain lookup\n` +
          `┃ ❍ *${p}short* — Shorten a long URL\n` +
          `┃ ❍ *${p}qr* — Generate a QR code\n` +
          `╰━━━━━━━━━━━━━━━━━━╯\n\n` +

          `╭━━〔 📧 TEMPORARY SERVICES 〕━━╮\n` +
          `┃ ❍ *${p}tempmail* — Create temporary email\n` +
          `┃ ❍ *${p}checkmail* — Check the email inbox\n` +
          `┃ ❍ *${p}tempnumber* — Get a virtual number\n` +
          `┃ ❍ *${p}checksms* — Check received SMS\n` +
          `╰━━━━━━━━━━━━━━━━━━╯\n\n` +

          `╭━━〔 ✨ EXTRA UTILITIES 〕━━╮\n` +
          `┃ ❍ *${p}tts* — Convert text to speech\n` +
          `┃ ❍ *${p}quote* — Get an inspiring quote\n` +
          `┃ ❍ *${p}weather* — Check weather by city\n` +
          `╰━━━━━━━━━━━━━━━━━━╯`
      }
    };

    // --------------------------------------------------------
    // 🌸 Main menu design — original 1–6 layout preserved
    // --------------------------------------------------------
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
      `*📩 Reply To Number (1-6)*\n\n` +
      `🔗 *Pairing Site:* ${PAIRING_SITE}\n\n` +
      `🧚‍♀️ *©ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝐁ʟᴀᴄ𝐤 𝐂ᴀᴛ 𝐎ꜰᴄ*\n\n` +
      `*${botName}* 🖤 | *𝐁ʟᴀᴄ𝐤 𝐂ᴀᴛ 𝐎ꜰᴄ*`;

    // --------------------------------------------------------
    // ✨ React to the user's command without blocking
    // --------------------------------------------------------
    socket.sendMessage(
      sender,
      {
        react: {
          text: '🌸',
          key: msg.key
        }
      }
    ).catch(() => {});

    // --------------------------------------------------------
    // 📤 Send the main menu
    // --------------------------------------------------------
    const menuMsg = await sendWithLogo(
      socket,
      sender,
      logo,
      config,
      menuCaption,
      channelContext,
      msg
    );

    const menuId = menuMsg?.key?.id;

    if (!menuId) {
      console.error('[MIYORA MENU] Menu message was not sent.');
      return;
    }

    // --------------------------------------------------------
    // 🧹 Replace the previous session for this sender
    // --------------------------------------------------------
    const sessionKey = `${number}|${sender}`;

    removeMenuSession(socket, sessionKey);

    // --------------------------------------------------------
    // 📩 Reply listener
    // --------------------------------------------------------
    const listener = async ({ messages }) => {
      try {
        for (const reply of messages || []) {
          if (!reply?.message) continue;

          const message = reply.message;

          // Ignore messages that do not quote this menu.
          const contextInfo =
            message.extendedTextMessage?.contextInfo;

          if (contextInfo?.stanzaId !== menuId) continue;

          // Only accept replies from the intended sender.
          const replyJid = resolveReplyJid
            ? resolveReplyJid(reply)
            : null;

          if (replyJid !== sender) continue;

          const selectedText = (
            message.conversation ||
            message.extendedTextMessage?.text ||
            ''
          ).trim();

          const chosen = subMenus[selectedText];

          // Ignore invalid selections.
          if (!chosen) continue;

          socket.sendMessage(
            sender,
            {
              react: {
                text: '✨',
                key: reply.key
              }
            }
          ).catch(() => {});

          const submenuCaption =
            `🌸⃝⃘̉̉̉̉̉̉🧚‍♀️ *${botName}* 🧚‍♀️🌸⃝⃘̉̉̉̉̉̉\n\n` +
            `╭━━〔 ${chosen.title} 〕━━╮\n` +
            `┃ ${chosen.description}\n` +
            `╰━━━━━━━━━━━━━━━━━━╯\n\n` +
            `${chosen.body}\n\n` +
            `🔗 *Pairing Site:* ${PAIRING_SITE}\n\n` +
            `📩 Reply to the original menu to choose another category.\n\n` +
            `🧚‍♀️ *©ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝐁ʟᴀᴄ𝐤 𝐂ᴀᴛ 𝐎ꜰᴄ*\n\n` +
            `*${botName}* 🖤 | *𝐁ʟᴀᴄ𝐤 𝐂ᴀᴛ 𝐎ꜰᴄ*`;

          if (SUBMENU_WITH_IMAGE) {
            await sendWithLogo(
              socket,
              sender,
              logo,
              config,
              submenuCaption,
              channelContext,
              reply
            );
          } else {
            await socket.sendMessage(
              sender,
              {
                text: submenuCaption,
                contextInfo: channelContext
              },
              {
                quoted: reply
              }
            );
          }

          // One selection completes the menu session.
          // Open the main menu again to create another session.
          removeMenuSession(socket, sessionKey);
          return;
        }
      } catch (error) {
        console.error(
          '[MIYORA MENU] Listener error:',
          error.message || error
        );
      }
    };

    // --------------------------------------------------------
    // ⏳ Automatically expire the menu listener
    // --------------------------------------------------------
    const timer = setTimeout(() => {
      socket.ev.off('messages.upsert', listener);

      if (activeMenus.get(sessionKey)?.listener === listener) {
        activeMenus.delete(sessionKey);
      }
    }, MENU_TIMEOUT_MS);

    timer.unref?.();

    activeMenus.set(sessionKey, {
      listener,
      timer
    });

    console.log(
      `[MIYORA MENU] Active menu created for ${sender}`
    );
  }
};
