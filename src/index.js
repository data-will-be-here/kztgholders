import cron from 'node-cron';
import { config } from './config.js';
import { getHolderCount } from './tonapi.js';
import { sendMessage } from './telegram.js';
import { loadState, saveState } from './state.js';
import { stillSameMessage, holdersIncreasedMessage, holdersDecreasedMessage, pluralKazakh } from './messages.js';
import { startBotPolling } from './bot.js';

function todayStr() {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: config.timezone }).format(new Date());
}

async function checkForChange() {
  const total = await getHolderCount();
  if (total === null) return; // API unavailable/suspicious this cycle, try again next tick

  const state = await loadState();

  if (state.holders === null) {
    console.log(`[init] baseline holder count set to ${total}`);
    state.holders = total;
    await saveState(state);
    return;
  }

  if (total === state.holders) {
    console.log(`[poll] в тоне по-прежнему ${total} ${pluralKazakh(total)}`);
    return;
  }

  console.log(`[poll] holder count changed: ${state.holders} -> ${total}`);
  const message =
    total > state.holders
      ? holdersIncreasedMessage(total)
      : holdersDecreasedMessage(total, state.holders);

  try {
    await sendMessage(message);
  } catch (err) {
    console.error(`[telegram] failed to send change alert: ${err.message}`);
    return; // don't persist the new count until we've actually announced it
  }

  state.holders = total;
  await saveState(state);
}

async function postDailyUpdate() {
  const today = todayStr();
  const state = await loadState();

  if (state.lastDailyPostDate === today) {
    console.log('[daily] already posted today, skipping');
    return;
  }

  const total = await getHolderCount();
  if (total === null) {
    console.warn('[daily] tonapi unavailable, will retry on next scheduled run');
    return;
  }

  if (state.holders !== null && total !== state.holders) {
    console.log(`[daily] holder count changed since baseline (${state.holders} -> ${total}); the poll job will announce this`);
  }

  try {
    await sendMessage(stillSameMessage(total));
  } catch (err) {
    console.error(`[telegram] failed to send daily update: ${err.message}`);
    return;
  }

  state.holders = total;
  state.lastDailyPostDate = today;
  await saveState(state);
}

async function main() {
  console.log(`[startup] watching jetton ${config.jettonAddress}`);
  console.log(`[startup] poll schedule: ${config.pollCron}, daily schedule: ${config.dailyCron} (${config.timezone})`);

  if (config.sendStartupNotice) {
    await sendMessage('🤖 Бот запущен и следит за холдерами KZTG в тоне.').catch((err) =>
      console.error(`[telegram] startup notice failed: ${err.message}`)
    );
  }

  await checkForChange();

  cron.schedule(config.pollCron, () => {
    checkForChange().catch((err) => console.error(`[poll] unexpected error: ${err.stack}`));
  }, { timezone: config.timezone });

  cron.schedule(config.dailyCron, () => {
    postDailyUpdate().catch((err) => console.error(`[daily] unexpected error: ${err.stack}`));
  }, { timezone: config.timezone });

  startBotPolling().catch((err) => console.error(`[bot] polling loop crashed: ${err.stack}`));
}

main().catch((err) => {
  console.error(`[fatal] ${err.stack}`);
  process.exit(1);
});
