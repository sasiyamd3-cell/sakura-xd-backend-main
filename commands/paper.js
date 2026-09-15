// Command: paper (aliases: pdf, papers)
// Paper / PDF Downloader

module.exports = {
  name: 'paper',
  aliases: ['pdf', 'papers'],
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
      os
    } = ctx;

    const axios = require('axios');
    const fs = require('fs');
    const path = require('path');
    const osModule = require('os');
    const crypto = require('crypto');

    const cfg = sessionConfig || {};
    const botName = cfg.botName || BOT_NAME_FANCY;

    // ─────────────────────────────────────
    // PAPER URL
    // ─────────────────────────────────────
    const paperUrl = args[0];

    if (!paperUrl) {
      return reply(`꒰ᵎ 📄 *Paper Downloader* ᵎ꒱

    ⚠️ Please provide a PDF/Paper link!

    📌 *Usage:* ${prefix}paper <PDF URL>
    📌 *Example:* ${prefix}paper https://example.com/paper.pdf

    　　˚₊‧꒰ა 🌸 ໒꒱‧₊˚
    *${botName}* 🖤 | *𝐁ʟᴀᴄᴋ 𝐂ᴀᴛ 𝐎ꜰᴄ*`);
    }

    // ─────────────────────────────────────
    // URL VALIDATION
    // ─────────────────────────────────────
    if (!/^https?:\\/\\//i.test(paperUrl)) {
      return reply(`꒰ᵎ 📄 *Paper Downloader* ᵎ꒱

    ❌ Invalid URL!

    📌 Please provide a valid PDF URL.

    *Example:*
    ${prefix}paper https://example.com/paper.pdf

    　　˚₊‧꒰ა 🌸 ໒꒱‧₊˚
    *${botName}* 🖤 | *𝐁ʟᴀᴄᴋ 𝐂ᴀᴛ 𝐎ꜰᴄ*`);
    }

    await socket.sendMessage(sender, {
      react: {
        text: '🔍',
        key: msg.key
      }
    });

    // ─────────────────────────────────────
    // TEMP FILE
    // ─────────────────────────────────────
    const id = crypto.randomBytes(8).toString('hex');

    const tempFile = path.join(
      osModule.tmpdir(),
      `miyora_paper_${id}.pdf`
    );

    try {

      // ─────────────────────────────────────
      // DOWNLOAD PDF
      // ─────────────────────────────────────
      const response = await axios.get(paperUrl, {
        responseType: 'arraybuffer',
        timeout: 120000,
        maxContentLength: 50 * 1024 * 1024,
        maxBodyLength: 50 * 1024 * 1024,
        headers: {
          'User-Agent': 'Mozilla/5.0'
        }
      });

      const buffer = Buffer.from(response.data);

      if (!buffer || !buffer.length) {
        return reply(`꒰ᵎ 📄 *Paper Downloader* ᵎ꒱

    ❌ Empty file received!

    ⚠️ The PDF may be unavailable.

    　　˚₊‧꒰ა 🌸 ໒꒱‧₊˚
    *${botName}* 🖤 | *𝐁ʟᴀᴄᴋ 𝐂ᴀᴛ 𝐎ꜰᴄ*`);
      }

      // ─────────────────────────────────────
      // BASIC PDF CHECK
      // ─────────────────────────────────────
      const firstBytes = buffer
        .subarray(0, 5)
        .toString();

      const contentType =
        response.headers['content-type'] || '';

      const isPDF =
        firstBytes === '%PDF-' ||
        contentType.toLowerCase().includes('application/pdf');

      if (!isPDF) {
        return reply(`꒰ᵎ 📄 *Paper Downloader* ᵎ꒱

    ❌ The provided link does not appear to be a PDF file!

    📌 Please use a direct PDF download link.

    　　˚₊‧꒰ა 🌸 ໒꒱‧₊˚
    *${botName}* 🖤 | *𝐁ʟᴀᴄᴋ 𝐂ᴀᴛ 𝐎ꜰᴄ*`);
      }

      // ─────────────────────────────────────
      // SAVE TEMP FILE
      // ─────────────────────────────────────
      fs.writeFileSync(tempFile, buffer);

      // ─────────────────────────────────────
      // FILE NAME
      // ─────────────────────────────────────
      let fileName = 'MIYORA-PAPER.pdf';

      try {
        const parsedUrl = new URL(paperUrl);
        const lastPart =
          parsedUrl.pathname.split('/').pop();

        if (lastPart) {
          const decoded =
            decodeURIComponent(lastPart);

          if (decoded.toLowerCase().endsWith('.pdf')) {
            fileName = decoded;
          } else if (decoded.length > 0) {
            fileName = `${decoded}.pdf`;
          }
        }
      } catch (_) {}

      // Clean filename
      fileName = fileName
        .replace(/[<>:"/\\\\|?*]/g, '_')
        .substring(0, 100);

      // ─────────────────────────────────────
      // FILE SIZE
      // ─────────────────────────────────────
      const sizeMB =
        (buffer.length / (1024 * 1024)).toFixed(2);

      // ─────────────────────────────────────
      // DOWNLOADING MESSAGE
      // ─────────────────────────────────────
      await socket.sendMessage(sender, {
        text: `꒰ᵎ 📥 *Downloading* ᵎ꒱

    ⏳ Processing PDF paper...

    📄 *File* ➜ ${fileName}
    📦 *Size* ➜ ${sizeMB} MB

    　　˚₊‧꒰ა 🌸 ໒꒱‧₊˚`
      }, {
        quoted: msg
      });

      // ─────────────────────────────────────
      // NEWSLETTER CONTEXT
      // ─────────────────────────────────────
      const nlCtx = {
        forwardingScore: 1,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid:
            NEWSLETTER_CONTEXT
              ?.forwardedNewsletterMessageInfo
              ?.newsletterJid || '',
          newsletterName: botName,
          serverMessageId: 999
        }
      };

      // ─────────────────────────────────────
      // SEND PDF
      // ─────────────────────────────────────
      await socket.sendMessage(sender, {
        document: buffer,
        mimetype: 'application/pdf',
        fileName: fileName,
        caption: `꒰ᵎ 📄 *Paper Downloader* ᵎ꒱

    ✅ *Download Complete!*

    📄 *File* ➜ ${fileName}
    📦 *Size* ➜ ${sizeMB} MB

    　　˚₊‧꒰ა 🌸 ໒꒱‧₊˚
    *${botName}* 🖤 | *𝐁ʟᴀᴄᴋ 𝐂ᴀᴛ 𝐎ꜰᴄ*`,
        contextInfo: nlCtx
      }, {
        quoted: msg
      });

      // ─────────────────────────────────────
      // SUCCESS REACTION
      // ─────────────────────────────────────
      await socket.sendMessage(sender, {
        react: {
          text: '📄',
          key: msg.key
        }
      });

    } catch (error) {

      console.error(
        '[paper] Download error:',
        error.message
      );

      await socket.sendMessage(sender, {
        react: {
          text: '❌',
          key: msg.key
        }
      });

      return reply(`꒰ᵎ ❌ *Paper Downloader Error* ᵎ꒱

    ⚠️ Unable to download the PDF.

    📌 Check whether the link is valid
    📌 Make sure the PDF is publicly accessible
    📌 Maximum file size: 50 MB

    　　˚₊‧꒰ა 🌸 ໒꒱‧₊˚
    *${botName}* 🖤 | *𝐁ʟᴀᴄᴋ 𝐂ᴀᴛ 𝐎ꜰᴄ*`);

    } finally {

      // ─────────────────────────────────────
      // DELETE TEMP FILE
      // ─────────────────────────────────────
      try {
        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile);
        }
      } catch (_) {}

    }
  }
};
