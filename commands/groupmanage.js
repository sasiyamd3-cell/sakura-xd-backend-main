// Command: groupmanage
// Aliases: gmanage, groupmenu, gm
// MIYORA MD - Group Management System

module.exports = {
  name: 'groupmanage',
  aliases: ['gmanage', 'groupmenu', 'gm'],

  async execute(ctx) {
    const {
      socket,
      msg,
      sender,
      from,
      args,
      q,
      reply,
      sessionConfig,
      prefix,
      config,
      BOT_NAME_FANCY
    } = ctx;

    // ============================================================
    // BASIC CHECK
    // ============================================================

    if (!from || !from.endsWith('@g.us')) {
      return reply(
        `꒰ᵎ ❌ *GROUP ONLY* ᵎ꒱\n\n` +
        `මේ command එක Group එකක් ඇතුළේ විතරයි භාවිතා කරන්න පුළුවන්.\n\n` +
        `🌸 *${BOT_NAME_FANCY}*`
      );
    }

    const cfg = sessionConfig || {};
    const botName = cfg.botName || BOT_NAME_FANCY;

    const groupMetadata = await socket.groupMetadata(from);

    const participants = groupMetadata.participants || [];

    const senderJid = sender;

    // ============================================================
    // JID HELPERS
    // ============================================================

    const getBaseNumber = (jid = '') =>
      jid.split('@')[0].replace(/[^0-9]/g, '');

    const normalizeJid = (value = '') => {
      let number = String(value)
        .replace(/[@\s+\-().]/g, '')
        .replace(/^0+/, '');

      if (!number) return null;

      // Sri Lanka local number support
      if (number.startsWith('0')) {
        number = '94' + number.substring(1);
      }

      if (!number.startsWith('94') && number.length === 9) {
        number = '94' + number;
      }

      return `${number}@s.whatsapp.net`;
    };

    const getMentionNumber = () => {
      const mentioned =
        msg?.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];

      if (mentioned.length) {
        return mentioned[0];
      }

      const quotedParticipant =
        msg?.message?.extendedTextMessage?.contextInfo?.participant;

      if (quotedParticipant) {
        return quotedParticipant;
      }

      if (args[0]) {
        return normalizeJid(args[0]);
      }

      return null;
    };

    // ============================================================
    // ADMIN CHECK
    // ============================================================

    const senderParticipant = participants.find(
      p => p.id === senderJid
    );

    const isSenderAdmin =
      senderParticipant &&
      (senderParticipant.admin === 'admin' ||
       senderParticipant.admin === 'superadmin');

    const botJid =
      socket.user?.id?.split(':')[0] +
      '@s.whatsapp.net';

    const botParticipant = participants.find(
      p =>
        p.id === socket.user?.id ||
        getBaseNumber(p.id) === getBaseNumber(socket.user?.id)
    );

    const isBotAdmin =
      botParticipant &&
      (botParticipant.admin === 'admin' ||
       botParticipant.admin === 'superadmin');

    const requireAdmin = async () => {
      if (!isSenderAdmin) {
        await reply(
          `꒰ᵎ 👑 *ADMIN ONLY* ᵎ꒱\n\n` +
          `මෙය Group Admin කෙනෙකුට විතරයි භාවිතා කරන්න පුළුවන්.\n\n` +
          `🌸 *${botName}*`
        );
        return false;
      }

      return true;
    };

    const requireBotAdmin = async () => {
      if (!isBotAdmin) {
        await reply(
          `꒰ᵎ ⚠️ *BOT IS NOT ADMIN* ᵎ꒱\n\n` +
          `මේ command එක වැඩ කරන්න Bot එකට Group Admin permission එක දෙන්න.\n\n` +
          `🌸 *${botName}*`
        );
        return false;
      }

      return true;
    };

    // ============================================================
    // COMMAND
    // ============================================================

    const command =
      String(ctx.command || '')
        .toLowerCase()
        .replace(prefix, '');

    // ============================================================
    // GROUP MENU
    // ============================================================

    if (
      command === 'groupmanage' ||
      command === 'gmanage' ||
      command === 'groupmenu' ||
      command === 'gm'
    ) {
      const menu =
        `🌸⃝⃘̉̉̉̉̉̉🧚‍♀️ *👥 ɢʀᴏᴜᴘ ᴍᴀɴᴀɢᴇ ᴍᴇɴᴜ* 🧚‍♀️🌸⃝⃘̉̉̉̉̉̉\n\n` +
        `┊ ┊ ✫ ˚♡ ⋆｡❀\n\n` +

        `❍ 👤 *ᴍᴇᴍʙᴇʀ ᴍᴀɴᴀɢᴇᴍᴇɴᴛ*\n` +
        `❍ *${prefix}add* ┊ Add a member\n` +
        `❍ *${prefix}kick* ┊ Remove a member\n` +
        `❍ *${prefix}promote* ┊ Promote to admin\n` +
        `❍ *${prefix}demote* ┊ Remove admin\n\n` +

        `❍ 📢 *ᴍᴇɴᴛɪᴏɴ ᴛᴏᴏʟꜱ*\n` +
        `❍ *${prefix}tagall* ┊ Tag all members\n` +
        `❍ *${prefix}hidetag* ┊ Hidden tag all\n\n` +

        `❍ ⚙️ *ɢʀᴏᴜᴘ ꜱᴇᴛᴛɪɴɢꜱ*\n` +
        `❍ *${prefix}setname* ┊ Change group name\n` +
        `❍ *${prefix}setdesc* ┊ Change description\n` +
        `❍ *${prefix}open* ┊ Open group\n` +
        `❍ *${prefix}close* ┊ Close group\n\n` +

        `❍ 🔗 *ɢʀᴏᴜᴘ ʟɪɴᴋ*\n` +
        `❍ *${prefix}link* ┊ Get invite link\n` +
        `❍ *${prefix}revoke* ┊ Reset invite link\n\n` +

        `❍ 📋 *ɢʀᴏᴜᴘ ɪɴꜰᴏ*\n` +
        `❍ *${prefix}groupinfo* ┊ Group information\n\n` +

        `🧚‍♀️ ©ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝐁ʟᴀ𝐜𝐤 𝐂ᴀᴛ 𝐎ꜰᴄ\n\n` +
        `𝐌𝐈𝐘𝐎𝐑𝐀 𝐌𝐃 🖤 | 𝐁ʟᴀ𝐜𝐤 𝐂ᴀᴛ 𝐎ꜰᴄ`;

      return reply(menu);
    }

    // ============================================================
    // ADD
    // ============================================================

    if (command === 'add') {
      if (!(await requireAdmin())) return;
      if (!(await requireBotAdmin())) return;

      const target = getMentionNumber();

      if (!target) {
        return reply(
          `꒰ᵎ ➕ *ADD MEMBER* ᵎ꒱\n\n` +
          `Number එකක් හෝ contact mention එකක් දෙන්න.\n\n` +
          `📌 Example:\n` +
          `*${prefix}add 947XXXXXXXX*\n\n` +
          `🌸 *${botName}*`
        );
      }

      try {
        const result = await socket.groupParticipantsUpdate(
          from,
          [target],
          'add'
        );

        return reply(
          `꒰ᵎ ✅ *MEMBER ADDED* ᵎ꒱\n\n` +
          `👤 @${getBaseNumber(target)}\n\n` +
          `🌸 *${botName}*`
        );
      } catch (err) {
        console.error('ADD ERROR:', err);

        return reply(
          `꒰ᵎ ❌ *ADD FAILED* ᵎ꒱\n\n` +
          `Member add කරන්න බැරි වුණා.\n\n` +
          `> ${err.message || 'Unknown error'}`
        );
      }
    }

    // ============================================================
    // KICK
    // ============================================================

    if (command === 'kick' || command === 'remove') {
      if (!(await requireAdmin())) return;
      if (!(await requireBotAdmin())) return;

      const target = getMentionNumber();

      if (!target) {
        return reply(
          `꒰ᵎ ❌ *KICK MEMBER* ᵎ꒱\n\n` +
          `Remove කරන්න ඕන member ව mention කරන්න හෝ number එක දෙන්න.\n\n` +
          `📌 *${prefix}kick 947XXXXXXXX*`
        );
      }

      try {
        await socket.groupParticipantsUpdate(
          from,
          [target],
          'remove'
        );

        return reply(
          `꒰ᵎ 🗑️ *MEMBER REMOVED* ᵎ꒱\n\n` +
          `👤 @${getBaseNumber(target)}\n\n` +
          `🌸 *${botName}*`
        );
      } catch (err) {
        console.error('KICK ERROR:', err);

        return reply(
          `꒰ᵎ ❌ *KICK FAILED* ᵎ꒱\n\n` +
          `${err.message || 'Unknown error'}`
        );
      }
    }

    // ============================================================
    // PROMOTE
    // ============================================================

    if (command === 'promote') {
      if (!(await requireAdmin())) return;
      if (!(await requireBotAdmin())) return;

      const target = getMentionNumber();

      if (!target) {
        return reply(
          `꒰ᵎ 👑 *PROMOTE ADMIN* ᵎ꒱\n\n` +
          `Promote කරන්න ඕන member ව mention කරන්න.\n\n` +
          `📌 *${prefix}promote @member*`
        );
      }

      try {
        await socket.groupParticipantsUpdate(
          from,
          [target],
          'promote'
        );

        return reply(
          `꒰ᵎ 👑 *ADMIN PROMOTED* ᵎ꒱\n\n` +
          `👤 @${getBaseNumber(target)}\n` +
          `✨ දැන් Group Admin කෙනෙක්.\n\n` +
          `🌸 *${botName}*`
        );
      } catch (err) {
        console.error('PROMOTE ERROR:', err);

        return reply(
          `꒰ᵎ ❌ *PROMOTE FAILED* ᵎ꒱\n\n` +
          `${err.message || 'Unknown error'}`
        );
      }
    }

    // ============================================================
    // DEMOTE
    // ============================================================

    if (command === 'demote') {
      if (!(await requireAdmin())) return;
      if (!(await requireBotAdmin())) return;

      const target = getMentionNumber();

      if (!target) {
        return reply(
          `꒰ᵎ 👤 *DEMOTE ADMIN* ᵎ꒱\n\n` +
          `Demote කරන්න ඕන Admin ව mention කරන්න.\n\n` +
          `📌 *${prefix}demote @admin*`
        );
      }

      try {
        await socket.groupParticipantsUpdate(
          from,
          [target],
          'demote'
        );

        return reply(
          `꒰ᵎ ✅ *ADMIN DEMOTED* ᵎ꒱\n\n` +
          `👤 @${getBaseNumber(target)}\n\n` +
          `🌸 *${botName}*`
        );
      } catch (err) {
        console.error('DEMOTE ERROR:', err);

        return reply(
          `꒰ᵎ ❌ *DEMOTE FAILED* ᵎ꒱\n\n` +
          `${err.message || 'Unknown error'}`
        );
      }
    }

    // ============================================================
    // TAG ALL
    // ============================================================

    if (command === 'tagall') {
      if (!(await requireAdmin())) return;

      const mentions = participants
        .map(p => p.id)
        .filter(Boolean);

      const message =
        `🌸⃝⃘̉̉̉̉̉̉🧚‍♀️ *ᴛᴀɢ ᴀʟʟ* 🧚‍♀️🌸⃝⃘̉̉̉̉̉̉\n\n` +
        `┊ ┊ ✫ ˚♡ ⋆｡❀\n\n` +
        `${q || '👋 Hello everyone!'}\n\n` +
        `> 👥 *Group Members:* ${mentions.length}\n\n` +
        `🧚‍♀️ *${botName}*`;

      return socket.sendMessage(
        from,
        {
          text: message,
          mentions
        },
        { quoted: msg }
      );
    }

    // ============================================================
    // HIDETAG
    // ============================================================

    if (command === 'hidetag') {
      if (!(await requireAdmin())) return;

      const mentions = participants
        .map(p => p.id)
        .filter(Boolean);

      return socket.sendMessage(
        from,
        {
          text: q || '🌸 Attention everyone!',
          mentions
        },
        { quoted: msg }
      );
    }

    // ============================================================
    // SET NAME
    // ============================================================

    if (command === 'setname') {
      if (!(await requireAdmin())) return;
      if (!(await requireBotAdmin())) return;

      const newName = args.join(' ').trim();

      if (!newName) {
        return reply(
          `꒰ᵎ ✏️ *SET GROUP NAME* ᵎ꒱\n\n` +
          `📌 Example:\n` +
          `*${prefix}setname MIYORA FAMILY*`
        );
      }

      try {
        await socket.groupUpdateSubject(from, newName);

        return reply(
          `꒰ᵎ ✅ *GROUP NAME UPDATED* ᵎ꒱\n\n` +
          `✨ ${newName}\n\n` +
          `🌸 *${botName}*`
        );
      } catch (err) {
        console.error('SETNAME ERROR:', err);

        return reply(
          `❌ Group name change කරන්න බැරි වුණා.\n\n` +
          `${err.message || 'Unknown error'}`
        );
      }
    }

    // ============================================================
    // SET DESCRIPTION
    // ============================================================

    if (command === 'setdesc' || command === 'setdescription') {
      if (!(await requireAdmin())) return;
      if (!(await requireBotAdmin())) return;

      const newDesc = args.join(' ').trim();

      if (!newDesc) {
        return reply(
          `꒰ᵎ 📝 *SET GROUP DESCRIPTION* ᵎ꒱\n\n` +
          `📌 Example:\n` +
          `*${prefix}setdesc Welcome to MIYORA FAMILY*`
        );
      }

      try {
        await socket.groupUpdateDescription(
          from,
          newDesc
        );

        return reply(
          `꒰ᵎ ✅ *DESCRIPTION UPDATED* ᵎ꒱\n\n` +
          `${newDesc}\n\n` +
          `🌸 *${botName}*`
        );
      } catch (err) {
        console.error('SETDESC ERROR:', err);

        return reply(
          `❌ Group description change කරන්න බැරි වුණා.\n\n` +
          `${err.message || 'Unknown error'}`
        );
      }
    }

    // ============================================================
    // OPEN GROUP
    // Everyone can send messages
    // ============================================================

    if (command === 'open') {
      if (!(await requireAdmin())) return;
      if (!(await requireBotAdmin())) return;

      try {
        await socket.groupSettingUpdate(
          from,
          'not_announcement'
        );

        return reply(
          `꒰ᵎ 🔓 *GROUP OPENED* ᵎ꒱\n\n` +
          `👥 දැන් සියලුම members ලට message කරන්න පුළුවන්.\n\n` +
          `🌸 *${botName}*`
        );
      } catch (err) {
        console.error('OPEN ERROR:', err);

        return reply(
          `❌ Group open කරන්න බැරි වුණා.\n\n` +
          `${err.message || 'Unknown error'}`
        );
      }
    }

    // ============================================================
    // CLOSE GROUP
    // Only admins can send messages
    // ============================================================

    if (command === 'close') {
      if (!(await requireAdmin())) return;
      if (!(await requireBotAdmin())) return;

      try {
        await socket.groupSettingUpdate(
          from,
          'announcement'
        );

        return reply(
          `꒰ᵎ 🔒 *GROUP CLOSED* ᵎ꒱\n\n` +
          `👑 දැන් Admin ලට විතරක් message කරන්න පුළුවන්.\n\n` +
          `🌸 *${botName}*`
        );
      } catch (err) {
        console.error('CLOSE ERROR:', err);

        return reply(
          `❌ Group close කරන්න බැරි වුණා.\n\n` +
          `${err.message || 'Unknown error'}`
        );
      }
    }

    // ============================================================
    // GROUP LINK
    // ============================================================

    if (command === 'link' || command === 'grouplink') {
      if (!(await requireAdmin())) return;
      if (!(await requireBotAdmin())) return;

      try {
        const code = await socket.groupInviteCode(from);

        const link =
          `https://chat.whatsapp.com/${code}`;

        return socket.sendMessage(
          from,
          {
            text:
              `꒰ᵎ 🔗 *GROUP INVITE LINK* ᵎ꒱\n\n` +
              `👥 *${groupMetadata.subject}*\n\n` +
              `🔗 ${link}\n\n` +
              `🌸 *${botName}*`
          },
          { quoted: msg }
        );
      } catch (err) {
        console.error('LINK ERROR:', err);

        return reply(
          `❌ Group link ලබාගන්න බැරි වුණා.\n\n` +
          `${err.message || 'Unknown error'}`
        );
      }
    }

    // ============================================================
    // REVOKE LINK
    // ============================================================

    if (command === 'revoke') {
      if (!(await requireAdmin())) return;
      if (!(await requireBotAdmin())) return;

      try {
        const newCode =
          await socket.groupRevokeInvite(from);

        const newLink =
          `https://chat.whatsapp.com/${newCode}`;

        return socket.sendMessage(
          from,
          {
            text:
              `꒰ᵎ ♻️ *GROUP LINK RESET* ᵎ꒱\n\n` +
              `⚠️ පරණ invite link එක invalidate කරලා තියෙනවා.\n\n` +
              `🔗 *New Link:*\n${newLink}\n\n` +
              `🌸 *${botName}*`
          },
          { quoted: msg }
        );
      } catch (err) {
        console.error('REVOKE ERROR:', err);

        return reply(
          `❌ Group link reset කරන්න බැරි වුණා.\n\n` +
          `${err.message || 'Unknown error'}`
        );
      }
    }

    // ============================================================
    // GROUP INFO
    // ============================================================

    if (
      command === 'groupinfo' ||
      command === 'ginfo'
    ) {
      const admins = participants.filter(
        p =>
          p.admin === 'admin' ||
          p.admin === 'superadmin'
      );

      const owner =
        groupMetadata.owner ||
        groupMetadata.subjectOwner ||
        'Unknown';

      const creation =
        groupMetadata.creation
          ? new Date(
              groupMetadata.creation * 1000
            ).toLocaleString('en-GB', {
              timeZone: 'Asia/Colombo'
            })
          : 'Unknown';

      const info =
        `🌸⃝⃘̉̉̉̉̉̉🧚‍♀️ *📋 ɢʀᴏᴜᴘ ɪɴꜰᴏ* 🧚‍♀️🌸⃝⃘̉̉̉̉̉̉\n\n` +
        `┊ ┊ ✫ ˚♡ ⋆｡❀\n\n` +

        `❍ 🏷️ *Name* ┊ ${groupMetadata.subject}\n` +
        `❍ 👥 *Members* ┊ ${participants.length}\n` +
        `❍ 👑 *Admins* ┊ ${admins.length}\n` +
        `❍ 🆔 *Group ID* ┊ ${from}\n` +
        `❍ 📅 *Created* ┊ ${creation}\n` +
        `❍ 👤 *Owner* ┊ ${getBaseNumber(owner)}\n\n` +

        `🧚‍♀️ ©ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝐁ʟᴀ𝐜𝐤 𝐂ᴀᴛ 𝐎ꜰᴄ\n\n` +
        `𝐌𝐈𝐘𝐎𝐑𝐀 𝐌𝐃 🖤 | 𝐁ʟᴀ𝐜𝐤 𝐂ᴀᴛ 𝐎ꜰᴄ`;

      return reply(info);
    }

    // ============================================================
    // UNKNOWN GROUP COMMAND
    // ============================================================

    const groupCommands = [
      'add',
      'kick',
      'remove',
      'promote',
      'demote',
      'tagall',
      'hidetag',
      'setname',
      'setdesc',
      'setdescription',
      'open',
      'close',
      'link',
      'grouplink',
      'revoke',
      'groupinfo',
      'ginfo'
    ];

    if (groupCommands.includes(command)) {
      return reply(
        `❌ Command එක process කරන්න බැරි වුණා.\n\n` +
        `*${prefix}groupmanage* දාලා Group Manage Menu එක බලන්න.`
      );
    }
  }
};
