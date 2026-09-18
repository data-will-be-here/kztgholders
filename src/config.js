function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export const config = {
  botToken: required('TELEGRAM_BOT_TOKEN'),
  chatId: required('TELEGRAM_CHAT_ID', '-1004376417384'),
  jettonAddress: required(
    'JETTON_ADDRESS',
    'EQDpup8p2DKjPrf9Pk2Sv6mqVE7R2ktcgZ6r0vlklCLwph_G'
  ),
  tonApiKey: process.env.TONAPI_KEY || '',
  pollCron: process.env.POLL_CRON || '*/10 * * * *',
  dailyCron: process.env.DAILY_CRON || '0 9 * * *',
  timezone: process.env.TZ_NAME || 'Asia/Almaty',
  stateFilePath: process.env.STATE_FILE_PATH || './data/state.json',
  maxAttempts: Number(process.env.TONAPI_MAX_ATTEMPTS || 4),
  retryDelaysMs: [5000, 15000, 45000],
  sendStartupNotice: process.env.SEND_STARTUP_NOTICE === 'true',
};
