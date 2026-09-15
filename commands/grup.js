// Command: grup (aliases: group, gc, groupmanagement)
// Group Management Commands
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

    // 1. ගෘප් එකක් ඇතුළේද යන්න පරීක්ෂා කිරීම
    const chatJid = msg.key.remoteJid;
    if (!chatJid.endsWith('@g.us')) {
      return reply(`꒰ᵎ 👥 *Group Management* ᵎ꒱

❌ මේ විධානය භාවිත කළ හැක්කේ WhatsApp සමූහ (Groups) ඇතුළේ පමණයි!

　　˚₊‧꒰ა 🌸 ໒꒱‧₊˚
*${botName}* 🖤 | *𝐁ʟᴀᴄᴋ 𝐂ᴀᴛ 𝐎ꜰᴄ*`);
    }

    try {
      const groupMetadata = await socket.groupMetadata(chatJid);
      const participants = groupMetadata.participants;
      
      const botNumber = socket.user.id.split(':')[0] + '@s.whatsapp.net';
      const senderNumber = sender;

      const botParticipant = participants.find(p => p.id === botNumber);
      const senderParticipant = participants.find(p => p.id === senderNumber);

      const isBotAdmin = botParticipant?.admin === 'admin' || botParticipant?.admin === 'superadmin';
      const isSenderAdmin = senderParticipant?.admin === 'admin' || senderParticipant?.admin === 'superadmin';

      if (!isSenderAdmin) {
        return reply(`꒰ᵎ 👥 *Group Management* ᵎ꒱

❌ මේක කරන්න ඔයා **Group Admin** කෙනෙක් වෙන්න ඕනි යාළුවා!

　　˚₊‧꒰ა 🌸 ໒꒱‧₊˚
*${botName}* 🖤 | *𝐁ʟᴀᴄᴋ 𝐂ᴀᴛ 𝐎ꜰᴄ*`);
      }

      if (!isBotAdmin) {
        return reply(`꒰ᵎ 👥 *Group Management* ᵎ꒱

❌ වැඩේ කරන්න මාවත් මුලින් **Group Admin** කෙනෙක් කරලා ඉන්න!

　　˚₊‧꒰ა 🌸 ໒꒱‧₊˚
*${botName}* 🖤 | *𝐁ʟᴀᴄᴋ 𝐂ᴀᴛ 𝐎ꜰᴄ*`);
      }

      const action = (args[0] || '').toLowerCase();
      const parameter = args.slice(1).join(" ").trim();
      
      // ආරක්ෂිතව Reply හෝ Mention කර ඇති පරිශීලකයා ලබා ගැනීම
      const quotedMsg = msg.message?.extendedTextMessage?.contextInfo;
      const targetUser = quotedMsg?.participant || quotedMsg?.mentionedJid?.[0];

      // මෙනුව හෝ උදව් අවශ්‍ය නම් පෙන්වන කොටස
      if (!action) {
        return reply(`꒰ᵎ 👥 *Group Management Menu* ᵎ꒱

✨ *ഗෘප් එක පාලනය කිරීමට පහත විධාන භාවිත කරන්න:*

  ➜ *${prefix}grup open* 🔓 (කවුරුත් මැසේජ් යැවීමට හැරීම)
  ➜ *${prefix}grup close* 🔒 (ඇමින්ලාට පමණක් මැසේජ් යැවීමට සැකසීම)
  ➜ *${prefix}grup name <නම>* ✏️ (ගෘප් නම වෙනස් කිරීම)
  ➜ *${prefix}grup desc <විස්තරය>* 📝 (ගෘප් විස්තරය වෙනස් කිරීම)
  ➜ *${prefix}grup lock* 📌 (ගෘප් සෙටින්ග්ස් ඇමින්ලාට පමණක් සීමා කිරීම)
  ➜ *${prefix}grup unlock* 🔓 (සෙටින්ග්ස් හැමෝටම විවෘත කිරීම)
  ➜ *${prefix}grup add <නංබරය>* ➕ (සාමාජිකයෙක් එකතු කිරීම)
  ➜ *${prefix}grup kick @user* 👢 (සාමාජිකයෙක් ඉවත් කිරීම)
  ➜ *${prefix}grup promote @user* 👑 (ඇමින් කෙනෙක් කිරීම)
  ➜ *${prefix}grup demote @user* 🔻 (ඇමින්කම ඉවත් කිරීම)

　　˚₊‧꒰ა 🌸 ໒꒱‧₊˚
*${botName}* 🖤 | *𝐁ʟᴀᴄᴋ 𝐂ᴀᴛ 𝐎ꜰᴄ*`);
      }

      await socket.sendMessage(chatJid, {
        react: { text: '⚡', key: msg.key }
      });

      switch (action) {
        case 'open':
          await socket.groupSettingUpdate(chatJid, 'not_announcement');
          await reply(`꒰ᵎ 👥 *Group Management* ᵎ꒱\n\n🔓 ගෘප් එක සාර්ථකව විවෘත කළා! දැන් හැමෝටම මැසේජ් යවන්න පුළුවන්.\n\n*${botName}* 🖤`);
          break;

        case 'close':
          await socket.groupSettingUpdate(chatJid, 'announcement');
          await reply(`꒰ᵎ 👥 *Group Management* ᵎ꒱\n\n🔒 ගෘප් එක වැසුවා! දැන් ඇමින්ලාට පමණක් මැසේජ් යැවිය හැක.\n\n*${botName}* 🖤`);
          break;

        case 'name':
          if (!parameter) {
            return reply(`⚠️ අලුත් ගෘප් නමක් ලබා දෙන්න!\n📌 *උදාහරණයක්:* ${prefix}grup name Black Cat Bot Official`);
          }
          await socket.groupUpdateSubject(chatJid, parameter);
          await reply(`꒰ᵎ 👥 *Group Management* ᵎ꒱\n\n✏️ ගෘප් නම සාර්ථකව වෙනස් කළා:\n📌 *${parameter}*\n\n*${botName}* 🖤`);
          break;

        case 'desc':
          if (!parameter) {
            return reply(`⚠️ අලුත් විස්තරයක් ලබා දෙන්න!\n📌 *උදාහරණයක්:* ${prefix}grup desc සාදරයෙන් පිළිගනිමු!`);
          }
          await socket.groupUpdateDescription(chatJid, parameter);
          await reply(`꒰ᵎ 👥 *Group Management* ᵎ꒱\n\n📝 ගෘප් විස්තරය සාර්ථකව යාවත්කාලීන කළා!\n\n*${botName}* 🖤`);
          break;

        case 'lock':
          await socket.groupSettingUpdate(chatJid, 'locked');
          await reply(`꒰ᵎ 👥 *Group Management* ᵎ꒱\n\n📌 ගෘප් සෙටින්ග්ස් ලොක් කළා! දැන් ගෘප් විස්තර වෙනස් කළ හැක්කේ ඇමින්ලාට පමණි.\n\n*${botName}* 🖤`);
          break;

        case 'unlock':
          await socket.groupSettingUpdate(chatJid, 'unlocked');
          await reply(`꒰ᵎ 👥 *Group Management* ᵎ꒱\n\n🔓 ගෘප් සෙටින්ග්ස් අන්ලොක් කළා!\n\n*${botName}* 🖤`);
          break;

        case 'add':
          let userToAdd = parameter.replace(/[^0-9]/g, '');
          if (!userToAdd) {
            return reply(`⚠️ කරුණාකර එකතු කළ යුතු දුරකථන අංකය ලබා දෙන්න!\n📌 *උදාහරණයක්:* ${prefix}grup add 94771234567`);
          }
          const targetJid = userToAdd + '@s.whatsapp.net';
          try {
            await socket.groupParticipantsUpdate(chatJid, [targetJid], 'add');
            await reply(`꒰ᵎ 👥 *Group Management* ᵎ꒱\n\n➕ සාමාජිකයා සාර්ථකව ගෘප් එකට එකතු කරන ලදී!\n\n*${botName}* 🖤`);
          } catch (err) {
            await reply(`❌ සාමාජිකයා එකතු කිරීම අසාර්ථකයි! (ඔවුන්ගේ ප්‍රයිවසි සෙටින්ග්ස් නිසා විය හැක)`);
          }
          break;

        case 'kick':
        case 'remove':
          if (!targetUser) {
            return reply(`⚠️ කරුණාකර ඉවත් කළ යුතු සාමාජිකයාට රිප්ලයි කරන්න හෝ මෙන්ෂන් කරන්න!\n📌 *උදාහරණයක්:* ${prefix}grup kick @user`);
          }
          await socket.groupParticipantsUpdate(chatJid, [targetUser], 'remove');
          await reply(`꒰ᵎ 👥 *Group Management* ᵎ꒱\n\n👢 සාමාජිකයා සාර්ථකව ගෘප් එකෙන් ඉවත් කරන ලදී!\n\n*${botName}* 🖤`);
          break;

        case 'promote':
          if (!targetUser) {
            return reply(`⚠️ කරුණාකර ඇමින් කෙනෙක් කිරීමට අවශ්‍යකෙනාට රිප්ලයි කරන්න හෝ මෙන්ෂන් කරන්න!`);
          }
          await socket.groupParticipantsUpdate(chatJid, [targetUser], 'promote');
          await reply(`꒰ᵎ 👥 *Group Management* ᵎ꒱\n\n👑 අදාළ සාමාජිකයා දැන් ගෘප් එකේ *Admin* කෙනෙක්!\n\n*${botName}* 🖤`);
          break;

        case 'demote':
          if (!targetUser) {
            return reply(`⚠️ කරුණාකර ඇමින්කම ඉවත් කළ යුතු කෙනාට රිප්ලයි කරන්න හෝ මෙන්ෂන් කරන්න!`);
          }
          await socket.groupParticipantsUpdate(chatJid, [targetUser], 'demote');
          await reply(`꒰ᵎ 👥 *Group Management* ᵎ꒱\n\n🔻 අදාළ සාමාජිකයාගේ ඇමින්කම ඉවත් කරන ලදී!\n\n*${botName}* 🖤`);
          break;

        default:
          await reply(`꒰ᵎ 👥 *Group Management* ᵎ꒱\n\n❌ වැරදි විධානයක්! නිවැරදි විධාන බැලීමට *${prefix}grup* ලෙස ටයිප් කරන්න.\n\n*${botName}* 🖤`);
          break;
      }

      await socket.sendMessage(chatJid, {
        react: { text: '✅', key: msg.key }
      });

    } catch (err) {
      console.log('[grup] Error:', err);
      await reply(`꒰ᵎ ❌ *Error* ᵎ꒱\n\n⚠️ මෙහෙයුම ක්‍රියාත්මක කිරීමේදී දෝෂයක් සිදු විය. බොට්ටු ඇමින් බලතල ඇති බව තහවුරු කරගන්න.\n\n*${botName}* 🖤`);
    }

  }
};
