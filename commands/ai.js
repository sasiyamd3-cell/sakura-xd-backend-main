// Command: ai (aliases: qlony, chatgpt, ask)
module.exports = {
  name: 'ai',
  aliases: ['qlony', 'chatgpt', 'ask'],
  async execute(ctx) {
    const {
      socket, msg, sender, args, reply,
      sessionConfig, prefix, BOT_NAME_FANCY
    } = ctx;

    const axios = require('axios');

    const cfg = sessionConfig;
    const botName = cfg?.botName || BOT_NAME_FANCY || 'Black Cat';

    // Text එක ලබා ගැනීම (උදා: .ai Hi හෝ .ai Spiderman ගැන කියන්න)
    const textQuery = args.join(" ").trim();

    if (!textQuery) {
      return reply(`꒰ᵎ 🤖 *AI Assistant* ᵎ꒱

⚠️ Please type a message or question for the AI!

📌 *Usage:* ${prefix}ai <your question>
📌 *Example:* ${prefix}ai What is JavaScript?

　　˚₊‧꒰ა 🌸 ໒꒱‧₊˚
*${botName}* 🖤 | *𝐁ʟᴀᴄᴋ 𝐂ᴀᴛ Oꜰᴄ*`);
    }

    // සෙවුම් ප්‍රතිචාරය සඳහා රියැක්ට් එකක් දැමීම
    await socket.sendMessage(sender, {
      react: { text: '🤖', key: msg.key }
    });

    try {
      const apiKey = 'zanta_hjLBxGQQOA9GpTaicPJP17Kn';
      const apiUrl = `https://api.zanta-mini.store/api/qlony?apiKey=${apiKey}&text=${encodeURIComponent(textQuery)}`;

      const response = await axios.get(apiUrl, { timeout: 30000 });
      const apiData = response.data;

      // API එකෙන් එන රෙස්පොන්ස් එකේ format එක අනුව ටෙක්ස්ට් එක ලබා ගැනීම
      // (സാමාන්‍යයෙන් result, message හෝ text යන key එකක් යටතේ රෙස්පොන්ස් එක එන්න පුළුවන්)
      const aiAnswer = apiData?.result || apiData?.message || apiData?.text || apiData?.data || JSON.stringify(apiData, null, 2);

      if (!aiAnswer) {
        return reply(`꒰ᵎ 🤖 *AI Assistant* ᵎ꒱

❌ Received an empty response from the AI server!

　　˚₊‧꒰ა 🌸 ໒꒱‧₊˚
*${botName}* 🖤`);
      }

      const formattedReply = `꒰ᵎ 🤖 *AI Assistant* ᵎ꒱

${aiAnswer}

　　˚₊‧꒰ა 🌸 ໒꒱‧₊˚
*${botName}* 🖤 | *𝐁ʟᴀᴄᴋ 𝐂ᴀᴛ 𝐎ꜰᴄ*`;

      await socket.sendMessage(sender, {
        text: formattedReply
      }, { quoted: msg });

      await socket.sendMessage(sender, {
        react: { text: '✨', key: msg.key }
      });

    } catch (error) {
      console.log('[ai command error]:', error.message);
      await reply(`꒰ᵎ ❌ *AI Error* ᵎ꒱

⚠️ Failed to connect to the AI server. Please try again later!

*${botName}* 🖤`);
    }
  }
};
