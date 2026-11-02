'use strict';

const fs = require('fs');
const path = require('path');

const SETTINGS_FILE = path.join(__dirname, 'st-settings.json');
const VOICE_URL = 'https://mp3tourl.com/audio/1793614308201-17329790-6d74-4f2e-aa77-f0c274d62703.opus';
const COOLDOWN_MS = 15_000;

const DEFAULT_SETTINGS = Object.freeze({ enabled: true });
const cooldowns = new Map();

function loadSettings() {
  try {
    if (!fs.existsSync(SETTINGS_FILE)) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
    return { enabled: typeof parsed.enabled === 'boolean' ? parsed.enabled : true };
  } catch (error) {
    console.error('[ST] Could not read settings:', error.message);
    return { ...DEFAULT_SETTINGS };
  }
}

function saveSettings(settings) {
  const tempFile = `${SETTINGS_FILE}.tmp`;
  try {
    fs.writeFileSync(tempFile, JSON.stringify({ enabled: !!settings.enabled }, null, 2), 'utf8');
    fs.renameSync(tempFile, SETTINGS_FILE);
    return true;
  } catch (error) {
    console.error('[ST] Could not save settings:', error.message);
    try { if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile); } catch (_) {}
    return false;
  }
}

function getMessageText(msg) {
  if (!msg || !msg.message) return '';
  const m = msg.message;
  return (
    m.conversation ||
    m.extendedTextMessage?.text ||
    m.imageMessage?.caption ||
    m.videoMessage?.caption ||
    m.documentMessage?.caption ||
    m.buttonsResponseMessage?.selectedButtonId ||
    m.listResponseMessage?.singleSelectReply?.selectedRowId ||
    m.templateButtonReplyMessage?.selectedId ||
    ''
  );
}

