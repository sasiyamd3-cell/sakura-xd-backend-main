// Command: groupmanage
// Aliases: gmanage, gm
// MIYORA MD - Group Management System

module.exports = {
  name: 'groupmanage',
  aliases: ['gmanage', 'gm'],

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
      prefix,
      config,
      BOT_NAME_FANCY,
      resolveReplyJid
    } = ctx;

    const cfg = sessionConfig || {};
    const botName = '𝐌𝐈𝐘𝐎𝐑𝐀 𝐌𝐃';

    // =========================================================
    // CHECK GROUP
    // =========================================================

    if (!from || !from.endsWith('@g.us')) {
      return reply(
        `🌸⃝⃘̉̉̉̉̉̉🧚‍♀️ *𝐌𝐈𝐘𝐎𝐑𝐀 𝐌𝐃* 🧚‍♀️🌸⃝⃘̉̉̉̉̉̉\n\n` +
        `❌ This command can only be used in a group.`
      );
    }

    // =========================================================
    // GET GROUP METADATA
    // =========================================================

    let metadata;

    try {
      metadata = await socket.groupMetadata(from);
    } catch (err) {
      console.error('MIYORA Group Metadata Error:', err);

      return reply(
        `❌ *Failed to get group information!*\n\n` +
        `Please try again.`
      );
    }

    const participants = metadata.participants || [];

    // =========================================================
    // BOT JID
    // =========================================================

    const botNumber = socket.user?.id
      ?.split(':')[0]
      ?.split('@')[0];

    const botJid = botNumber
      ? `${botNumber}@s.whatsapp.net`
      : null;

    // =========================================================
    // ADMIN CHECK
    // =========================================================

    const getParticipant = (jid) => {
      return participants.find(p => p.id === jid);
    };

    const isAdmin = (jid) => {
      const user = getParticipant(jid);

      return !!(
        user &&
        (
          user.admin === 'admin' ||
          user.admin === 'superadmin'
        )
      );
    };

    const senderIsAdmin = isAdmin(sender);
    const botIsAdmin = botJid ? isAdmin(botJid) : false;

    // =========================================================
    // HELPERS
    // =========================================================

    const adminOnly = async () => {
      if (!senderIsAdmin) {
        await reply(
          `🌸⃝⃘̉̉̉̉̉̉🧚‍♀️ *𝐌𝐈𝐘𝐎𝐑𝐀 𝐌𝐃* 🧚‍♀️🌸⃝⃘̉̉̉̉̉̉\n\n` +
          `❌ *Admin Only!*\n\n` +
          `මෙම command එක භාවිතා කරන්න group admin කෙනෙක් විය යුතුයි.`
        );

        return false;
      }

      return true;
    };

    const botAdminOnly = async () => {
      if (!botIsAdmin) {
        await reply(
          `🌸⃝⃘̉̉̉̉̉̉🧚‍♀️ *𝐌𝐈𝐘𝐎𝐑𝐀 𝐌𝐃* 🧚‍♀️🌸⃝⃘̉̉̉̉̉̉\n\n` +
          `❌ *Bot Is Not Admin!*\n\n` +
          `MIYORA MD bot එකට group admin permission දෙන්න.`
        );

        return false;
      }

      return true;
    };

    const getMentioned = () => {
      return (
        msg?.message?.extendedTextMessage?.contextInfo?.mentionedJid ||
        []
      );
    };

    const getQuotedParticipant = () => {
      return msg?.message
        ?.extendedTextMessage
        ?.contextInfo
        ?.participant;
    };

    const getTarget = () => {
      const mentioned = getMentioned();

      if (mentioned.length > 0) {
        return mentioned[0];
      }

      const quoted = getQuotedParticipant();

      if (quoted) {
        return quoted;
      }

      const firstArg =
        args?.[0] ||
        (q || '').split(/\s+/)[0];

      if (firstArg) {
        const number = firstArg.replace(/[^0-9]/g, '');

        if (number.length >= 7) {
          return `${number}@s.whatsapp.net`;
        }
      }

      return null;
    };

    const footer =
      `\n\n🧚‍♀️ *©ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝐁ʟᴀ𝐜𝐤 𝐂ᴀ𝐭 𝐎ꜰᴄ*\n\n` +
      `*𝐌𝐈𝐘𝐎𝐑𝐀 𝐌𝐃* 🖤 | *𝐁ʟᴀᴄ𝐤 𝐂ᴀᴛ 𝐎ꜰᴄ*`;

    const sendSuccess = async (text) => {
      return reply(
        `🌸⃝⃘̉̉̉̉̉̉🧚‍♀️ *𝐌𝐈𝐘𝐎𝐑𝐀 𝐌𝐃* 🧚‍♀️🌸⃝⃘̉̉̉̉̉̉\n\n` +
        `${text}` +
        footer
      );
    };

    // =========================================================
    // GROUP MANAGE MENU
    // =========================================================

    const menuCaption =
      `🌸⃝⃘̉̉̉̉̉̉🧚‍♀️ *👥 ɢʀᴏᴜᴘ ᴍᴀɴᴀɢᴇ ᴍᴇɴᴜ* 🧚‍♀️🌸⃝⃘̉̉̉̉̉̉\n\n` +
      `┊ ┊ ✫ ˚♡ ⋆｡❀\n\n` +

      `❍ 👤 ᴍᴇᴍʙᴇʀ ᴍᴀɴᴀɢᴇᴍᴇɴᴛ\n` +
      `❍ *${prefix}add* ┊ Add a member\n` +
      `❍ *${prefix}kick* ┊ Remove a member\n` +
      `❍ *${prefix}promote* ┊ Promote to admin\n` +
      `❍ *${prefix}demote* ┊ Remove admin\n\n` +

      `❍ 📢 ᴍᴇɴᴛɪᴏɴ ᴛᴏᴏʟꜱ\n` +
      `❍ *${prefix}tagall* ┊ Tag all members\n` +
      `❍ *${prefix}hidetag* ┊ Hidden tag all\n\n` +

      `❍ ⚙️ ɢʀᴏᴜᴘ ꜱᴇᴛᴛɪɴɢꜱ\n` +
      `❍ *${prefix}setname* ┊ Change group name\n` +
      `❍ *${prefix}setdesc* ┊ Change group description\n` +
      `❍ *${prefix}open* ┊ Open group\n` +
      `❍ *${prefix}close* ┊ Close group\n\n` +

      `❍ 🔗 ɢʀᴏᴜᴘ ʟɪɴᴋ\n` +
      `❍ *${prefix}link* ┊ Get group invite link\n` +
      `❍ *${prefix}revoke* ┊ Reset group invite link\n\n` +

      `❍ 📋 ɢʀᴏᴜᴘ ɪɴꜰᴏ\n` +
      `❍ *${prefix}groupinfo* ┊ View group information\n\n` +

      `🧚‍♀️ *©ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝐁ʟᴀᴄ𝐤 𝐂ᴀᴛ 𝐎ꜰᴄ*\n\n` +
      `*𝐌𝐈𝐘𝐎𝐑𝐀 𝐌𝐃* 🖤 | *𝐁ʟᴀᴄ𝐤 𝐂ᴀᴛ 𝐎ꜰᴄ*`;

    // =========================================================
    // MAIN MENU
    // =========================================================

    if (
      command === 'groupmanage' ||
      command === 'gmanage' ||
      command === 'gm'
    ) {
      await socket.sendMessage(sender, {
        react: {
          text: '👥',
          key: msg.key
        }
      });

      return reply(menuCaption);
    }

    // =========================================================
    // ADD
    // =========================================================

    if (command === 'add') {
      if (!(await adminOnly())) return;
      if (!(await botAdminOnly())) return;

      const input = (q || args?.join(' ') || '').trim();

      if (!input) {
        return reply(
          `꒰ᵎ 👤 *Add Member* ᵎ꒱\n\n` +
          `❌ Please provide a phone number!\n\n` +
          `📌 *Usage:* ${prefix}add 947XXXXXXXX\n\n` +
          `˚₊‧꒰ა 🌸 ໒꒱‧₊˚\n` +
          `*${botName}* 🖤`
        );
      }

      const numbers = input
        .split(/[\s,]+/)
        .map(n => n.replace(/[^0-9]/g, ''))
        .filter(n => n.length >= 7);

      if (!numbers.length) {
        return reply(`❌ Invalid phone number!`);
      }

      try {
        await socket.groupParticipantsUpdate(
          from,
          numbers.map(n => `${n}@s.whatsapp.net`),
          'add'
        );

        return sendSuccess(
          `✅ *Member Add Request Sent!*\n\n` +
          `👤 *Number(s):* ${numbers.join(', ')}`
        );
      } catch (err) {
        console.error('MIYORA ADD ERROR:', err);

        return reply(
          `❌ *Add Failed!*\n\n${err.message}`
        );
      }
    }

    // =========================================================
    // KICK
    // =========================================================

    if (command === 'kick') {
      if (!(await adminOnly())) return;
      if (!(await botAdminOnly())) return;

      const target = getTarget();

      if (!target) {
        return reply(
          `꒰ᵎ 👢 *Kick Member* ᵎ꒱\n\n` +
          `❌ Tag a member or reply to their message.\n\n` +
          `📌 *Usage:* ${prefix}kick @user`
        );
      }

      if (target === botJid) {
        return reply(`❌ I cannot remove myself.`);
      }

      if (isAdmin(target)) {
        return reply(`❌ You cannot remove another admin.`);
      }

      try {
        await socket.groupParticipantsUpdate(
          from,
          [target],
          'remove'
        );

        return sendSuccess(
          `✅ *Member Removed Successfully!*\n\n` +
          `👤 @${target.split('@')[0]}`
        );
      } catch (err) {
        console.error('MIYORA KICK ERROR:', err);

        return reply(
          `❌ *Kick Failed!*\n\n${err.message}`
        );
      }
    }

    // =========================================================
    // PROMOTE
    // =========================================================

    if (command === 'promote') {
      if (!(await adminOnly())) return;
      if (!(await botAdminOnly())) return;

      const target = getTarget();

      if (!target) {
        return reply(
          `꒰ᵎ 👑 *Promote Member* ᵎ꒱\n\n` +
          `❌ Tag or reply to a member.\n\n` +
          `📌 *Usage:* ${prefix}promote @user`
        );
      }

      if (isAdmin(target)) {
        return reply(`ℹ️ This member is already an admin.`);
      }

      try {
        await socket.groupParticipantsUpdate(
          from,
          [target],
          'promote'
        );

        return sendSuccess(
          `👑 *Promoted Successfully!*\n\n` +
          `👤 @${target.split('@')[0]} is now an admin.`
        );
      } catch (err) {
        console.error('MIYORA PROMOTE ERROR:', err);

        return reply(
          `❌ *Promote Failed!*\n\n${err.message}`
        );
      }
    }

    // =========================================================
    // DEMOTE
    // =========================================================

    if (command === 'demote') {
      if (!(await adminOnly())) return;
      if (!(await botAdminOnly())) return;

      const target = getTarget();

      if (!target) {
        return reply(
          `꒰ᵎ 👤 *Demote Member* ᵎ꒱\n\n` +
          `❌ Tag or reply to an admin.\n\n` +
          `📌 *Usage:* ${prefix}demote @user`
        );
      }

      if (!isAdmin(target)) {
        return reply(`ℹ️ This member is not an admin.`);
      }

      if (target === botJid) {
        return reply(`❌ I cannot demote myself.`);
      }

      try {
        await socket.groupParticipantsUpdate(
          from,
          [target],
          'demote'
        );

        return sendSuccess(
          `✅ *Admin Removed Successfully!*\n\n` +
          `👤 @${target.split('@')[0]}`
        );
      } catch (err) {
        console.error('MIYORA DEMOTE ERROR:', err);

        return reply(
          `❌ *Demote Failed!*\n\n${err.message}`
        );
      }
    }

    // =========================================================
    // TAG ALL
    // =========================================================

    if (command === 'tagall') {
      if (!(await adminOnly())) return;

      const members = participants
        .map(p => p.id)
        .filter(Boolean);

      const message =
        (q || args?.join(' ') || '').trim() ||
        'Attention everyone!';

      let text =
        `🌸⃝⃘̉̉̉̉̉̉🧚‍♀️ *👥 ᴛᴀɢᴀʟʟ* 🧚‍♀️🌸⃝⃘̉̉̉̉̉̉\n\n` +
        `${message}\n\n`;

      for (const member of members) {
        text += `@${member.split('@')[0]} `;
      }

      return socket.sendMessage(
        from,
        {
          text,
          mentions: members
        },
        { quoted: msg }
      );
    }

    // =========================================================
    // HIDETAG
    // =========================================================

    if (command === 'hidetag') {
      if (!(await adminOnly())) return;

      const members = participants
        .map(p => p.id)
        .filter(Boolean);

      const message =
        (q || args?.join(' ') || '').trim() ||
        `📢 *${metadata.subject || 'Group'}*`;

      return socket.sendMessage(
        from,
        {
          text: message,
          mentions: members
        },
        { quoted: msg }
      );
    }

    // =========================================================
    // SET NAME
    // =========================================================

    if (command === 'setname') {
      if (!(await adminOnly())) return;
      if (!(await botAdminOnly())) return;

      const newName =
        (q || args?.join(' ') || '').trim();

      if (!newName) {
        return reply(
          `❌ *Usage:*\n\n${prefix}setname New Group Name`
        );
      }

      try {
        await socket.groupUpdateSubject(
          from,
          newName
        );

        return sendSuccess(
          `🏷️ *Group Name Updated!*\n\n` +
          `✨ ${newName}`
        );
      } catch (err) {
        console.error('MIYORA SETNAME ERROR:', err);

        return reply(
          `❌ *Failed!*\n\n${err.message}`
        );
      }
    }

    // =========================================================
    // SET DESCRIPTION
    // =========================================================

    if (command === 'setdesc') {
      if (!(await adminOnly())) return;
      if (!(await botAdminOnly())) return;

      const description =
        (q || args?.join(' ') || '').trim();

      if (!description) {
        return reply(
          `❌ *Usage:*\n\n${prefix}setdesc New Description`
        );
      }

      try {
        await socket.groupUpdateDescription(
          from,
          description
        );

        return sendSuccess(
          `📝 *Group Description Updated!*\n\n` +
          `${description}`
        );
      } catch (err) {
        console.error('MIYORA SETDESC ERROR:', err);

        return reply(
          `❌ *Failed!*\n\n${err.message}`
        );
      }
    }

    // =========================================================
    // OPEN GROUP
    // =========================================================

    if (command === 'open') {
      if (!(await adminOnly())) return;
      if (!(await botAdminOnly())) return;

      try {
        await socket.groupSettingUpdate(
          from,
          'not_announcement'
        );

        return sendSuccess(
          `🔓 *Group Opened!*\n\n` +
          `Everyone can send messages now.`
        );
      } catch (err) {
        console.error('MIYORA OPEN ERROR:', err);

        return reply(
          `❌ *Open Failed!*\n\n${err.message}`
        );
      }
    }

    // =========================================================
    // CLOSE GROUP
    // =========================================================

    if (command === 'close') {
      if (!(await adminOnly())) return;
      if (!(await botAdminOnly())) return;

      try {
        await socket.groupSettingUpdate(
          from,
          'announcement'
        );

        return sendSuccess(
          `🔒 *Group Closed!*\n\n` +
          `Only admins can send messages now.`
        );
      } catch (err) {
        console.error('MIYORA CLOSE ERROR:', err);

        return reply(
          `❌ *Close Failed!*\n\n${err.message}`
        );
      }
    }

    // =========================================================
    // GROUP LINK
    // =========================================================

    if (command === 'link') {
      if (!(await adminOnly())) return;
      if (!(await botAdminOnly())) return;

      try {
        const code =
          await socket.groupInviteCode(from);

        return reply(
          `🌸⃝⃘̉̉̉̉̉̉🧚‍♀️ *🔗 ɢʀᴏᴜᴘ ʟɪɴᴋ* 🧚‍♀️🌸⃝⃘̉̉̉̉̉̉\n\n` +
          `┊ ┊ ✫ ˚♡ ⋆｡❀\n\n` +
          `🔗 *https://chat.whatsapp.com/${code}*\n\n` +
          `🌸 *${botName}* 🖤`
        );
      } catch (err) {
        console.error('MIYORA LINK ERROR:', err);

        return reply(
          `❌ *Failed to get group link!*\n\n${err.message}`
        );
      }
    }

    // =========================================================
    // REVOKE LINK
    // =========================================================

    if (command === 'revoke') {
      if (!(await adminOnly())) return;
      if (!(await botAdminOnly())) return;

      try {
        await socket.groupRevokeInvite(from);

        return sendSuccess(
          `🔄 *Group Link Reset Successfully!*\n\n` +
          `The previous invite link is no longer valid.`
        );
      } catch (err) {
        console.error('MIYORA REVOKE ERROR:', err);

        return reply(
          `❌ *Revoke Failed!*\n\n${err.message}`
        );
      }
    }

    // =========================================================
    // GROUP INFO
    // =========================================================

    if (command === 'groupinfo') {
      const admins = participants.filter(
        p =>
          p.admin === 'admin' ||
          p.admin === 'superadmin'
      );

      const owner =
        metadata.owner ||
        metadata.subjectOwner ||
        'Unknown';

      const info =
        `🌸⃝⃘̉̉̉̉̉̉🧚‍♀️ *📋 ɢʀᴏᴜᴘ ɪɴꜰᴏ* 🧚‍♀️🌸⃝⃘̉̉̉̉̉̉\n\n` +
        `┊ ┊ ✫ ˚♡ ⋆｡❀\n\n` +
        `❍ 🏷️ *Name* ┊ ${metadata.subject || 'Unknown'}\n` +
        `❍ 👥 *Members* ┊ ${participants.length}\n` +
        `❍ 👑 *Admins* ┊ ${admins.length}\n` +
        `❍ 🆔 *Group ID* ┊ ${from}\n` +
        `❍ 👤 *Owner* ┊ ${owner}\n\n` +
        `🧚‍♀️ *©ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝐁ʟᴀ𝐜𝐤 𝐂ᴀᴛ 𝐎ꜰᴄ*\n\n` +
        `*𝐌𝐈𝐘𝐎𝐑𝐀 𝐌𝐃* 🖤 | *𝐁ʟᴀ𝐜𝐤 𝐂ᴀᴛ 𝐎ꜰᴄ*`;

      return reply(info);
    }

    // =========================================================
    // UNKNOWN
    // =========================================================

    return reply(
      `🌸⃝⃘̉̉̉̉̉̉🧚‍♀️ *𝐌𝐈𝐘𝐎𝐑𝐀 𝐌𝐃* 🧚‍♀️🌸⃝⃘̉̉̉̉̉̉\n\n` +
      `❌ Unknown Group Management Command.\n\n` +
      `Use *${prefix}groupmanage* to view the menu.`
    );
  }
};
