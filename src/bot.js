import { getUpdates, sendMessage, deleteWebhook } from './telegram.js';
import { loadState } from './state.js';
import { currentCountMessage } from './messages.js';

const POLL_TIMEOUT_SEC = 30;
const ERROR_BACKOFF_MS = 5000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function handleMessage(message) {
  if (!message?.chat?.id) return;

  // Answers instantly from the last cached holder count (loadState is a
  // local file read) — no tonapi.io call is made on incoming messages.
  const state = await loadState();

  try {
    await sendMessage(currentCountMessage(state.holders), message.chat.id);
  } catch (err) {
    console.error(`[bot] failed to reply to chat ${message.chat.id}: ${err.message}`);
  }
}

export async function startBotPolling() {
  await deleteWebhook();

  let offset = 0;
  console.log('[bot] long-polling for direct messages started');

  for (;;) {
    let updates;
    try {
      updates = await getUpdates(offset, POLL_TIMEOUT_SEC);
    } catch (err) {
      console.error(`[bot] getUpdates loop error: ${err.message}`);
      await sleep(ERROR_BACKOFF_MS);
      continue;
    }

    if (updates.length === 0) continue;

    for (const update of updates) {
      offset = update.update_id + 1;
      if (update.message) {
        handleMessage(update.message).catch((err) =>
          console.error(`[bot] unexpected error handling message: ${err.stack}`)
        );
      }
    }
  }
}