function normalizeText(value) {
  return String(value || '')
    .normalize('NFKC')
    .toLocaleLowerCase()
    .replace(/[!?.,;:。！？၊،]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const CONTROL_ON = new Set(['on', 'enable', 'start', 'ක්‍රියාත්මක කරන්න', 'ඕන් කරන්න']);
const CONTROL_OFF = new Set(['off', 'disable', 'stop', 'නවත්වන්න', 'ඕෆ් කරන්න']);
const CONTROL_STATUS = new Set(['status', 'info', 'තත්ත්වය']);

const VOICE_TRIGGERS = new Set([
  'mk', 'moko', 'mokada', 'wyd', 'what are you doing', 'what r u doing',
  'what you doing', 'whats up', 'what is up', 'මොකද කරන්නෙ', 'මොකද කරන්නේ',
  'මොකද වෙන්නේ', 'මොකද වෙන්නෙ', 'මොකද කරන්නෙ බන්', 'මොකද කරන්නේ බන්',
  'මොකද වෙන්නේ බන්', 'මොකද වෙන්නෙ බන්', 'මොකද කරන්නෙ මචං',
  'මොකද කරන්නේ මචං', 'මොකද වෙන්නේ මචං', 'මොකද වෙන්නෙ මචං'
]);

function isVoiceTrigger(text) {
  const normalized = normalizeText(text);
  if (VOICE_TRIGGERS.has(normalized)) return true;

  // Allow common trailing forms such as "mk bn", "wyd bro".
  return /^(mk|moko|mokada|wyd|what are you doing|what r u doing|what you doing)(\s+(bn|bro|machan|මචං|බන්))?$/.test(normalized);
}

function getControlAction(text) {
  const normalized = normalizeText(text);
  const match = normalized.match(/^(?:st|stvoice)\s+(.+)$/);
  if (!match) return null;
  const action = match[1].trim();
  if (CONTROL_ON.has(action)) return 'on';
  if (CONTROL_OFF.has(action)) return 'off';
  if (CONTROL_STATUS.has(action)) return 'status';
  return null;
}

async function safeReply(ctx, text) {
  if (typeof ctx.reply === 'function') return ctx.reply(text);
  const chatJid = ctx.from || ctx.msg?.key?.remoteJid;
  if (!chatJid || !ctx.socket?.sendMessage) return;
  return ctx.socket.sendMessage(chatJid, { text });
}

async function sendVoice(ctx) {
  const msg = ctx.msg;
  const socket = ctx.socket;
  const chatJid = ctx.from || msg?.key?.remoteJid;
  if (!socket?.sendMessage || !chatJid) throw new Error('Missing socket or chat JID');

  await socket.sendMessage(
    chatJid,
    {
      audio: { url: VOICE_URL },
      mimetype: 'audio/ogg; codecs=opus',
      ptt: true
    },
    { quoted: msg }
  );
}

async function handleAutoReply(ctx) {
  const msg = ctx?.msg;
  if (!msg?.key || msg.key.fromMe) return false;

  const chatJid = ctx.from || msg.key.remoteJid;
  if (!chatJid || chatJid === 'status@broadcast') return false;

  const text = ctx.body || ctx.text || getMessageText(msg);
  if (!text) return false;

  const action = getControlAction(text);
  if (action) {
    const settings = loadSettings();
    if (action === 'on' || action === 'off') {
      settings.enabled = action === 'on';
      if (!saveSettings(settings)) {
        await safeReply(ctx, '❌ ST settings save කරන්න බැරි වුණා. Folder permissions පරීක්ෂා කරන්න.');
      } else {
        await safeReply(ctx, action === 'on'
          ? '🟢 *ST VOICE ON*\n\nVoice System එක දැන් ක්‍රියාත්මකයි!'
          : '🔴 *ST VOICE OFF*\n\nVoice System එක නවත්වන ලදී!');
      }
    } else {
      await safeReply(ctx, `🎙️ *ST VOICE STATUS*\n\nStatus: ${settings.enabled ? '🟢 ON' : '🔴 OFF'}`);
    }
    return true;
  }

  if (!isVoiceTrigger(text)) return false;
  if (!loadSettings().enabled) return true;

  const sender = msg.key.participant || msg.key.remoteJid;
  const cooldownKey = `${chatJid}:${sender}`;
  const now = Date.now();
  const previous = cooldowns.get(cooldownKey) || 0;
  if (now - previous < COOLDOWN_MS) return true;
  cooldowns.set(cooldownKey, now);

  try {
    await sendVoice(ctx);
  } catch (error) {
    cooldowns.delete(cooldownKey);
    console.error('[ST Voice Error]', error);
    await safeReply(ctx, '❌ Voice එක යවන්න බැරි වුණා! Audio URL එක සහ internet connection එක පරීක්ෂා කරන්න.');
  }
  return true;
}

module.exports = {
  name: 'st',
  aliases: ['stvoice'],

  // Call this from the main messages.upsert handler for EVERY incoming message.
  handleAutoReply,

  async execute(ctx) {
    const action = normalizeText((ctx.args || []).join(' '));
    const settings = loadSettings();

    if (CONTROL_ON.has(action)) {
      settings.enabled = true;
      return saveSettings(settings)
        ? safeReply(ctx, '🟢 *ST VOICE ON*\n\nVoice System එක දැන් ක්‍රියාත්මකයි!')
        : safeReply(ctx, '❌ ST settings save කරන්න බැරි වුණා.');
    }

    if (CONTROL_OFF.has(action)) {
      settings.enabled = false;
      return saveSettings(settings)
        ? safeReply(ctx, '🔴 *ST VOICE OFF*\n\nVoice System එක නවත්වන ලදී!')
        : safeReply(ctx, '❌ ST settings save කරන්න බැරි වුණා.');
    }

    if (CONTROL_STATUS.has(action)) {
      return safeReply(ctx, `🎙️ *ST VOICE STATUS*\n\nStatus: ${settings.enabled ? '🟢 ON' : '🔴 OFF'}`);
    }

    return safeReply(ctx, 'භාවිතය: st on | st off | st status');
  }
};
