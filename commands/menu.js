// Command: menu
// Aliases: help, allmenu
// Stable reply-based menu system

module.exports = {
  name: 'menu',
  aliases: ['help', 'allmenu'],

  async execute(ctx) {
    const {
      socket,
      msg,
      sender,
      from,
      command,
      args,
      q,
      reply,
      sessionConfig,
      number,
      prefix,
      config,
      BOT_NAME_FANCY,
      NEWSLETTER_CONTEXT,
      resolveReplyJid,
      downloadQuotedMedia,
      getSriLankaTimestamp,
      formatMessage,
      fs,
      path,
      os
    } = ctx;

    // =========================================================
    // CONFIG
    // =========================================================

    const cfg = sessionConfig || {};

    const botName =
      cfg.botName ||
      BOT_NAME_FANCY ||
      '♡⸝⸝> ̫ <⸝⸝♡ 𝐌𝐈𝐘𝐎𝐑𝐀 𝐌𝐃 🌸';

    const logo =
      cfg.logo ||
      config?.IMAGE_PATH ||
      '';

    const PAIRING_SITE = 'https://miyora.kurox.site';

    // =========================================================
    // HELPERS
    // =========================================================

    const normalizeJid = (jid = '') => {
      return String(jid)
        .replace(/:\d+(?=@)/, '')
        .trim()
        .toLowerCase();
    };

    const getText = (message) => {
      if (!message) return '';

      return (
        message.conversation ||
        message.extendedTextMessage?.text ||
        message.imageMessage?.caption ||
        message.videoMessage?.caption ||
        message.buttonsResponseMessage?.selectedButtonId ||
        message.listResponseMessage?.singleSelectReply?.selectedRowId ||
        message.templateButtonReplyMessage?.selectedId ||
        ''
      ).trim();
    };

    const getQuotedStanzaId = (message) => {
      return (
        message?.extendedTextMessage?.contextInfo?.stanzaId ||
        message?.imageMessage?.contextInfo?.stanzaId ||
        message?.videoMessage?.contextInfo?.stanzaId ||
        message?.buttonsResponseMessage?.contextInfo?.stanzaId ||
        message?.listResponseMessage?.contextInfo?.stanzaId ||
        message?.templateButtonReplyMessage?.contextInfo?.stanzaId ||
        null
      );
    };

    const getMessageSender = (m) => {
      return (
        m?.key?.participant ||
        m?.key?.remoteJid ||
        m?.participant ||
        ''
      );
    };

    const sameUser = (m, originalSender) => {
      const incoming = normalizeJid(getMessageSender(m));
      const original = normalizeJid(originalSender);

      if (!incoming || !original) return false;

      // Direct chat
      if (incoming === original) return true;

      // Compare only digits as fallback
      const incomingNum = incoming.replace(/[^0-9]/g, '');
      const originalNum = original.replace(/[^0-9]/g, '');

      if (
        incomingNum &&
        originalNum &&
        incomingNum === originalNum
      ) {
        return true;
      }

      return false;
    };

    // =========================================================
    // CHANNEL CONTEXT
    // =========================================================

    const channelContext = {
      forwardingScore: 1,
      isForwarded: true,

      forwardedNewsletterMessageInfo: {
        newsletterJid:
          NEWSLETTER_CONTEXT
            ?.forwardedNewsletterMessageInfo
            ?.newsletterJid || '',

        newsletterName: botName,

        serverMessageId: 999
      }
    };

    // =========================================================
    // MAIN MENU
    // =========================================================

    const menuCaption =
      `╭━━━〔 🌸 *${botName}* 〕━━━╮\n` +
      `┃\n` +
      `┃ 👋 *HELLO THERE!*\n` +
      `┃\n` +
      `┃ Reply with a number below\n` +
      `┃ to open the selected menu.\n` +
      `┃\n` +
      `┃ 1️⃣ • 📋 Main Menu\n` +
      `┃ 2️⃣ • 📥 Download Menu\n` +
      `┃ 3️⃣ • 👑 Owner Menu\n` +
      `┃ 4️⃣ • 👥 Group Manage\n` +
      `┃ 5️⃣ • 🤖 AI System\n` +
      `┃ 6️⃣ • 🌙 Other Menu\n` +
      `┃\n` +
      `╰━━━━━━━━━━━━━━━━━━━━╯\n\n` +
      `💡 *Reply:* 1 - 6\n\n` +
      `🔗 *Pairing:* ${PAIRING_SITE}\n\n` +
      `> © Powered by *MIYORA MD* 🌸`;

    // =========================================================
    // REACT
    // =========================================================

    try {
      await socket.sendMessage(sender, {
        react: {
          text: '⚡',
          key: msg.key
        }
      });
    } catch (_) {}

    // =========================================================
    // SEND MAIN MENU
    // =========================================================

    let menuMsg;

    try {
      if (String(logo).startsWith('http')) {

        menuMsg = await socket.sendMessage(
          sender,
          {
            image: {
              url: logo
            },

            caption: menuCaption,

            contextInfo: channelContext
          },
          {
            quoted: msg
          }
        );

      } else {

        try {

          const buffer = fs.readFileSync(logo);

          menuMsg = await socket.sendMessage(
            sender,
            {
              image: buffer,

              caption: menuCaption,

              contextInfo: channelContext
            },
            {
              quoted: msg
            }
          );

        } catch (_) {

          if (config?.IMAGE_PATH) {

            menuMsg = await socket.sendMessage(
              sender,
              {
                image: {
                  url: config.IMAGE_PATH
                },

                caption: menuCaption,

                contextInfo: channelContext
              },
              {
                quoted: msg
              }
            );

          } else {

            menuMsg = await socket.sendMessage(
              sender,
              {
                text: menuCaption,

                contextInfo: channelContext
              },
              {
                quoted: msg
              }
            );
          }
        }
      }

    } catch (error) {

      menuMsg = await socket.sendMessage(
        sender,
        {
          text: menuCaption,

          contextInfo: channelContext
        },
        {
          quoted: msg
        }
      );
    }

    // =========================================================
    // SUB MENUS
    // =========================================================

    const subMenus = {

      '1': {
        title: '📋 MAIN MENU',

        body:
          `╭━━〔 📋 MAIN MENU 〕━━╮\n\n` +
          `• ${prefix}menu\n` +
          `  └─ Show main menu\n\n` +

          `• ${prefix}alive\n` +
          `  └─ Check bot status\n\n` +

          `• ${prefix}ping\n` +
          `  └─ Check bot speed\n\n` +

          `╰━━━━━━━━━━━━━━━━━━╯`
      },

      '2': {
        title: '📥 DOWNLOAD MENU',

        body:
          `╭━━〔 📥 DOWNLOAD MENU 〕━━╮\n\n` +

          `• ${prefix}song\n` +
          `  └─ Download YouTube song\n\n` +

          `• ${prefix}movie\n` +
          `  └─ Download Sinhala sub movie\n\n` +

          `• ${prefix}pcgame\n` +
          `  └─ Download PC games\n\n` +

          `• ${prefix}cartoon\n` +
          `  └─ Download Sinhala cartoon\n\n` +

          `• ${prefix}anime\n` +
          `  └─ Download anime\n\n` +

          `• ${prefix}tiktok\n` +
          `  └─ Download TikTok video\n\n` +

          `• ${prefix}fb\n` +
          `  └─ Download Facebook video\n\n` +

          `• ${prefix}ig\n` +
          `  └─ Download Instagram media\n\n` +

          `• ${prefix}mediafire\n` +
          `  └─ Download MediaFire file\n\n` +

          `• ${prefix}image\n` +
          `  └─ Search images\n\n` +

          `╰━━━━━━━━━━━━━━━━━━━━╯`
      },

      '3': {
        title: '👑 OWNER MENU',

        body:
          `╭━━〔 👑 OWNER MENU 〕━━╮\n\n` +

          `• ${prefix}owner\n` +
          `  └─ Get owner contact\n\n` +

          `╰━━━━━━━━━━━━━━━━━━╯`
      },

      '4': {
        title: '👥 GROUP MANAGE MENU',

        body:
          `╭━━〔 👥 GROUP MANAGE 〕━━╮\n\n` +

          `• ${prefix}grup open\n` +
          `• ${prefix}grup close\n` +
          `• ${prefix}grup name\n` +
          `• ${prefix}grup desc\n` +
          `• ${prefix}grup lock\n` +
          `• ${prefix}grup unlock\n` +
          `• ${prefix}grup add\n` +
          `• ${prefix}grup kick\n` +
          `• ${prefix}grup promote\n` +
          `• ${prefix}grup demote\n` +
          `• ${prefix}grup tagall\n` +
          `• ${prefix}grup antilink\n` +
          `• ${prefix}grup antistatus\n\n` +

          `╰━━━━━━━━━━━━━━━━━━━━╯`
      },

      '5': {
        title: '🤖 AI SYSTEM',

        body:
          `╭━━〔 🤖 AI SYSTEM 〕━━╮\n\n` +

          `• ${prefix}ai\n` +
          `  └─ Chat with AI\n\n` +

          `• ${prefix}gpt\n` +
          `  └─ Ask ChatGPT\n\n` +

          `• ${prefix}gemini\n` +
          `  └─ Ask Gemini\n\n` +

          `• ${prefix}imagine\n` +
          `  └─ Generate AI image\n\n` +

          `💡 Example:\n` +
          `${prefix}ai Hello\n\n` +

          `╰━━━━━━━━━━━━━━━━━━╯`
      },

      '6': {
        title: '🌙 OTHER MENU',

        body:
          `╭━━〔 🌙 OTHER MENU 〕━━╮\n\n` +

          `• ${prefix}vv\n` +
          `  └─ Unlock view-once media\n\n` +

          `• ${prefix}send\n` +
          `  └─ Send media by URL\n\n` +

          `• ${prefix}getpp\n` +
          `  └─ Get profile picture\n\n` +

          `• ${prefix}tts\n` +
          `  └─ Text to voice\n\n` +

          `• ${prefix}short\n` +
          `  └─ Shorten URL\n\n` +

          `• ${prefix}qr\n` +
          `  └─ Generate QR code\n\n` +

          `• ${prefix}quote\n` +
          `  └─ Random quote\n\n` +

          `• ${prefix}weather\n` +
          `  └─ Check weather\n\n` +

          `╰━━━━━━━━━━━━━━━━━━╯`
      }
    };

    // =========================================================
    // IMPORTANT:
    // WAIT FOR USER REPLY
    // =========================================================

    const menuMessageId = menuMsg?.key?.id;

    if (!menuMessageId) {
      return;
    }

    const collected = await new Promise((resolve) => {

      let finished = false;

      const finish = (value) => {

        if (finished) return;

        finished = true;

        clearTimeout(timeout);

        try {
          socket.ev.off(
            'messages.upsert',
            listener
          );
        } catch (_) {}

        resolve(value);
      };

      const listener = ({ messages }) => {

        if (!Array.isArray(messages)) return;

        for (const incoming of messages) {

          if (!incoming?.message) continue;

          // Ignore bot's own message
          if (incoming.key?.fromMe) continue;

          const text = getText(
            incoming.message
          ).trim();

          // Only 1 - 6 accepted
          if (!/^[1-6]$/.test(text)) {
            continue;
          }

          // ---------------------------------------------------
          // Check whether user replied to THIS menu
          // ---------------------------------------------------

          const quotedId =
            getQuotedStanzaId(
              incoming.message
            );

          const isReplyToMenu =
            quotedId === menuMessageId;

          // ---------------------------------------------------
          // Fallback for some WhatsApp message formats
          // ---------------------------------------------------

          const remoteJid =
            normalizeJid(
              incoming.key?.remoteJid || ''
            );

          const originalJid =
            normalizeJid(sender);

          const sameChat =
            remoteJid === originalJid;

          const sameSender =
            sameUser(
              incoming,
              sender
            );

          /*
           * Accept when:
           *
           * 1. User directly replies to menu
           * OR
           * 2. Same chat + same sender
           *
           * This fixes normal "1", "2", etc.
           */

          if (
            (isReplyToMenu || sameChat) &&
            sameSender
          ) {

            finish(incoming);

            return;
          }
        }
      };

      // -------------------------------------------------------
      // Start listener
      // -------------------------------------------------------

      socket.ev.on(
        'messages.upsert',
        listener
      );

      // -------------------------------------------------------
      // 60 second timeout
      // -------------------------------------------------------

      const timeout = setTimeout(() => {
        finish(null);
      }, 60000);
    });

    // =========================================================
    // NO REPLY
    // =========================================================

    if (!collected) {
      return;
    }

    // =========================================================
    // GET CHOICE
    // =========================================================

    const choice =
      getText(
        collected.message
      ).trim();

    const chosen =
      subMenus[choice];

    if (!chosen) {
      return;
    }

    // =========================================================
    // REACT TO USER REPLY
    // =========================================================

    try {

      await socket.sendMessage(
        sender,
        {
          react: {
            text: '✅',
            key: collected.key
          }
        }
      );

    } catch (_) {}

    // =========================================================
    // SUB MENU CAPTION
    // =========================================================

    const subCaption =
      `╭━━━〔 🌸 *${botName}* 〕━━━╮\n` +
      `┃\n` +
      `┃ ${chosen.title}\n` +
      `┃\n` +
      `╰━━━━━━━━━━━━━━━━━━━━╯\n\n` +

      `${chosen.body}\n\n` +

      `🔗 *Pairing:* ${PAIRING_SITE}\n\n` +

      `> © Powered by *MIYORA MD* 🌸`;

    // =========================================================
    // SEND SUB MENU
    // =========================================================

    try {

      if (String(logo).startsWith('http')) {

        await socket.sendMessage(
          sender,
          {
            image: {
              url: logo
            },

            caption: subCaption,

            contextInfo: channelContext
          },
          {
            quoted: collected
          }
        );

      } else {

        try {

          const buffer =
            fs.readFileSync(logo);

          await socket.sendMessage(
            sender,
            {
              image: buffer,

              caption: subCaption,

              contextInfo: channelContext
            },
            {
              quoted: collected
            }
          );

        } catch (_) {

          if (config?.IMAGE_PATH) {

            await socket.sendMessage(
              sender,
              {
                image: {
                  url: config.IMAGE_PATH
                },

                caption: subCaption,

                contextInfo: channelContext
              },
              {
                quoted: collected
              }
            );

          } else {

            await socket.sendMessage(
              sender,
              {
                text: subCaption,

                contextInfo: channelContext
              },
              {
                quoted: collected
              }
            );
          }
        }
      }

    } catch (_) {

      await socket.sendMessage(
        sender,
        {
          text: subCaption,

          contextInfo: channelContext
        },
        {
          quoted: collected
        }
      );
    }
  }
};
