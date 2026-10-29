case 'bot':
case 'pairing': {
  const number = (args[0] || '').replace(/\D/g, '');

  if (!number || number.length < 10 || number.length > 15) {
    return reply(
      '❌ Usage: .bot 9477XXXXXXXX\n\n' +
      'Example: .pairing 9477XXXXXXXX'
    );
  }

  try {
    await reply('⏳ Generating your WhatsApp pairing code...');

    const response = await axios.get(
      `${PAIRING_API_URL}/?number=${encodeURIComponent(number)}`,
      { timeout: 30000 }
    );

    const code = response.data?.code;

    if (!code) {
      return reply(
        '❌ Pairing code generate කරන්න බැරි වුණා.\n' +
        (response.data?.message || 'Backend එක පරීක්ෂා කරන්න.')
      );
    }

    await reply(
      `🔐 *WHATSAPP PAIRING CODE*\n\n` +
      `📱 Number: ${number}\n` +
      `🔑 Code: *${code}*\n\n` +
      `WhatsApp > Linked Devices > Link a Device > ` +
      `Link with phone number වෙත ගිහින් code එක ඇතුළත් කරන්න.\n\n` +
      `🌸 ${BOT_NAME_FANCY}`
    );
  } catch (error) {
    console.error('[PAIRING COMMAND]', error.response?.data || error.message);
    await reply('❌ Pairing service එකෙන් code එක ලබාගන්න බැරි වුණා.');
  }

  break;
}
