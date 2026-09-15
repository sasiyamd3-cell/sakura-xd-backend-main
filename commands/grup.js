// Command: grup
// Group Management Commands
// File: commands/grup.js

module.exports = {
  name: 'grup',
  aliases: ['groupmanage', 'gmanage'],

  async execute(ctx) {
    const {
      socket,
      msg,
      sender,
      from,
      args,
      q,
      reply,
      isGroup,
      groupAdmins,
      participants,
      groupMetadata,
      isOwner,
      resolveReplyJid,
      prefix,
      config,
      BOT_NAME_FANCY,
      sessionConfig,
      NEWSLETTER_CONTEXT
    } = ctx;

    // ============================================================
    // HELPERS
    // ============================================================

    const cfg = sessionConfig || {};
    const botName = cfg.botName || BOT_NAME_FANCY || '𝐌𝐈𝐘𝐎𝐑𝐀 𝐌𝐃';

    const getDigits = (jid) => {
      if (!jid) return '';

      return String(jid)
        .split('@')[0]
        .split(':')[0]
        .replace(/[^0-9]/g, '')
        .slice(-8);
    };

    const getBotJid = () => {
      return (
        socket?.user?.id ||
        socket?.user?.lid ||
        ''
      );
    };

    const isAdmin = (jid) => {
      if (!jid) return false;

      const target = getDigits(jid);

      return (groupAdmins || []).some(
        admin => getDigits(admin) === target
      );
    };

    const permission = () => {
      if (!isGroup) return 'not_group';

      const botAdmin = isAdmin(getBotJid());
      const userAdmin = isAdmin(sender);

      if (!botAdmin) return 'bot_not_admin';
      if (!isOwner && !userAdmin) return 'not_admin';

      return 'ok';
    };

    const checkGroup = () => {
      if (!isGroup) {
        reply('❌ *This command can only be used inside a group.*');
        return false;
      }

      return true;
    };

    const checkAdmin = () => {
      if (!checkGroup()) return false;

      const perm = permission();

      if (perm === 'bot_not_admin') {
        reply('❌ *Please make me an Admin first.*');
        return false;
      }

      if (perm === 'not_admin') {
        reply('❌ *Admin Only!*');
        return false;
      }

      return true;
    };

    const getTarget = () => {
      let target = null;

      // Reply
      if (msg?.message?.extendedTextMessage?.contextInfo?.participant) {
        target =
          msg.message.extendedTextMessage.contextInfo.participant;
      }

      // Some bot frameworks expose quoted sender
      if (!target && msg?.quoted?.sender) {
        target = msg.quoted.sender;
      }

      // Mention
      if (!target && msg?.mentionedJid?.length) {
        target = msg.mentionedJid[0];
      }

      // ctx / message object variants
      if (!target && msg?.mentionedJid?.[0]) {
        target = msg.mentionedJid[0];
      }

      // Number
      if (!target && q) {
        const number = String(q).replace(/[^0-9]/g, '');

        if (number.length >= 8) {
          target = `${number}@s.whatsapp.net`;
        }
      }

      return target;
    };

    const footer =
      `\n\n🧚‍♀️ *©ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝐁ʟᴀᴄ𝐤 𝐂ᴀᴛ 𝐎ꜰᴄ*\n\n` +
      `*${botName}* 🖤 | *𝐁ʟᴀᴄ𝐤 𝐂ᴀᴛ 𝐎ꜰᴄ*`;

    const groupMenu = () => {
      return (
        `🌸⃝⃘̉̉̉̉̉̉🧚‍♀️ 👥 *ɢʀᴏᴜᴘ ᴍᴀɴᴀɢᴇ ᴍᴇɴᴜ* 🧚‍♀️🌸⃝⃘̉̉̉̉̉̉\n\n` +
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
        `❍ *${prefix}mute* ┊ Close group\n` +
        `❍ *${prefix}unmute* ┊ Open group\n` +
        `❍ *${prefix}setname* ┊ Change group name\n` +
        `❍ *${prefix}setdesc* ┊ Change group description\n\n` +

        `❍ 🔗 *ɢʀᴏᴜᴘ ʟɪɴᴋ*\n` +
        `❍ *${prefix}link* ┊ Get group invite link\n` +
        `❍ *${prefix}revoke* ┊ Reset group invite link\n\n` +

        `❍ 📋 *ɢʀᴏᴜᴘ ɪɴꜰᴏ*\n` +
        `❍ *${prefix}groupinfo* ┊ View group information\n\n` +

        `❍ 🚪 *ᴏᴛʜᴇʀ*\n` +
        `❍ *${prefix}kickall* ┊ Remove non-admin members\n` +
        `❍ *${prefix}left* ┊ Leave group` +

        footer
      );
    };

    // ============================================================
    // .grup
    // ============================================================

    if (args.length === 0) {
      if (!checkGroup()) return;

      return reply(groupMenu());
    }

    const action = String(args[0]).toLowerCase();

    // ============================================================
    // KICK
    // ============================================================

    if (action === 'kick') {
      if (!checkAdmin()) return;

      const target = getTarget();

      if (!target) {
        return reply(
          `❌ *Please reply to a member's message, mention them, or provide their number.*\n\n` +
          `📌 Example:\n` +
          `*${prefix}kick 947xxxxxxxxx*`
        );
      }

      try {
        await socket.groupParticipantsUpdate(
          from,
          [target],
          'remove'
        );

        await socket.sendMessage(
          from,
          {
            text:
              `🌸 *ɢʀᴏᴜᴘ ᴍᴀɴᴀɢᴇᴍᴇɴᴛ*\n\n` +
              `👤 *User:* @${target.split('@')[0]}\n` +
              `🚫 *Action:* Member Removed\n` +
              `👮 *By:* @${sender.split('@')[0]}` +
              footer,
            mentions: [target, sender]
          },
          { quoted: msg }
        );
      } catch (error) {
        console.error('Kick Error:', error);

        return reply(
          `❌ *Unable to remove this member.*\n\n` +
          `Possible reasons:\n` +
          `• Member is not in the group\n` +
          `• Bot does not have enough permissions\n` +
          `• WhatsApp rejected the request`
        );
      }

      return;
    }

    // ============================================================
    // PROMOTE
    // ============================================================

    if (action === 'promote') {
      if (!checkAdmin()) return;

      const target = getTarget();

      if (!target) {
        return reply(
          `❌ *Reply to a member, mention them, or provide their number.*\n\n` +
          `📌 Example:\n` +
          `*${prefix}promote 947xxxxxxxxx*`
        );
      }

      try {
        await socket.groupParticipantsUpdate(
          from,
          [target],
          'promote'
        );

        return socket.sendMessage(
          from,
          {
            text:
              `🌸 *ɢʀᴏᴜᴘ ᴍᴀɴᴀɢᴇᴍᴇɴᴛ*\n\n` +
              `👤 *User:* @${target.split('@')[0]}\n` +
              `⭐ *Status:* Promoted to Admin\n` +
              `👮 *By:* @${sender.split('@')[0]}` +
              footer,
            mentions: [target, sender]
          },
          { quoted: msg }
        );
      } catch (error) {
        console.error('Promote Error:', error);

        return reply(
          `❌ *Unable to promote this member.*`
        );
      }
    }

    // ============================================================
    // DEMOTE
    // ============================================================

    if (action === 'demote') {
      if (!checkAdmin()) return;

      const target = getTarget();

      if (!target) {
        return reply(
          `❌ *Reply to an admin, mention them, or provide their number.*`
        );
      }

      try {
        await socket.groupParticipantsUpdate(
          from,
          [target],
          'demote'
        );

        return socket.sendMessage(
          from,
          {
            text:
              `🌸 *ɢʀᴏᴜᴘ ᴍᴀɴᴀɢᴇᴍᴇɴᴛ*\n\n` +
              `👤 *User:* @${target.split('@')[0]}\n` +
              `📉 *Status:* Admin Removed\n` +
              `👮 *By:* @${sender.split('@')[0]}` +
              footer,
            mentions: [target, sender]
          },
          { quoted: msg }
        );
      } catch (error) {
        console.error('Demote Error:', error);

        return reply(
          `❌ *Unable to demote this member.*`
        );
      }
    }

    // ============================================================
    // ADD
    // ============================================================

    if (action === 'add') {
      if (!checkAdmin()) return;

      if (!q) {
        return reply(
          `❌ *Please provide a phone number.*\n\n` +
          `📌 Example:\n` +
          `*${prefix}add 947xxxxxxxxx*`
        );
      }

      const numbers = String(q)
        .split(',')
        .map(n => n.replace(/[^0-9]/g, ''))
        .filter(n => n.length >= 8);

      if (!numbers.length) {
        return reply(`❌ *No valid phone number found.*`);
      }

      let resultText = `🌸 *ᴀᴅᴅ ᴍᴇᴍʙᴇʀ ʀᴇꜱᴜʟᴛ*\n\n`;

      for (const number of numbers) {
        try {
          const waResult = await socket.onWhatsApp(number);

          if (!waResult || !waResult.length || !waResult[0]?.exists) {
            resultText += `❌ *${number}* ┊ WhatsApp account not found\n`;
            continue;
          }

          const jid = waResult[0].jid || `${number}@s.whatsapp.net`;

          const response =
            await socket.groupParticipantsUpdate(
              from,
              [jid],
              'add'
            );

          const status = response?.[0]?.status;

          if (status === '200') {
            resultText += `✅ *${number}* ┊ Added successfully\n`;
          } else if (status === '409') {
            resultText += `⚠️ *${number}* ┊ Already in group\n`;
          } else if (status === '403') {
            resultText += `⚠️ *${number}* ┊ Invite required\n`;
          } else if (status === '408') {
            resultText += `⚠️ *${number}* ┊ Could not add directly\n`;
          } else {
            resultText += `❌ *${number}* ┊ Failed (${status || 'unknown'})\n`;
          }

        } catch (error) {
          console.error('Add Error:', error);

          resultText +=
            `❌ *${number}* ┊ Error while adding\n`;
        }
      }

      return reply(resultText + footer);
    }

    // ============================================================
    // MUTE / CLOSE
    // ============================================================

    if (
      action === 'mute' ||
      action === 'close'
    ) {
      if (!checkAdmin()) return;

      try {
        await socket.groupSettingUpdate(
          from,
          'announcement'
        );

        return socket.sendMessage(
          from,
          {
            text:
              `🔒 *ɢʀᴏᴜᴘ ᴍᴜᴛᴇᴅ*\n\n` +
              `✅ Only admins can send messages now.\n` +
              `👮 *By:* @${sender.split('@')[0]}` +
              footer,
            mentions: [sender]
          },
          { quoted: msg }
        );
      } catch (error) {
        console.error('Mute Error:', error);

        return reply(
          `❌ *Unable to close the group.*`
        );
      }
    }

    // ============================================================
    // UNMUTE / OPEN
    // ============================================================

    if (
      action === 'unmute' ||
      action === 'open'
    ) {
      if (!checkAdmin()) return;

      try {
        await socket.groupSettingUpdate(
          from,
          'not_announcement'
        );

        return socket.sendMessage(
          from,
          {
            text:
              `🔓 *ɢʀᴏᴜᴘ ᴜɴᴍᴜᴛᴇᴅ*\n\n` +
              `✅ Everyone can send messages now.\n` +
              `👮 *By:* @${sender.split('@')[0]}` +
              footer,
            mentions: [sender]
          },
          { quoted: msg }
        );
      } catch (error) {
        console.error('Unmute Error:', error);

        return reply(
          `❌ *Unable to open the group.*`
        );
      }
    }

    // ============================================================
    // TAGALL
    // ============================================================

    if (
      action === 'tagall' ||
      action === 'all'
    ) {
      if (!checkAdmin()) return;

      if (!participants || !participants.length) {
        return reply(`❌ *No group members found.*`);
      }

      let text =
        `📢 *ɢʀᴏᴜᴘ ᴛᴀɢ ᴀʟʟ*\n\n`;

      if (q) {
        text += `💬 *Message:* ${q}\n\n`;
      }

      const mentions = [];

      for (const participant of participants) {
        const jid = participant.id || participant.jid;

        if (!jid) continue;

        mentions.push(jid);

        text += `❍ @${jid.split('@')[0]}\n`;
      }

      text += footer;

      return socket.sendMessage(
        from,
        {
          text,
          mentions
        },
        { quoted: msg }
      );
    }

    // ============================================================
    // HIDETAG
    // ============================================================

    if (
      action === 'hidetag' ||
      action === 'htag'
    ) {
      if (!checkAdmin()) return;

      if (!participants || !participants.length) {
        return reply(`❌ *No group members found.*`);
      }

      const mentions = participants
        .map(p => p.id || p.jid)
        .filter(Boolean);

      const text =
        q ||
        `🌸 *${botName}* ┊ Group Announcement`;

      return socket.sendMessage(
        from,
        {
          text,
          mentions
        },
        { quoted: msg }
      );
    }

    // ============================================================
    // GROUP LINK
    // ============================================================

    if (
      action === 'link' ||
      action === 'invite'
    ) {
      if (!checkAdmin()) return;

      try {
        const code =
          await socket.groupInviteCode(from);

        const link =
          `https://chat.whatsapp.com/${code}`;

        return socket.sendMessage(
          from,
          {
            text:
              `🔗 *ɢʀᴏᴜᴘ ɪɴᴠɪᴛᴇ ʟɪɴᴋ*\n\n` +
              `👥 *Group:* ${groupMetadata?.subject || 'Group'}\n\n` +
              `🔗 ${link}` +
              footer
          },
          { quoted: msg }
        );
      } catch (error) {
        console.error('Link Error:', error);

        return reply(
          `❌ *Unable to get group invite link.*`
        );
      }
    }

    // ============================================================
    // REVOKE
    // ============================================================

    if (action === 'revoke') {
      if (!checkAdmin()) return;

      try {
        await socket.groupRevokeInvite(from);

        return reply(
          `🔄 *Group invite link has been reset successfully.*\n\n` +
          `🔐 The old link is no longer valid.` +
          footer
        );
      } catch (error) {
        console.error('Revoke Error:', error);

        return reply(
          `❌ *Unable to reset the group invite link.*`
        );
      }
    }

    // ============================================================
    // SET NAME
    // ============================================================

    if (
      action === 'setname' ||
      action === 'subject'
    ) {
      if (!checkAdmin()) return;

      const newName = String(q || '').trim();

      if (!newName) {
        return reply(
          `❌ *Please provide a new group name.*\n\n` +
          `📌 Example:\n` +
          `*${prefix}setname MIYORA FAMILY*`
        );
      }

      try {
        await socket.groupUpdateSubject(
          from,
          newName
        );

        return reply(
          `✅ *Group name updated successfully!*\n\n` +
          `👥 *New Name:* ${newName}` +
          footer
        );
      } catch (error) {
        console.error('SetName Error:', error);

        return reply(
          `❌ *Unable to change the group name.*`
        );
      }
    }

    // ============================================================
    // SET DESCRIPTION
    // ============================================================

    if (
      action === 'setdesc' ||
      action === 'setdescription'
    ) {
      if (!checkAdmin()) return;

      const newDesc = String(q || '').trim();

      if (!newDesc) {
        return reply(
          `❌ *Please provide a new group description.*\n\n` +
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
          `✅ *Group description updated successfully!*` +
          footer
        );
      } catch (error) {
        console.error('SetDesc Error:', error);

        return reply(
          `❌ *Unable to change the group description.*`
        );
      }
    }

    // ============================================================
    // GROUP INFO
    // ============================================================

    if (
      action === 'groupinfo' ||
      action === 'ginfo'
    ) {
      if (!checkGroup()) return;

      try {
        const metadata =
          groupMetadata ||
          await socket.groupMetadata(from);

        const members =
          metadata.participants || participants || [];

        const admins =
          members.filter(
            p => p.admin === 'admin' || p.admin === 'superadmin'
          );

        const description =
          metadata.desc || 'No description';

        const created =
          metadata.creation
            ? new Date(
                metadata.creation * 1000
              ).toLocaleString()
            : 'Unknown';

        const info =
          `🌸 *ɢʀᴏᴜᴘ ɪɴꜰᴏʀᴍᴀᴛɪᴏɴ*\n\n` +
          `👥 *Name:* ${metadata.subject || 'Unknown'}\n` +
          `🆔 *ID:* ${from}\n` +
          `👤 *Members:* ${members.length}\n` +
          `👑 *Admins:* ${admins.length}\n` +
          `📅 *Created:* ${created}\n\n` +
          `📝 *Description:*\n${description}` +
          footer;

        return reply(info);

      } catch (error) {
        console.error('GroupInfo Error:', error);

        return reply(
          `❌ *Unable to load group information.*`
        );
      }
    }

    // ============================================================
    // KICK ALL
    // ============================================================

    if (
      action === 'kickall'
    ) {
      if (!checkAdmin()) return;

      // Extra owner protection for destructive command
      if (!isOwner) {
        return reply(
          `❌ *This command is restricted to the bot owner.*`
        );
      }

      if (!participants || !participants.length) {
        return reply(`❌ *No members found.*`);
      }

      const botJid = getBotJid();

      const membersToRemove =
        participants
          .filter(participant => {
            const jid =
              participant.id || participant.jid;

            if (!jid) return false;

            // Keep admins
            if (isAdmin(jid)) return false;

            // Keep bot
            if (getDigits(jid) === getDigits(botJid)) {
              return false;
            }

            return true;
          })
          .map(
            participant =>
              participant.id || participant.jid
          )
          .filter(Boolean);

      if (!membersToRemove.length) {
        return reply(
          `✅ *No non-admin members found to remove.*`
        );
      }

      await reply(
        `⏳ *Removing ${membersToRemove.length} members...*`
      );

      try {
        const response =
          await socket.groupParticipantsUpdate(
            from,
            membersToRemove,
            'remove'
          );

        const success =
          (response || []).filter(
            r => r.status === '200'
          ).length;

        return reply(
          `🌸 *ᴋɪᴄᴋ ᴀʟʟ ᴄᴏᴍᴘʟᴇᴛᴇ*\n\n` +
          `✅ *Removed:* ${success}\n` +
          `⚠️ *Failed:* ${Math.max(
            0,
            membersToRemove.length - success
          )}\n\n` +
          `👑 *Admins were protected.*`
        );

      } catch (error) {
        console.error('KickAll Error:', error);

        return reply(
          `❌ *Kick all failed.*\n\n` +
          `Some members may not have been removed.`
        );
      }
    }

    // ============================================================
    // LEFT
    // ============================================================

    if (
      action === 'left' ||
      action === 'leave'
    ) {
      if (!checkGroup()) return;

      if (!isOwner) {
        return reply(
          `❌ *Owner Only!*`
        );
      }

      await reply(
        `👋 *Goodbye!*\n\n` +
        `I am leaving this group...`
      );

      try {
        await socket.groupLeave(from);
      } catch (error) {
        console.error('Group Leave Error:', error);

        return reply(
          `❌ *Unable to leave the group.*`
        );
      }

      return;
    }

    // ============================================================
    // UNKNOWN ACTION
    // ============================================================

    return reply(
      `❌ *Unknown group command.*\n\n` +
      `Use *${prefix}grup* to view the Group Manage Menu.`
    );
  }
};
