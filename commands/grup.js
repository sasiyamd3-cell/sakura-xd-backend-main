// Command: grup (aliases: group, gc, groupmanagement)
module.exports = {
  name: 'grup',
  aliases: ['group', 'gc', 'groupmanagement'],
  async execute(ctx) {
    const {
      socket, msg, sender, from, command, args, q, reply,
      sessionConfig, number, prefix, config, BOT_NAME_FANCY,
      NEWSLETTER_CONTEXT
    } = ctx;

    const cfg = sessionConfig;
    const botName = cfg?.botName || BOT_NAME_FANCY || 'Black Cat';

    // 1. පරීක්ෂා කිරීම මෙහෙයුම සිදුකරන්නේ Group එකක් ඇතුළේද යන්න
    if (!msg.key.remoteJid.endsWith('@g.us')) {
      return reply(`꒰ᵎ 👥 *Group Management* ᵎ꒱

❌ This command can only be used inside WhatsApp Groups!

　　˚₊‧꒰ა 🌸 ໒꒱‧₊˚
*${botName}* 🖤 | *𝐁ʟᴀᴄᴋ 𝐂ᴀᴛ 𝐎ꜰᴄ*`);
    }

    const groupJid = msg.key.remoteJid;

    // 2. බොට් සහ Command එක දමන පුද්ගලයා ගෘප් එකේ Admin ද යන්න පරීක්ෂා කිරීම
    try {
      const groupMetadata = await socket.groupMetadata(groupJid);
      const participants = groupMetadata.participants;
      
      const botNumber = socket.user.id.split(':')[0] + '@s.whatsapp.net';
      const senderNumber = sender;

      const botParticipant = participants.find(p => p.id === botNumber);
      const senderParticipant = participants.find(p => p.id === senderNumber);

      const isBotAdmin = botParticipant?.admin === 'admin' || botParticipant?.admin === 'superadmin';
      const isSenderAdmin = senderParticipant?.admin === 'admin' || senderParticipant?.admin === 'superadmin';

      if (!isSenderAdmin) {
        return reply(`꒰ᵎ 👥 *Group Management* ᵎ꒱

❌ You must be a **Group Admin** to use this command!

　　˚₊‧꒰ა 🌸 ໒꒱‧₊˚
*${botName}* 🖤 | *𝐁ʟᴀᴄᴋ 𝐂ᴀᴛ 𝐎ꜰᴄ*`);
      }

      if (!isBotAdmin) {
        return reply(`꒰ᵎ 👥 *Group Management* ᵎ꒱

❌ Please make the bot a **Group Admin** first to use these commands!

　　˚₊‧꒰ა 🌸 ໒꒱‧₊˚
*${botName}* 🖤 | *𝐁ʟᴀᴄᴋ 𝐂ᴀᴛ 𝐎ꜰᴄ*`);
      }

      const action = (args[0] || '').toLowerCase();
      const parameter = args.slice(1).join(" ").trim();

      // Help මෙනුව (කිසිදු action එකක් ලබා දී නොමැති නම්)
      if (!action) {
        return reply(`꒰ᵎ 👥 *Group Management Menu* ᵎ꒱

📌 *Usage:*
  ➜ *${prefix}grup open* (Allow everyone to send messages)
  ➜ *${prefix}grup close* (Only admins can send messages)
  ➜ *${prefix}grup name <new name>* (Change group subject)
  ➜ *${prefix}grup desc <new description>* (Change group description)
  ➜ *${prefix}grup lock* (Lock group settings to admins only)
  ➜ *${prefix}grup unlock* (Unlock group settings for all)

　　˚₊‧꒰ა 🌸 ໒꒱‧₊˚
*${botName}* 🖤 | *𝐁ʟᴀᴄᴋ 𝐂ᴀᴛ 𝐎ꜰᴄ*`);
      }

      await socket.sendMessage(sender, {
        react: { text: '⏳', key: msg.key }
      });

      // Actions ක්‍රියාත්මක කිරීම
      switch (action) {
        case 'open':
          await socket.groupSettingUpdate(groupJid, 'not_announcement');
          await reply(`꒰ᵎ 👥 *Group Management* ᵎ꒱\n\n✅ Group has been **opened**! Everyone can now send messages.\n\n*${botName}* 🖤`);
          break;

        case 'close':
          await socket.groupSettingUpdate(groupJid, 'announcement');
          await reply(`꒰ᵎ 👥 *Group Management* ᵎ꒱\n\n✅ Group has been **closed**! Only admins can send messages now.\n\n*${botName}* 🖤`);
          break;

        case 'name':
          if (!parameter) {
            return reply(`⚠️ Please provide a new group name!\n📌 *Example:* ${prefix}grup name My Awesome Group`);
          }
          await socket.groupUpdateSubject(groupJid, parameter);
          await reply(`꒰ᵎ 👥 *Group Management* ᵎ꒱\n\n✅ Group name successfully changed to:\n📌 *${parameter}*\n\n*${botName}* 🖤`);
          break;

        case 'desc':
          if (!parameter) {
            return reply(`⚠️ Please provide a new group description!\n📌 *Example:* ${prefix}grup desc Welcome to our official group!`);
          }
          await socket.groupUpdateDescription(groupJid, parameter);
          await reply(`꒰ᵎ 👥 *Group Management* ᵎ꒱\n\n✅ Group description successfully updated!\n\n*${botName}* 🖤`);
          break;

        case 'lock':
          await socket.groupSettingUpdate(groupJid, 'locked');
          await reply(`꒰ᵎ 👥 *Group Management* ᵎ꒱\n\n✅ Group settings **locked**! Only admins can edit group info.\n\n*${botName}* 🖤`);
          break;

        case 'unlock':
          await socket.groupSettingUpdate(groupJid, 'unlocked');
          await reply(`꒰ᵎ 👥 *Group Management* ᵎ꒱\n\n✅ Group settings **unlocked**! Members can edit group info.\n\n*${botName}* 🖤`);
          break;

        default:
          await reply(`꒰ᵎ 👥 *Group Management* ᵎ꒱\n\n❌ Invalid action! Type *${prefix}grup* to see available commands.\n\n*${botName}* 🖤`);
          break;
      }

      await socket.sendMessage(sender, {
        react: { text: '✅', key: msg.key }
      });

    } catch (err) {
      console.log('[grup] Error:', err);
      await reply(`꒰ᵎ ❌ *Error* ᵎ꒱\n\n⚠️ Failed to execute group action. Make sure the bot has proper admin permissions.\n\n*${botName}* 🖤`);
    }

  }
};
