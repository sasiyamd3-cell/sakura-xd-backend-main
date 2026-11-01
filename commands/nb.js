module.exports = {
  name: 'nb',
  aliases: ['num', 'true', 'userinfo', 'whois'],
  async execute(ctx) {
    const { socket, msg, sender, args, prefix, sessionConfig, BOT_NAME_FANCY, NEWSLETTER_CONTEXT } = ctx;
    const botName = sessionConfig?.botName || BOT_NAME_FANCY || 'NEXUS-MD';

    // 1. Target number එක ලබාගැනීම (Type කරලා දුන්නත්, නැත්නම් වෙන කෙනෙක්ව Quote/Reply කරලා ගැහුවත් වැඩ කරයි)
    let target = '';
    let quotedMsg = msg.message?.extendedTextMessage?.contextInfo;

    if (quotedMsg?.participant) {
      target = quotedMsg.participant;
    } else if (quotedMsg?.remoteJid && quotedMsg.isGroup) {
      target = quotedMsg.participant || args[0];
    } else if (args[0]) {
      target = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
    } else {
      return await socket.sendMessage(sender, {
        text: `꒰ᵎ 🔍 *SIM & Number Intelligence* ᵎ꒱

⚠️ Please provide a phone number or reply to a user's message!

📌 *Usage:* \`${prefix}number 0771234567\` or \`+94771234567\`
📌 *Example:* \`${prefix}number <reply to user>\`

　　˚₊‧꒰ა 🌸 ໒꒱‧₊˚
*${botName}* 🖤 | *𝐁ʟᴀᴄᴋ 𝐂ᴀᴛ 𝐎ꜰᴄ*`
      }, { quoted: msg });
    }

    // Clean number formatting
    let rawInput = target.split('@')[0].replace(/[^0-9]/g, '');
    if (rawInput.startsWith('0')) {
      rawInput = '94' + rawInput.substring(1); // 077... නම් 9477... බවට හැරවීම
    }
    
    let cleanJid = `${rawInput}@s.whatsapp.net`;
    let phoneNum = rawInput;

    // Searching React
    await socket.sendMessage(sender, { react: { text: '🔍', key: msg.key } }).catch(() => {});

    try {
      // 2. WhatsApp එකෙන් අදාළ නම්බර් එක චෙක් කිරීම
      const [onWhatsApp] = await socket.onWhatsApp(cleanJid);
      let isRegistered = onWhatsApp?.exists ? true : false;
      let jid = isRegistered ? onWhatsApp.jid : cleanJid;

      // 3. Extra WhatsApp details fetch කිරීම (Status, Bio, Business info)
      let userBio = 'Hidden or Not Available 🔒';
      let businessInfo = 'Personal Account 👤';

      if (isRegistered) {
        try {
          const statusObj = await socket.fetchStatus(jid).catch(() => null);
          if (statusObj && statusObj.status) userBio = statusObj.status;
        } catch {}

        try {
          const bProfile = await socket.getBusinessProfile(jid).catch(() => null);
          if (bProfile && bProfile.description) {
            businessInfo = `Business Account 💼 (${bProfile.category || 'Enterprise'})`;
          }
        } catch {}
      }

      // Profile Picture ලබාගැනීම
      let ppUrl = 'https://i.ibb.co/31p7g9W/default-avatar.png';
      try {
        ppUrl = await socket.profilePictureUrl(jid, 'image');
      } catch {}

      // 4. හරියටම SIM Network එක සහ Details අඳුනාගැනීම
      let country = 'International 🌍';
      let simBrand = 'Unknown Carrier ❓';
      let simType = 'Mobile Cellular 📱';
      let region = 'Global';
      let currency = 'USD ($)';

      if (phoneNum.startsWith('94')) {
        country = 'Sri Lanka 🇱🇰';
        region = 'Democratic Socialist Republic of Sri Lanka';
        currency = 'Sri Lankan Rupee (LKR)';
        
        const prefixCode = phoneNum.substring(2, 4); // 94 පසු එන ඉලක්කම් දෙක (උදා: 77, 71, etc.)
        
        if (['77', '76', '74'].includes(prefixCode)) {
          simBrand = 'Dialog Axiata PLC 🔴';
          simType = 'GSM / 4G / 5G Mobile Postpaid/Prepaid';
        } else if (['71', '70'].includes(prefixCode)) {
          simBrand = 'SLT Mobitel 🟢';
          simType = 'GSM / 4G / 5G Mobile Postpaid/Prepaid';
        } else if (['78'].includes(prefixCode)) {
          simBrand = 'Hutchison Telecommunications 🟠';
          simType = 'GSM / 4G Mobile Prepaid/Postpaid';
        } else if (['72'].includes(prefixCode)) {
          simBrand = 'Airtel Sri Lanka 🟣';
          simType = 'GSM / 4G Mobile Prepaid/Postpaid';
        } else if (['11', '81', '91', '31', '33', '41', '51', '52', '54', '55', '57', '65', '66', '25', '26', '35', '36', '37'].includes(prefixCode)) {
          simBrand = 'Sri Lanka Telecom (Landline) ☎️';
          simType = 'Fixed Landline Connection';
        } else {
          simBrand = 'Sri Lankan Telecom Network 🇱🇰';
          simType = 'Local Cellular / Special Line';
        }
      } else if (phoneNum.startsWith('91')) {
        country = 'India 🇮🇳';
        simBrand = 'Jio / Airtel / Vi India 🇮🇳';
        simType = 'Indian Mobile Network';
        region = 'Republic of India';
        currency = 'Indian Rupee (INR)';
      } else if (phoneNum.startsWith('1')) {
        country = 'USA / Canada 🇺🇸 / 🇨🇦';
        simBrand = 'North American Carrier 🇺🇸';
        simType = 'Cellular / Landline';
        region = 'North America';
        currency = 'US Dollar (USD)';
      }

      await socket.sendMessage(sender, { react: { text: '✨', key: msg.key } }).catch(() => {});

      const nlCtx = {
        forwardingScore: 1,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: NEWSLETTER_CONTEXT.forwardedNewsletterMessageInfo.newsletterJid,
          newsletterName: botName,
          serverMessageId: 999,
        }
      };

      // 5. පට්ට විදිහට සකස් කළ Truecaller / Intel Report එක
      const reportText = `꒰ᵎ 🚀 *TRUE NUMBER INTELLIGENCE* ᵎ꒱

📱 *Target Number:* \`+${phoneNum}\`
💬 *WhatsApp JID:* \`${jid}\`
🟢 *WhatsApp Status:* ${isRegistered ? 'Active Account ✅' : 'Not Registered ❌'}
🏷️ *Account Category:* ${businessInfo}

📡 *SIM & Network Provider:*
   • *Operator / SIM:* *${simBrand}*
   • *Connection Type:* ${simType}
   • *Country Code:* \`+${phoneNum.substring(0, 2)}\`

🌍 *Geographical & Regional Intel:*
   • *Country:* ${country}
   • *Region:* ${region}
   • *Currency:* ${currency}

📝 *Profile About / Bio:*
   > _${userBio}_

　　˚₊‧꒰ა 🌸 ໒꒱‧₊˚
*${botName}* 🖤 | *𝐁ʟᴀᴄᴋ 𝐂ᴀᴛ 𝐎ꜰᴄ*`;

      await socket.sendMessage(sender, {
        image: { url: ppUrl },
        caption: reportText,
        contextInfo: nlCtx
      }, { quoted: msg });

      await socket.sendMessage(sender, { react: { text: '✅', key: msg.key } }).catch(() => {});

    } catch (e) {
      console.error('[number error]:', e.message);
      await socket.sendMessage(sender, {
        text: `꒰ᵎ ❌ *Lookup Error* ᵎ꒱\n\n⚠️ Failed to process number intelligence!\n\n*${botName}* 🖤`
      }, { quoted: msg });
    }
  }
};
