// Command: ai (aliases: deepseek, ask, chat)
// Auto-extracted from sakura.js switch-case during commandLoader refactor.
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

      // Userගෙන් දුන් ප්‍රශ්නය ලබා ගැනීම (args හෝ q මඟින්)
      const prompt = args.join(" ").trim() || q;

      if (!prompt) {
        return reply(`꒰ᵎ 🤖 *DeepSeek AI* ᵎ꒱

    ⚠️ Please provide a prompt or question!

    📌 *Usage:* ${prefix}ai <your question>
    📌 *Example:* ${prefix}ai How to write a bot in Node.js?

    　　˚₊‧꒰ა 🌸 ໒꒱‧₊˚
    *${botName}* 🖤 | *𝐁ʟᴀᴄᴋ 𝐂ᴀᴛ 𝐎ꜰᴄ*`);
      }

      // ලෝඩින් රියැක්ට් එකක් දැමීම
      await socket.sendMessage(sender, {
        react: { text: '🤖', key: msg.key }
      });

      try {
        // ඔයා දුන් DeepSeek API එක සහ API Key එක
        const apiKey = 'key_c03461a36ebeedc181b2890a4987c6fd';
        const apiUrl = `https://mr-thinuzz-api-build.vercel.app/api/deepseek/chat?text=${encodeURIComponent(prompt)}&apiKey=${apiKey}`;

        const response = await axios.get(apiUrl, { timeout: 30000 });
        
        // API එකෙන් එන ප්‍රතිචාරය ලබා ගැනීම (JSON ෆෝමැට් එක මත පදනම්ව)
        // (සාමාන්‍යයෙන් API වල result හෝ response හෝ message වැනි ෆීල්ඩ් එකක පිළිතුර තිබිය හැක)
        const aiReply = response.data?.result || response.data?.response || response.data?.answer || response.data?.text || JSON.stringify(response.data);

        if (!aiReply) {
          throw new Error("Invalid API response format.");
        }

        const caption = `꒰ᵎ 🤖 *DeepSeek AI* ᵎ꒱

${aiReply}

    　　˚₊‧꒰ა 🌸 ໒꒱‧₊˚
> 📌 *Prompt:* ${prompt}
*${botName}* 🖤 | *𝐁ʟᴀᴄᴋ 𝐂ᴀᴛ 𝐎ꜰᴄ*`;

        // නිව්ස්ලෙටර් කොන්ටෙක්ට් එක සමඟ පිළිතුර යැවීම
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
          react: { text: '✨', key: msg.key }
        });

      } catch (e) {
        console.log('[ai] API error:', e.message);
        return reply(`꒰ᵎ ❌ *Error* ᵎ꒱

⚠️ Failed to fetch response from DeepSeek AI!
🔍 Error: ${e.message}

    　　˚₊‧꒰ა 🌸 ໒꒱‧₊˚
*${botName}* 🖤`);
      }
  }
};
