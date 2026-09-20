// Command: ai (aliases: deepseek, ask, chat)
// Auto-extracted and tuned with pure Sri Lankan vibes & savage humor.
const axios = require('axios');

module.exports = {
  name: 'ai',
  aliases: ['deepseek', 'ask', 'chat'],
  async execute(ctx) {
    const {
      socket, msg, sender, from, command, args, q, reply,
      sessionConfig, number, prefix, config, BOT_NAME_FANCY,
      NEWSLETTER_CONTEXT, resolveReplyJid
    } = ctx;

      const sanitized = (number || '').replace(/[^0-9]/g, '');
      const cfg = sessionConfig; 
      const botName = cfg.botName || BOT_NAME_FANCY;

      const prompt = args.join(" ").trim() || q;

      if (!prompt) {
        return reply(`꒰ᵎ 🤖 *Black Cat AI* ᵎ꒱

    ⚠️ අම්මෝ මචං, මොනවා හරි අහන්නැතුව හිස්ව එවන්නේ මොකද බං? පස්ස පැත්ත කෝලම් කරන්නද ඇහුවේ? 😒

    📌 *Usage:* ${prefix}ai <ඔයාගේ ප්‍රශ්නය>
    📌 *Example:* ${prefix}ai සසියා අයියා කියන්නේ කාටද?

    　　˚₊‧꒰ა 🌸 ໒꒱‧₊˚
    *${botName}* 🖤 | *𝐁ʟᴀᴄᴋ 𝐂ᴀᴛ 𝐎ꜰᴄ*`);
      }

      await socket.sendMessage(sender, {
        react: { text: '🤪', key: msg.key }
      });

      try {
        const apiKey = 'key_c03461a36ebeedc181b2890a4987c6fd';
        
        // මෙන්න මෙතැනින් තමයි බෝට්ටුවට මාරම ෆන්, කුණුහරුප අස්සෙන් නියම සිංහලෙන් අතල් දෙන විදිහට පාර දෙන්නේ
        const funnyPrompt = `You are a hilariously savage, local Sri Lankan WhatsApp bot created by "සසියා අයියා" (Sasiya Ayya). Speak in a mix of funny, slang-filled Sinhala and English. Talk like a savage local friend who uses words like "පකයා", "හුත්තා", "ගොන්සියා", "මචං", "අප්පෝ", "හම්මෝ", "පට්ට", but still give the correct answer to the question. If anyone asks who made you, proudly say it's "සසියා අයියා". Question: ${prompt}`;

        const apiUrl = `https://mr-thinuzz-api-build.vercel.app/api/deepseek/chat?text=${encodeURIComponent(funnyPrompt)}&apiKey=${apiKey}`;

        const response = await axios.get(apiUrl, { timeout: 30000 });
        
        let rawAnswer = response.data?.data?.answer || response.data?.result || response.data?.response || response.data?.text;

        if (!rawAnswer) {
          throw new Error("API එකත් එක්ක මොකක්ද මංජු කේස් එකක් බං, ආපහු ට්‍රයි එකක් දීපන්!");
        }

        let aiReply = rawAnswer.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

        if (!aiReply) {
            aiReply = rawAnswer;
        }

        const caption = `꒰ᵎ 🤖 *Black Cat Saji-Bot* ᵎ꒱

${aiReply}

    　　˚₊‧꒰ა 🌸 ໒꒱‧₊˚
> 👑 *Creator:* අපේ සසියා අයියා තමයි මාව මේ ලෝකෙට බිහි කළේ මචං! 🔥
*${botName}* 🖤 | *𝐁ʟᴀᴄᴋ 𝐂ᴀᴛ 𝐎ꜰᴄ*`;

        const nlCtx = {
          forwardingScore: 1,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: NEWSLETTER_CONTEXT.forwardedNewsletterMessageInfo.newsletterJid,
            newsletterName: botName,
            serverMessageId: 999,
          }
        };

        await socket.sendMessage(sender, {
          text: caption,
          contextInfo: nlCtx
        }, { quoted: msg });

        await socket.sendMessage(sender, {
          react: { text: '🔥', key: msg.key }
        });

      } catch (e) {
        console.log('[ai] API error:', e.message);
        return reply(`꒰ᵎ ❌ *Error* ᵎ꒱

⚠️ අප්පෝ හුත්තෝ API එකත් ඩවුන් වෙලා බං! සසියා අයියට කියලා ඕක ඉක්මනට හදාගන්න වෙනවා.
🔍 Error: ${e.message}

    　　˚₊‧꒰ა 🌸 ໒꒱‧₊˚
*${botName}* 🖤`);
      }
  }
};
