// Command: movie (aliases: movies, film, sinsub)
// Auto-extracted from sakura.js switch-case during commandLoader refactor.
module.exports = {
  name: 'movie',
  aliases: ['movies', 'film', 'sinsub'],
  async execute(ctx) {
    const {
      socket, msg, sender, from, command, args, q, reply,
      sessionConfig, number, prefix, config, BOT_NAME_FANCY,
      NEWSLETTER_CONTEXT, resolveReplyJid, downloadQuotedMedia,
      getSriLankaTimestamp, formatMessage, fs, path, os
    } = ctx;

      const axios = require('axios');

      const sanitized = (number || '').replace(/[^0-9]/g, '');
      const cfg = sessionConfig; // reused from top of handler (was: extra Mongo query per command)
      const botName = cfg.botName || BOT_NAME_FANCY;

      if (!q || q.trim() === '') {
        return reply(`❌ *Movie name ekak denna!*\n\nExample: *${prefix}movie Vincenzo*`);
      }

      const MOVIE_API = "https://movies-one-wheat.vercel.app";
      const FALLBACK_BANNER = cfg.logo || config.IMAGE_PATH;
      const NEWSLETTER = {
        newsletterJid: NEWSLETTER_CONTEXT.forwardedNewsletterMessageInfo.newsletterJid,
        newsletterName: botName,
        serverMessageId: 143
      };

      const searchRes = await axios.get(`${MOVIE_API}/api/screech=${encodeURIComponent(q.trim())}`, { timeout: 30000 });

      if (!searchRes.data?.status || !searchRes.data.count) {
        return reply(`❌ *"${q}"* nemei movie ekak hambuna na!\n\nVenas keyword ekakin try karanna.`);
      }

      const movies = searchRes.data.results.slice(0, 10);

      let listText = `🎬 *${botName}*\n\n`;
      listText += `🔍 *Search Results:* ${q}\n`;
      listText += `━━━━━━━━━━━━━━━━━━━━\n\n`;
      movies.forEach((mv, i) => {
        listText += `*${i + 1}.* ${mv.title}\n`;
      });
      listText += `\n━━━━━━━━━━━━━━━━━━━━\n`;
      listText += `_Reply with a number (1-${movies.length}) to select_ ⬆️`;

      const listBanner = movies[0]?.poster || FALLBACK_BANNER;

      const sentMsg = await socket.sendMessage(sender, {
        image: { url: listBanner },
        caption: listText,
        contextInfo: {
          forwardingScore: 1000,
          isForwarded: true,
          forwardedNewsletterMessageInfo: NEWSLETTER
        }
      }, { quoted: msg });

      const messageID = sentMsg.key.id;

      global.movieSessions = global.movieSessions || {};
      global.movieSessions[messageID] = { movies, from: sender, expiry: Date.now() + 5 * 60 * 1000 };

      const replyListener = async (upsert) => {
        try {
          for (const replyMsg of (upsert?.messages || [])) {
            if (!replyMsg?.message) continue;
            if (resolveReplyJid(replyMsg) !== sender) continue;

            const quotedId = replyMsg.message?.extendedTextMessage?.contextInfo?.stanzaId;
            if (quotedId !== messageID) continue;

            const replyText = (
              replyMsg.message?.extendedTextMessage?.text ||
              replyMsg.message?.conversation || ''
            ).trim();

            const num = parseInt(replyText);
            const session = global.movieSessions[messageID];

            if (!session) {
              await socket.sendMessage(sender, {
                text: `❌ Session expired! Use *${prefix}movie* again.`
              }, { quoted: replyMsg });
              socket.ev.off('messages.upsert', replyListener);
              return;
            }

            if (isNaN(num) || num < 1 || num > session.movies.length) {
              await socket.sendMessage(sender, {
                text: `❌ Invalid! Reply with a number between 1 and ${session.movies.length}.`
              }, { quoted: replyMsg });
              continue;
            }

            const selected = session.movies[num - 1];
            socket.ev.off('messages.upsert', replyListener);
            delete global.movieSessions[messageID];

            await socket.sendMessage(sender, {
              text: `🔍 *Loading details...*\n\n*${selected.title}*\n\nPlease wait...`
            }, { quoted: replyMsg });

            let movieData, dlData;
            try {
              const [dRes, lRes] = await Promise.all([
                axios.get(`${MOVIE_API}/api/data=${encodeURIComponent(selected.link)}`, { timeout: 30000 }),
                axios.get(`${MOVIE_API}/api/dreclink=${encodeURIComponent(selected.link)}`, { timeout: 90000 })
              ]);
              movieData = dRes.data;
              dlData = lRes.data;
            } catch (err) {
              return await socket.sendMessage(sender, {
                text: `❌ Details load karaddi error ekak une!\n\n${err.message}`
              }, { quoted: replyMsg });
            }

            if (!movieData?.status) {
              return await socket.sendMessage(sender, {
                text: `❌ Movie info load wenne nathu giya!`
              }, { quoted: replyMsg });
            }

            const BLOCKED_HOSTS = ['cdn.sinhalasub.net', 'filespayouts.com', 'ddl.sinhalasub.net'];

            const downloads = (dlData?.downloads || []).filter(d => {
              if (!d.mp4) return false;
              const host = (d.host || '').toLowerCase();
              return !BLOCKED_HOSTS.some(b => host.includes(b));
            });

            if (!downloads.length) {
              return await socket.sendMessage(sender, {
                text: `❌ *${movieData.title}*\n\nDownload links mokuth hamba unne na. Passe try karanna.`
              }, { quoted: replyMsg });
            }

            let detailText = `🎬 *${botName}*\n\n`;
            detailText += `📌 *${movieData.title}*\n`;
            if (movieData.year) detailText += `📅 *Year:* ${movieData.year}\n`;
            if (movieData.language) detailText += `🗣️ *Language:* ${movieData.language}\n`;
            if (movieData.genres?.length) detailText += `🎭 *Genre:* ${movieData.genres.join(', ')}\n`;
            if (movieData.director) detailText += `🎬 *Director:* ${movieData.director}\n`;

            detailText += `━━━━━━━━━━━━━━━━━━━━\n\n`;
            if (movieData.description) {
              const desc = movieData.description;
              detailText += `📖 *About:*\n${desc.substring(0, 350)}${desc.length > 350 ? '...' : ''}\n\n`;
            }
            detailText += `━━━━━━━━━━━━━━━━━━━━\n`;
            detailText += `📥 *Select a quality to download:*\n\n`;

            downloads.forEach((d, i) => {
              detailText += `*${i + 1} -* 📀 ${d.quality || 'Unknown'}${d.size ? ` | 💾 ${d.size}` : ''}\n`;
            });
            detailText += `\n_Reply with the number to download_ ⬆️`;

            const detailMsg = await socket.sendMessage(sender, {
              image: { url: movieData.poster || listBanner },
              caption: detailText,
              contextInfo: {
                forwardingScore: 1000,
                isForwarded: true,
                forwardedNewsletterMessageInfo: NEWSLETTER
              }
            }, { quoted: replyMsg });

            const detailMsgID = detailMsg.key.id;

            global.movieDownloads = global.movieDownloads || {};
            global.movieDownloads[detailMsgID] = {
              title: movieData.title,
              downloads,
              from: sender,
              expiry: Date.now() + 5 * 60 * 1000
            };

            const downloadListener = async (upsert2) => {
              try {
                for (const dlMsg of (upsert2?.messages || [])) {
                  if (!dlMsg?.message) continue;
                  if (resolveReplyJid(dlMsg) !== sender) continue;

                  const dlQuotedId = dlMsg.message?.extendedTextMessage?.contextInfo?.stanzaId;
                  if (dlQuotedId !== detailMsgID) continue;

                  const dlChoice = (
                    dlMsg.message?.extendedTextMessage?.text ||
                    dlMsg.message?.conversation || ''
                  ).trim();

                  const session2 = global.movieDownloads[detailMsgID];
                  if (!session2) {
                    await socket.sendMessage(sender, {
                      text: `❌ Session expired! Use *${prefix}movie* again.`
                    }, { quoted: dlMsg });
                    socket.ev.off('messages.upsert', downloadListener);
                    return;
                  }

                  const dlNum = parseInt(dlChoice);
                  if (isNaN(dlNum) || dlNum < 1 || dlNum > session2.downloads.length) {
                    await socket.sendMessage(sender, {
                      text: `❌ Invalid! Reply with a number between 1 and ${session2.downloads.length}.`
                    }, { quoted: dlMsg });
                    continue;
                  }

                  socket.ev.off('messages.upsert', downloadListener);
                  delete global.movieDownloads[detailMsgID];

                  const chosen = session2.downloads[dlNum - 1];
                  const targetJid = sender;
                  const quotedMsg = dlMsg;

                  await socket.sendMessage(sender, {
                    text: `⬇️ *Sending file...*\n\n🎬 *${session2.title}*\n📀 *Quality:* ${chosen.quality || 'Unknown'}${chosen.size ? `\n💾 *Size:* ${chosen.size}` : ''}\n\nPlease wait, mb ekak nm time gannawa...`
                  }, { quoted: dlMsg });

                  const safeFileName = `${session2.title.replace(/[\\/:*?"<>|]/g, '')} - ${chosen.quality || ''}.mp4`;
                  const directDownloadUrl = chosen.mp4;
                  const doneCaption =
                    `🎬 *${session2.title}*\n` +
                    `📀 *Quality:* ${chosen.quality || 'Unknown'}\n` +
                    `${chosen.size ? `💾 *Size:* ${chosen.size}\n` : ''}` +
                    `\n_Powered by ${botName}_ 🖤`;

                  try {
                    await socket.sendMessage(targetJid || sender, {
                      document: { url: directDownloadUrl },
                      mimetype: 'video/mp4',
                      fileName: safeFileName,
                      caption: doneCaption,
                      contextInfo: {
                        forwardingScore: 1000,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: NEWSLETTER
                      }
                    }, { quoted: quotedMsg });

                    await socket.sendMessage(sender, {
                      react: { text: '✅', key: msg.key }
                    });
                  } catch (sendErr) {
                    console.error('Movie send error:', sendErr);
                    await socket.sendMessage(sender, {
                      text: `❌ File send karaddi error ekak une!\n\n${sendErr.message}\n\nVenas quality ekak try karanna.`
                    }, { quoted: dlMsg });
                  }
                }
              } catch (err) {
                console.error('Movie download error:', err);
                await socket.sendMessage(sender, { text: `❌ Error: ${err.message}` });
              }
            };

            socket.ev.on('messages.upsert', downloadListener);
            setTimeout(() => {
              socket.ev.off('messages.upsert', downloadListener);
              delete global.movieDownloads?.[detailMsgID];
            }, 5 * 60 * 1000);
          }
        } catch (err) {
          console.error('Movie selection error:', err);
          await socket.sendMessage(sender, { text: `❌ Error: ${err.message}` });
        }
      };

      socket.ev.on('messages.upsert', replyListener);
      setTimeout(() => {
        socket.ev.off('messages.upsert', replyListener);
        delete global.movieSessions?.[messageID];
      }, 5 * 60 * 1000);

  }
};
