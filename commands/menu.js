// Command: menu (aliases: help, allmenu)
// Full Menu System
module.exports = {
    name: 'menu',
    aliases: ['help', 'allmenu'],

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
            number,
            prefix,
            config,
            BOT_NAME_FANCY,
            NEWSLETTER_CONTEXT,
            resolveReplyJid,
            downloadQuotedMedia,
            getSriLankaTimestamp,
            formatMessage,
            fs,
            path,
            os
        } = ctx;

        const sanitized = (number || '').replace(/[^0-9]/g, '');
        const cfg = sessionConfig || {};
        const botName = cfg.botName || BOT_NAME_FANCY;
        const logo = cfg.logo || config.IMAGE_PATH;

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // 📢 CHANNEL CONTEXT
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        const channelContext = {
            forwardingScore: 1,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: NEWSLETTER_CONTEXT?.forwardedNewsletterMessageInfo?.newsletterJid,
                newsletterName: botName,
                serverMessageId: 999
            }
        };

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // 🌸 MAIN MENU
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        const menuCaption = `🌸⃝⃘̉̉̉̉̉̉🧚‍♀️ *${botName} 𝐌𝐄𝐍𝐔* 🧚‍♀️🌸⃝⃘̉̉̉̉̉̉\n\n` +
            `┊ ┊ ✫ ˚♡ ⋆｡❀\n` +
            `┊ ☪︎⋆\n\n` +
            `> 💌 *ᴡᴇʟᴄᴏᴍᴇ ᴅᴀʀʟɪɴɢ, ᴘɪᴄᴋ ᴀ ᴄᴀᴛᴇɢᴏʀʏ~*\n\n` +
            `❍ 1┊ ❮ *📋 ᴍᴀɪɴ ᴍᴇɴᴜ* ❯\n` +
            `❍ 2┊ ❮ *📥 ᴅᴏᴡɴʟᴏᴀᴅ ᴍᴇɴᴜ* ❯\n` +
            `❍ 3┊ ❮ *👑 ᴏᴡɴᴇʀ ᴍᴇɴᴜ* ❯\n` +
            `❍ 4┊ ❮ *👥 ɢʀᴏᴜᴘ ᴍᴀɴᴀɢᴇ ᴍᴇɴᴜ* ❯\n` +
            `❍ 5┊ ❮ *🌙 ᴏᴛʜᴇʀ ᴍᴇɴᴜ* ❯\n` +
            `❍ 6┊ ❮ *🤖 ᴀɪ sʏsᴛᴇᴍ* ❯\n\n` +
            `* \`📩 Reply To Number (1-6)\`\n\n` +
            `🧚‍♀️ *©ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝐁ʟᴀᴄᴋ 𝐂ᴀᴛ 𝐎ꜰᴄ*\n\n` +
            `*${botName}* 🖤 | *𝐁ʟᴀᴄᴋ 𝐂ᴀᴛ 𝐎ꜰᴄ*`;

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // 🌸 MENU REACTION
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        try {
            await socket.sendMessage(sender, {
                react: {
                    text: '🌸',
                    key: msg.key
                }
            });
        } catch (e) {}

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // 📸 SEND MAIN MENU
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        let menuMsg;
        try {
            if (String(logo).startsWith('http')) {
                menuMsg = await socket.sendMessage(
                    sender, {
                        image: {
                            url: logo
                        },
                        caption: menuCaption,
                        contextInfo: channelContext
                    }, {
                        quoted: msg
                    }
                );
            } else {
                try {
                    const buf = fs.readFileSync(logo);
                    menuMsg = await socket.sendMessage(
                        sender, {
                            image: buf,
                            caption: menuCaption,
                            contextInfo: channelContext
                        }, {
                            quoted: msg
                        }
                    );
                } catch (fileErr) {
                    // Fallback if local logo missing
                    menuMsg = await socket.sendMessage(
                        sender, {
                            text: menuCaption,
                            contextInfo: channelContext
                        }, {
                            quoted: msg
                        }
                    );
                }
            }
        } catch (sendErr) {
            console.error('[MENU] Failed to send main menu:', sendErr?.message || sendErr);
            try {
                menuMsg = await socket.sendMessage(
                    sender, {
                        text: menuCaption,
                        contextInfo: channelContext
                    }, {
                        quoted: msg
                    }
                );
            } catch (e) {
                console.error('[MENU] Critical send failure:', e?.message || e);
                return;
            }
        }

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // 📋 CATEGORY DEFINITIONS
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        const categories = {
            '1': {
                title: '📋 ᴍᴀɪɴ ᴍᴇɴᴜ',
                commands: [
                    { cmd: 'menu', desc: 'Show main menu' },
                    { cmd: 'ping', desc: 'Check bot speed' },
                    { cmd: 'alive', desc: 'Check bot status' },
                    { cmd: 'owner', desc: 'Show owner info' },
                    { cmd: 'system', desc: 'System info' },
                    { cmd: 'runtime', desc: 'Bot uptime' },
                    { cmd: 'settings', desc: 'View settings' },
                    { cmd: 'help', desc: 'Show help menu' },
                    { cmd: 'allmenu', desc: 'Show all commands' },
                    { cmd: 'info', desc: 'Bot info' }
                ]
            },
            '2': {
                title: '📥 ᴅᴏᴡɴʟᴏᴀᴅ ᴍᴇɴᴜ',
                commands: [
                    { cmd: 'play', desc: 'Play audio from YouTube' },
                    { cmd: 'video', desc: 'Download YouTube video' },
                    { cmd: 'song', desc: 'Download song' },
                    { cmd: 'ytmp3', desc: 'YouTube to MP3' },
                    { cmd: 'ytmp4', desc: 'YouTube to MP4' },
                    { cmd: 'tiktok', desc: 'Download TikTok video' },
                    { cmd: 'fb', desc: 'Download Facebook video' },
                    { cmd: 'ig', desc: 'Download Instagram media' },
                    { cmd: 'twitter', desc: 'Download Twitter/X video' },
                    { cmd: 'spotify', desc: 'Download Spotify track' },
                    { cmd: 'mediafire', desc: 'Download MediaFire file' },
                    { cmd: 'apk', desc: 'Download APK' }
                ]
            },
            '3': {
                title: '👑 ᴏᴡɴᴇʀ ᴍᴇɴᴜ',
                commands: [
                    { cmd: 'mode', desc: 'Change bot mode' },
                    { cmd: 'setprefix', desc: 'Change prefix' },
                    { cmd: 'setbotname', desc: 'Change bot name' },
                    { cmd: 'setlogo', desc: 'Change bot logo' },
                    { cmd: 'restart', desc: 'Restart bot' },
                    { cmd: 'shutdown', desc: 'Shutdown bot' },
                    { cmd: 'broadcast', desc: 'Broadcast message' },
                    { cmd: 'block', desc: 'Block a user' },
                    { cmd: 'unblock', desc: 'Unblock a user' },
                    { cmd: 'clearsession', desc: 'Clear session' },
                    { cmd: 'eval', desc: 'Evaluate JS code' },
                    { cmd: 'exec', desc: 'Execute shell command' },
                    { cmd: 'join', desc: 'Join group via link' },
                    { cmd: 'leave', desc: 'Leave current group' }
                ]
            },
            '4': {
                title: '👥 ɢʀᴏᴜᴘ ᴍᴀɴᴀɢᴇ ᴍᴇɴᴜ',
                commands: [
                    { cmd: 'kick', desc: 'Remove member' },
                    { cmd: 'add', desc: 'Add member' },
                    { cmd: 'promote', desc: 'Promote to admin' },
                    { cmd: 'demote', desc: 'Demote from admin' },
                    { cmd: 'mute', desc: 'Mute group' },
                    { cmd: 'unmute', desc: 'Unmute group' },
                    { cmd: 'lock', desc: 'Lock group settings' },
                    { cmd: 'unlock', desc: 'Unlock group settings' },
                    { cmd: 'tagall', desc: 'Tag all members' },
                    { cmd: 'hidetag', desc: 'Hidden tag all' },
                    { cmd: 'groupinfo', desc: 'Group information' },
                    { cmd: 'link', desc: 'Get group link' },
                    { cmd: 'revoke', desc: 'Revoke group link' },
                    { cmd: 'welcome', desc: 'Toggle welcome message' },
                    { cmd: 'goodbye', desc: 'Toggle goodbye message' },
                    { cmd: 'antilink', desc: 'Toggle antilink' },
                    { cmd: 'antispam', desc: 'Toggle antispam' }
                ]
            },
            '5': {
                title: '🌙 ᴏᴛʜᴇʀ ᴍᴇɴᴜ',
                commands: [
                    { cmd: 'sticker', desc: 'Convert to sticker' },
                    { cmd: 'toimg', desc: 'Sticker to image' },
                    { cmd: 'attp', desc: 'Text to animated sticker' },
                    { cmd: 'ttp', desc: 'Text to sticker' },
                    { cmd: 'vv', desc: 'View once reveal' },
                    { cmd: 'save', desc: 'Save media' },
                    { cmd: 'translate', desc: 'Translate text' },
                    { cmd: 'tts', desc: 'Text to speech' },
                    { cmd: 'weather', desc: 'Get weather info' },
                    { cmd: 'shorturl', desc: 'Shorten URL' },
                    { cmd: 'qr', desc: 'Generate QR code' },
                    { cmd: 'readqr', desc: 'Read QR code' },
                    { cmd: 'password', desc: 'Generate password' },
                    { cmd: 'calc', desc: 'Calculate expression' },
                    { cmd: 'define', desc: 'Define a word' },
                    { cmd: 'wiki', desc: 'Wikipedia search' },
                    { cmd: 'news', desc: 'Latest news' },
                    { cmd: 'quote', desc: 'Random quote' },
                    { cmd: 'joke', desc: 'Random joke' },
                    { cmd: 'fact', desc: 'Random fact' }
                ]
            },
            '6': {
                title: '🤖 ᴀɪ sʏsᴛᴇᴍ',
                commands: [
                    { cmd: 'ai', desc: 'Chat with AI assistant' },
                    { cmd: 'gpt', desc: 'GPT AI response' },
                    { cmd: 'gemini', desc: 'Google Gemini AI' },
                    { cmd: 'imagine', desc: 'Generate AI image' },
                    { cmd: 'img', desc: 'AI image generation' },
                    { cmd: 'aiimg', desc: 'AI image (alias)' },
                    { cmd: 'aivoice', desc: 'AI voice generator' },
                    { cmd: 'aitranslate', desc: 'AI translate' },
                    { cmd: 'aisummarize', desc: 'AI summarize text' },
                    { cmd: 'aicode', desc: 'AI code generator' },
                    { cmd: 'aicode', desc: 'AI code (alias)' },
                    { cmd: 'aiwrite', desc: 'AI content writer' },
                    { cmd: 'aistory', desc: 'AI story generator' },
                    { cmd: 'aipoem', desc: 'AI poem generator' },
                    { cmd: 'aimath', desc: 'AI math solver' },
                    { cmd: 'aichat', desc: 'AI chat assistant' },
                    { cmd: 'aicharacter', desc: 'AI character chat' },
                    { cmd: 'aianalyze', desc: 'AI image analyze' },
                    { cmd: 'airemover', desc: 'AI background remover' },
                    { cmd: 'aiupscale', desc: 'AI image upscaler' },
                    { cmd: 'aivoicechanger', desc: 'AI voice changer' },
                    { cmd: 'aimusic', desc: 'AI music generator' },
                    { cmd: 'aivideo', desc: 'AI video generator' }
                ]
            }
        };

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // 📩 LISTEN FOR REPLY
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        const listener = async (update) => {
            try {
                const m = update.messages[0];
                if (!m.message) return;
                if (m.key.fromMe) return;

                const remoteJid = m.key.remoteJid;
                if (remoteJid !== sender) return;

                // Check if replying to the menu message
                const quotedId = m.message?.extendedTextMessage?.contextInfo?.stanzaId;
                if (quotedId !== menuMsg.key.id) return;

                const text = (
                    m.message.conversation ||
                    m.message.extendedTextMessage?.text ||
                    m.message.imageMessage?.caption ||
                    ''
                ).trim();

                const choice = text.match(/^([1-6])$/);
                if (!choice) return;

                const cat = categories[choice[1]];
                if (!cat) return;

                // Build category caption
                let catCaption = `╭━━━〔 *${cat.title}* 〕━━━╮\n\n`;
                cat.commands.forEach((c, i) => {
                    const num = String(i + 1).padStart(2, '0');
                    catCaption += `┃ ❍ ${num}┊ *${prefix}${c.cmd}*\n┃      ⤷ _${c.desc}_\n`;
                });
                catCaption += `\n╰━━━━━━━━━━━━━━━━━━━━╯\n\n`;
                catCaption += `> 🤖 *ᴛᴏᴛᴀʟ ᴄᴏᴍᴍᴀɴᴅꜱ:* ${cat.commands.length}\n`;
                catCaption += `> 📌 *ᴘʀᴇꜰɪx:* \`${prefix}\`\n\n`;
                catCaption += `🧚‍♀️ *©ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝐁ʟᴀᴄᴋ 𝐂ᴀᴛ 𝐎ꜰᴄ*`;

                await socket.sendMessage(
                    sender, {
                        text: catCaption,
                        contextInfo: channelContext
                    }, {
                        quoted: m
                    }
                );

                // React to confirm
                try {
                    await socket.sendMessage(sender, {
                        react: {
                            text: '✅',
                            key: m.key
                        }
                    });
                } catch (e) {}

                // Cleanup listener after successful response
                socket.ev.off('messages.upsert', listener);

            } catch (err) {
                console.error('[MENU LISTENER]', err?.message || err);
            }
        };

        socket.ev.on('messages.upsert', listener);

        // Auto-cleanup after 5 minutes
        setTimeout(() => {
            try {
                socket.ev.off('messages.upsert', listener);
            } catch (e) {}
        }, 5 * 60 * 1000);
    }
};
