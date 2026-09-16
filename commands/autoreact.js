// Command: autoreact
module.exports = {
  name: 'autoreact',
  aliases: ['ar', 'ownerreact'],
  async execute(ctx) {
    const {
      socket, msg, args, reply, sessionConfig, BOT_NAME_FANCY, prefix
    } = ctx;

    const cfg = sessionConfig;
    const botName = cfg?.botName || BOT_NAME_FANCY || 'Black Cat';

    const chatJid = msg.key.remoteJid;
    if (!chatJid.endsWith('@g.us')) {
      return reply(`꒰ᵎ 👑 *Auto React* ᵎ꒱\n\n❌ This command can only be used inside WhatsApp Groups!\n\n*${botName}* 🖤`);
    }

    const action = (args[0] || '').toLowerCase();

    global.db = global.db || { autoreact: {} };

    if (!action || (action !== 'on' && action !== 'off')) {
      return reply(`꒰ᵎ 👑 *Auto React Menu* ᵎ꒱\n\n✨ *Usage:* \n  ➜ *${prefix}autoreact on* (Enable auto crown react for owner)\n  ➜ *${prefix}autoreact off* (Disable auto react)\n\n*${botName}* 🖤`);
    }

    if (action === 'on') {
      global.db.autoreact[chatJid] = true;
      await reply(`꒰ᵎ 👑 *Auto React* ᵎ꒱\n\n✅ Auto-React is now *ENABLED* in this group!\n\n*${botName}* 🖤`);
    } else if (action === 'off') {
      global.db.autoreact[chatJid] = false;
      await reply(`꒰ᵎ 👑 *Auto React* ᵎ꒱\n\n❌ Auto-React is now *DISABLED* in this group!\n\n*${botName}* 🖤`);
    }
  },

  async handleIncomingMessage(ctx) {
    const { socket, msg } = ctx;
    const chatJid = msg.key.remoteJid;

    if (!chatJid || !chatJid.endsWith('@g.us')) return;

    const isAutoReactEnabled = global.db?.autoreact?.[chatJid];
    if (!isAutoReactEnabled) return;

    // ඔයා දුන් අංකය මෙතැනට දමා ඇත
    const ownerJid = "94770475809@s.whatsapp.net"; 

    const senderJid = msg.key.participant || msg.participant;
    
    if (senderJid === ownerJid) {
      try {
        await socket.sendMessage(chatJid, {
          react: {
            text: '👑', // Crown emoji
            key: msg.key
          }
        });
      } catch (e) {
        console.log("Auto-React Error:", e);
      }
    }
  }
};
