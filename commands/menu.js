// Command: menu (aliases: help, allmenu)
// Simple, clean, and modern menu style.
module.exports = {
  name: 'menu',
  aliases: ['help', 'allmenu'],
  async execute(ctx) {
    const {
      socket, msg, sender, from, command, args, q, reply,
      sessionConfig, number, prefix, config, BOT_NAME_FANCY,
      NEWSLETTER_CONTEXT, resolveReplyJid, downloadQuotedMedia,
      getSriLankaTimestamp, formatMessage, fs, path, os
    } = ctx;

      const sanitized = (number || '').replace(/[^0-9]/g, '');
      const cfg = sessionConfig || {};
      const botName = cfg.botName || BOT_NAME_FANCY;
      const logo    = cfg.logo    || config.IMAGE_PATH;

      // 🔗 Pairing Site Link
      const PAIRING_SITE = 'https://miyora.kurox.site';

      const channelContext = {
        forwardingScore: 1,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: NEWSLETTER_CONTEXT?.forwardedNewsletterMessageInfo?.newsletterJid || '',
          newsletterName: botName,
          serverMessageId: 999,
        }
      };

      const menuCaption = 
        `✨ *${botName} - MAIN MENU* ✨\n\n` +
        `Hello there! Please choose a category by replying with the corresponding number:\n\n` +
        `  1. 📋 Main Menu\n` +
        `  2. 📥 Download Menu\n` +
        `  3. 👑 Owner Menu\n` +
        `  4. 👥 Group Manage Menu\n` +
        `  5. 🤖 AI System\n` +
        `  6. 🌙 Other Menu\n\n` +
        `> *Reply with a number (1-6) to open the menu.*\n\n` +
        `🔗 *Pairing Site:* ${PAIRING_SITE}\n\n` +
        `© Powered by Black Cat OFC`;

      try {
        await socket.sendMessage(sender, {
          react: { text: '⚡', key: msg.key }
        });
      } catch (e) {}

      let menuMsg;
      try {
        if (String(logo).startsWith('http')) {
          menuMsg = await socket.sendMessage(sender, {
            image: { url: logo },
            caption: menuCaption,
            contextInfo: channelContext
          }, { quoted: msg });
        } else {
          try {
            const buf = fs.readFileSync(logo);
            menuMsg = await socket.sendMessage(sender, {
              image: buf,
              caption: menuCaption,
              contextInfo: channelContext
            }, { quoted: msg });
          } catch (_e) {
            menuMsg = await socket.sendMessage(sender, {
              image: { url: config.IMAGE_PATH },
              caption: menuCaption,
              contextInfo: channelContext
            }, { quoted: msg });
          }
        }
      } catch (e) {
        menuMsg = await socket.sendMessage(sender, {
          text: menuCaption,
          contextInfo: channelContext
        }, { quoted: msg });
      }

      const subMenus = {
        '1': {
          title: '📋 MAIN MENU',
          body:
            `• ${prefix}menu - Show this menu\n` +
            `• ${prefix}alive - Check bot status\n` +
            `• ${prefix}ping - Check bot speed`
        },
        '2': {
          title: '📥 DOWNLOAD MENU',
          body:
            `• ${prefix}song - Download YouTube song\n` +
            `• ${prefix}movie - Download Sinhala sub movie\n` +
            `• ${prefix}pcgame - Download PC games\n` +
            `• ${prefix}cartoon - Download Sinhala cartoon\n` +
            `• ${prefix}anime - Download anime\n` +
            `• ${prefix}tiktok - Download TikTok video\n` +
            `• ${prefix}fb - Download Facebook video\n` +
            `• ${prefix}ig - Download Instagram media\n` +
            `• ${prefix}mediafire - Download MediaFire file\n` +
            `• ${prefix}image - Search Google images`
        },
        '3': {
          title: '👑 OWNER MENU',
          body:
            `• ${prefix}owner - Get owner contact card`
        },
        '4': {
          title: '👥 GROUP MANAGE MENU',
          body:
            `• ${prefix}grup open - Open group\n` +
            `• ${prefix}grup close - Close group\n` +
            `• ${prefix}grup name - Change group name\n` +
            `• ${prefix}grup desc - Change group description\n` +
            `• ${prefix}grup lock - Lock group settings\n` +
            `• ${prefix}grup unlock - Unlock group settings\n` +
            `• ${prefix}grup add - Add member\n` +
            `• ${prefix}grup kick - Remove user\n` +
            `• ${prefix}grup promote - Make admin\n` +
            `• ${prefix}grup demote - Remove admin\n` +
            `• ${prefix}grup tagall - Tag all members\n` +
            `• ${prefix}grup antilink - Toggle anti-link\n` +
            `• ${prefix}grup antistatus - Toggle anti-status`
        },
        '5': {
          title: '🤖 AI SYSTEM',
          body:
            `• ${prefix}ai - Chat with AI assistant\n` +
            `• ${prefix}gpt - Ask from ChatGPT\n` +
            `• ${prefix}gemini - Ask from Gemini\n` +
            `• ${prefix}imagine - Generate AI image\n` +
            `Example: ${prefix}ai Hello`
        },
        '6': {
          title: '🌙 OTHER MENU',
          body:
            `• ${prefix}vv - Unlock view-once media\n` +
            `• ${prefix}send - Send media by url\n` +
            `• ${prefix}getpp - Get profile picture\n` +
            `• ${prefix}tts - Text to voice note\n` +
            `• ${prefix}short - Shorten URL\n` +
            `• ${prefix}qr - Generate QR code\n` +
            `• ${prefix}quote - Random inspiring quote\n` +
            `• ${prefix}weather - Check city weather`
        }
      };

      const menuListener = async (msgUpdate) => {
        const reply2 = msgUpdate.messages[0];
        if (!reply2 || !reply2.message) return;

        const isReplyToMenu = reply2.message?.extendedTextMessage?.contextInfo?.stanzaId === menuMsg.key.id;
        const isSame = resolveReplyJid(reply2) === sender;
        if (!isReplyToMenu || !isSame) return;

        const text = (reply2.message?.conversation || reply2.message?.extendedTextMessage?.text || '').trim();
        if (!['1', '2', '3', '4', '5', '6'].includes(text)) return;

        socket.ev.off('messages.upsert', menuListener);

        try {
          await socket.sendMessage(sender, { react: { text: '✅', key: reply2.key } });
        } catch (e) {}

        const chosen = subMenus[text];

        const subCaption = 
          `✨ *${botName} - ${chosen.title}* ✨\n\n` +
          `${chosen.body}\n\n` +
          `🔗 *Pairing Site:* ${PAIRING_SITE}\n\n` +
          `© Powered by Black Cat OFC`;

        try {
          if (String(logo).startsWith('http')) {
            await socket.sendMessage(sender, {
              image: { url: logo },
              caption: subCaption,
              contextInfo: channelContext
            }, { quoted: reply2 });
          } else {
            try {
              const buf = fs.readFileSync(logo);
              await socket.sendMessage(sender, {
                image: buf,
                caption: subCaption,
                contextInfo: channelContext
              }, { quoted: reply2 });
            } catch (_e) {
              await socket.sendMessage(sender, {
                image: { url: config.IMAGE_PATH },
                caption: subCaption,
                contextInfo: channelContext
              }, { quoted: reply2 });
            }
          }
        } catch (e) {
          await socket.sendMessage(sender, {
            text: subCaption,
            contextInfo: channelContext
          }, { quoted: reply2 });
        }
      };

      socket.ev.on('messages.upsert', menuListener);

      setTimeout(() => {
        try {
          socket.ev.off('messages.upsert', menuListener);
        } catch (e) {}
      }, 60000);

  }
};
