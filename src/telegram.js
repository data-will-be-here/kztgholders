import { config } from './config.js';

const API_BASE = `https://api.telegram.org/bot${config.botToken}`;

export async function sendMessage(text, chatId = config.chatId) {
  const res = await fetch(`${API_BASE}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) {
    throw new Error(
      `telegram sendMessage failed: HTTP ${res.status} ${JSON.stringify(data)}`
    );
  }
  return data;
}

export async function deleteWebhook() {
  const res = await fetch(`${API_BASE}/deleteWebhook`, { method: 'POST' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) {
    console.warn(`[telegram] deleteWebhook failed: HTTP ${res.status} ${JSON.stringify(data)}`);
  }
}

/**
 * Long-polls Telegram for new updates. Resolves to [] (never throws) on
 * network errors or bad responses so the polling loop can just back off
 * and retry instead of crashing.
 */
export async function getUpdates(offset, timeoutSec) {
  const url = `${API_BASE}/getUpdates?timeout=${timeoutSec}&offset=${offset}&allowed_updates=["message"]`;
  try {
    const res = await fetch(url);
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.ok === false) {
      console.warn(`[telegram] getUpdates failed: HTTP ${res.status} ${JSON.stringify(data)}`);
      return [];
    }
    return data.result || [];
  } catch (err) {
    console.warn(`[telegram] getUpdates error: ${err.message}`);
    return [];
  }
}
