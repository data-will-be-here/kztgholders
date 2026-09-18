import { config } from './config.js';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchHoldersOnce() {
  const url = `https://tonapi.io/v2/jettons/${config.jettonAddress}/holders?limit=1&offset=0`;
  const headers = { Accept: 'application/json' };
  if (config.tonApiKey) {
    headers.Authorization = `Bearer ${config.tonApiKey}`;
  }

  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`tonapi responded with HTTP ${res.status}`);
  }

  const data = await res.json();
  const total = data?.total;

  if (typeof total !== 'number' || !Number.isFinite(total) || total < 0) {
    throw new Error(`tonapi returned an invalid holders total: ${JSON.stringify(total)}`);
  }

  return total;
}

/**
 * Fetches the current jetton holder count, retrying with backoff on network
 * errors, non-200 responses, malformed payloads, or a suspicious "0 holders"
 * result (the jetton is known to have had holders before, so a report of 0
 * is treated as a transient API glitch rather than fact).
 *
 * Returns null (never throws) if every attempt fails, so callers can simply
 * skip that poll cycle instead of spamming retries or crashing the process.
 */
export async function getHolderCount() {
  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      const total = await fetchHoldersOnce();
      if (total > 0) {
        return total;
      }
      console.warn(
        `[tonapi] got 0 holders on attempt ${attempt}/${config.maxAttempts}, treating as suspicious and retrying`
      );
    } catch (err) {
      console.warn(
        `[tonapi] attempt ${attempt}/${config.maxAttempts} failed: ${err.message}`
      );
    }

    if (attempt < config.maxAttempts) {
      const delay = config.retryDelaysMs[attempt - 1] ?? config.retryDelaysMs.at(-1);
      await sleep(delay);
    }
  }

  console.error('[tonapi] all attempts exhausted (including 0-holder responses), skipping this cycle');
  return null;
}
