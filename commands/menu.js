// Command: menu (aliases: help, allmenu)
const { getImageBuffer } = require('../utils/imageCache');

const PAIRING_SITE = 'miyora-mini.site';
const MENU_TIMEOUT_MS = 60000;

// Sub menu එක image එක්ක යවන්නද?
const SUBMENU_WITH_IMAGE = false;

// Prevent duplicate listeners for the same chat
const activeMenus = new Map();

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
    let buf;

    try {
      buf = await getImageBuffer(logo);
    } catch (e) {
      console.log('[menu] logo load fail:', logo, e.message);

      if (!config.IMAGE_PATH) throw e;
      buf = await getImageBuffer(config.IMAGE_PATH);
    }

    return await socket.sendMessage(
      sender,
      { image: buf, caption, contextInfo },
      { quoted }
    );
  } catch (e) {
    console.log('[menu] image send fail:', e.message);

    return await socket.sendMessage(
      sender,
      { text: caption, contextInfo },
      { quoted }
    );
  }
}

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
    const botName = cfg.botName || BOT_NAME_FANCY;
    const logo = cfg.logo || config.IMAGE_PATH;

    const newsletterInfo =
      NEWSLETTER_CONTEXT?.forwardedNewsletterMessageInfo;

    const channelContext = newsletterInfo?.newsletterJid
      ? {
          forwardingScore: 1,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: newsletterInfo.newsletterJid,
            newsletterName: botName,
            serverMessageId: 999
          }
        }
      : undefined;

    // ORIGINAL WELCOME MENU — UNCHANGED
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

    // React to the command without delaying menu delivery
    socket.sendMessage(sender, {
      react: { text: '🌸', key: msg.key }
    }).catch(() => {});

    const menuMsg = await sendWithLogo(
      socket,
      sender,
      logo,
      config,
      menuCaption,
      channelContext,
      msg
    );

    // Don't create a listener if menu delivery failed
    const menuId = menuMsg?.key?.id;
    if (!menuId) return;

    // ORGANIZED SUBMENUS — SIX ORIGINAL CATEGORIES
    const subMenus = {
      // 1. MAIN MENU
      '1': {
        title: '📋 ᴍᴀɪɴ ᴍᴇɴᴜ',
        body: [
          '╭━━〔 ⚡ BASIC COMMANDS 〕━━⬣',
          `│ ✿ ${prefix}menu`,
          '│   └ Open the main menu',
          '├────────────────',
          `│ ✿ ${prefix}alive`,
          '│   └ Check bot online status',
          '├────────────────',
          `│ ✿ ${prefix}ping`,
          '│   └ Check bot response speed',
          '╰━━━━━━━━━━━━━━━━⬣'
        ].join('\n')
      },

      // 2. DOWNLOAD MENU
      '2': {
        title: '📥 ᴅᴏᴡɴʟᴏᴀᴅ ᴍᴇɴᴜ',
        body: [
          '╭━━〔 🎵 MUSIC & LYRICS 〕━━⬣',
          `│ ✿ ${prefix}song`,
          '│   └ Download YouTube songs',
          '├────────────────',
          `│ ✿ ${prefix}lyrics`,
          '│   └ Find song lyrics',
          '╰━━━━━━━━━━━━━━━━⬣',
          '',
          '╭━━〔 🎬 VIDEO DOWNLOADS 〕━━⬣',
          `│ ✿ ${prefix}tiktok`,
          '│   └ Download TikTok videos',
          '├────────────────',
          `│ ✿ ${prefix}fb`,
          '│   └ Download Facebook videos',
          '├────────────────',
          `│ ✿ ${prefix}ig`,
          '│   └ Download Instagram media',
          '├────────────────',
          `│ ✿ ${prefix}movie`,
          '│   └ Download Sinhala-sub movies',
          '╰━━━━━━━━━━━━━━━━⬣',
          '',
          '╭━━〔 🎮 GAMES & ANIME 〕━━⬣',
          `│ ✿ ${prefix}pcgame`,
          '│   └ Find PC games',
          '├────────────────',
          `│ ✿ ${prefix}cartoon`,
          '│   └ Find Sinhala cartoons',
          '├────────────────',
          `│ ✿ ${prefix}anime`,
          '│   └ Find anime content',
          '╰━━━━━━━━━━━━━━━━⬣',
          '',
          '╭━━〔 📁 FILES & IMAGES 〕━━⬣',
          `│ ✿ ${prefix}mediafire`,
          '│   └ Download MediaFire files',
          '├────────────────',
          `│ ✿ ${prefix}image`,
          '│   └ Search for images',
          '╰━━━━━━━━━━━━━━━━⬣'
        ].join('\n')
      },

      // 3. OWNER MENU
      '3': {
        title: '👑 ᴏᴡɴᴇʀ ᴍᴇɴᴜ',
        body: [
          '╭━━〔 👑 OWNER COMMANDS 〕━━⬣',
          `│ ✿ ${prefix}owner`,
          '│   └ Get owner contact details',
          '╰━━━━━━━━━━━━━━━━⬣',
          '',
          '┌────────────────',
          '│ 🔒 OWNER ACCESS',
          '│ Only commands implemented in',
          '│ your bot can be used.',
          '└────────────────'
        ].join('\n')
      },

      // 4. GROUP MANAGEMENT
      '4': {
        title: '👥 ɢʀᴏᴜᴘ ᴍᴀɴᴀɢᴇ ᴍᴇɴᴜ',
        body: [
          '╭━━〔 🔐 GROUP SETTINGS 〕━━⬣',
          `│ ✿ ${prefix}grup open`,
          '│   └ Open group for everyone',
          '├────────────────',
          `│ ✿ ${prefix}grup close`,
          '│   └ Close group for non-admins',
          '├────────────────',
          `│ ✿ ${prefix}grup name`,
          '│   └ Change group name',
          '├────────────────',
          `│ ✿ ${prefix}grup desc`,
          '│   └ Change group description',
          '├────────────────',
          `│ ✿ ${prefix}grup lock`,
          '│   └ Lock group settings',
          '├────────────────',
          `│ ✿ ${prefix}grup unlock`,
          '│   └ Unlock group settings',
          '╰━━━━━━━━━━━━━━━━⬣',
          '',
          '╭━━〔 👥 MEMBER MANAGEMENT 〕━━⬣',
          `│ ✿ ${prefix}grup add`,
          '│   └ Add a member by number',
          '├────────────────',
          `│ ✿ ${prefix}grup kick`,
          '│   └ Remove a group member',
          '├────────────────',
          `│ ✿ ${prefix}grup promote`,
          '│   └ Promote member to admin',
          '├────────────────',
          `│ ✿ ${prefix}grup demote`,
          '│   └ Remove admin privileges',
          '├────────────────',
          `│ ✿ ${prefix}grup tagall`,
          '│   └ Mention all group members',
          '╰━━━━━━━━━━━━━━━━⬣',
          '',
          '╭━━〔 🛡️ GROUP SECURITY 〕━━⬣',
          `│ ✿ ${prefix}grup antilink`,
          '│   └ Toggle link protection',
          '├────────────────',
          `│ ✿ ${prefix}grup antistatus`,
          '│   └ Toggle status/link protection',
          '╰━━━━━━━━━━━━━━━━⬣'
        ].join('\n')
      },

      // 5. AI MENU
      '5': {
        title: '🤖 ᴀɪ sʏsᴛᴇᴍ',
        body: [
          '╭━━〔 🤖 AI ASSISTANT 〕━━⬣',
          `│ ✿ ${prefix}ai`,
          '│   └ Chat with AI assistant',
          '├────────────────',
          `│ ✿ ${prefix}gpt`,
          '│   └ Ask the GPT assistant',
          '├────────────────',
          `│ ✿ ${prefix}gemini`,
          '│   └ Ask the Gemini assistant',
          '╰━━━━━━━━━━━━━━━━⬣',
          '',
          '╭━━〔 🎙️ VOICE & IMAGE 〕━━⬣',
          `│ ✿ ${prefix}voice`,
          '│   └ Generate an AI voice message',
          '├────────────────',
          `│ ✿ ${prefix}imagine`,
          '│   └ Generate an AI image',
          '╰━━━━━━━━━━━━━━━━⬣',
          '',
          '╭━━〔 💡 EXAMPLE 〕━━⬣',
          `│ ${prefix}ai Hello!`,
          '╰━━━━━━━━━━━━━━━━⬣'
        ].join('\n')
      },

      // 6. OTHER TOOLS
      '6': {
        title: '🌙 ᴏᴛʜᴇʀ ᴍᴇɴᴜ',
        body: [
          '╭━━〔 📱 MEDIA TOOLS 〕━━⬣',
          `│ ✿ ${prefix}vv`,
          '│   └ Retrieve view-once media',
          '├────────────────',
          `│ ✿ ${prefix}url`,
          '│   └ Convert media to a URL',
          '├────────────────',
          `│ ✿ ${prefix}send`,
          '│   └ Send media by URL or reply',
          '├────────────────',
          `│ ✿ ${prefix}getpp`,
          "│   └ Get a user's profile picture",
          '├────────────────',
          `│ ✿ ${prefix}tts`,
          '│   └ Convert text to voice note',
          '╰━━━━━━━━━━━━━━━━⬣',
          '',
          '╭━━〔 🌐 WEB & NETWORK 〕━━⬣',
          `│ ✿ ${prefix}ss`,
          '│   └ Capture a website screenshot',
          '├────────────────',
          `│ ✿ ${prefix}ip`,
          '│   └ IP and domain lookup',
          '├────────────────',
          `│ ✿ ${prefix}short`,
          '│   └ Shorten long URLs',
          '├────────────────',
          `│ ✿ ${prefix}qr`,
          '│   └ Generate a QR code',
          '╰━━━━━━━━━━━━━━━━⬣',
          '',
          '╭━━〔 🧰 DAILY UTILITIES 〕━━⬣',
          `│ ✿ ${prefix}tempmail`,
          '│   └ Generate temporary email',
          '├────────────────',
          `│ ✿ ${prefix}checkmail`,
          '│   └ Check temporary inbox',
          '├────────────────',
          `│ ✿ ${prefix}tempnumber`,
          '│   └ Get a virtual phone number',
          '├────────────────',
          `│ ✿ ${prefix}checksms`,
          '│   └ Check virtual number SMS',
          '├────────────────',
          `│ ✿ ${prefix}quote`,
          '│   └ Get an inspirational quote',
          '├────────────────',
          `│ ✿ ${prefix}weather`,
          '│   └ Check weather by city',
          '╰━━━━━━━━━━━━━━━━⬣'
        ].join('\n')
      }
    };

    // Replace previous menu listener for this chat
    const key = `${number}|${sender}`;
    const old = activeMenus.get(key);

    if (old) {
      socket.ev.off('messages.upsert', old.listener);
      clearTimeout(old.timer);
      activeMenus.delete(key);
    }

    const listener = async ({ messages }) => {
      try {
        const reply = messages?.[0];
        if (!reply?.message) return;

        const stanzaId =
          reply.message.extendedTextMessage?.contextInfo?.stanzaId;

        // Only accept a reply to this exact menu
        if (stanzaId !== menuId) return;

        // Only accept replies from the same chat
        if (resolveReplyJid(reply) !== sender) return;

        const text = (
          reply.message.conversation ||
          reply.message.extendedTextMessage?.text ||
          ''
        ).trim();

        const chosen = subMenus[text];
        if (!chosen) return;

        // Remove listener after a valid selection
        socket.ev.off('messages.upsert', listener);

        const active = activeMenus.get(key);
        if (active?.listener === listener) {
          clearTimeout(active.timer);
          activeMenus.delete(key);
        }

        socket.sendMessage(sender, {
          react: { text: '✨', key: reply.key }
        }).catch(() => {});

        const subCaption =
          `🌸⃝⃘̉̉̉̉̉̉🧚‍♀️ *${chosen.title}* 🧚‍♀️🌸⃝⃘̉̉̉̉̉̉\n\n` +
          `┊ ┊ ✫ ˚♡ ⋆｡❀\n\n` +
          `${chosen.body}\n\n` +
          `🔗 *Pairing Site:* ${PAIRING_SITE}\n\n` +
          `🧚‍♀️ *©ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝐁ʟᴀᴄᴋ 𝐂ᴀᴛ 𝐎ꜰᴄ*\n\n` +
          `*${botName}* 🖤 | *𝐁ʟᴀᴄᴋ 𝐂ᴀᴛ 𝐎ꜰᴄ*`;

        if (SUBMENU_WITH_IMAGE) {
          await sendWithLogo(
            socket,
            sender,
            logo,
            config,
            subCaption,
            channelContext,
            reply
          );
        } else {
          await socket.sendMessage(
            sender,
            {
              text: subCaption,
              ...(channelContext
                ? { contextInfo: channelContext }
                : {})
            },
            { quoted: reply }
          );
        }
      } catch (e) {
        console.error('[menu] listener error:', e.message || e);
      }
    };

    socket.ev.on('messages.upsert', listener);

    const timer = setTimeout(() => {
      socket.ev.off('messages.upsert', listener);

      if (activeMenus.get(key)?.listener === listener) {
        activeMenus.delete(key);
      }
    }, MENU_TIMEOUT_MS);

    timer.unref?.();

    activeMenus.set(key, { listener, timer });
  }
};
