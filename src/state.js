import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { config } from './config.js';

const DEFAULT_STATE = {
  holders: null, // last known holder count
  lastDailyPostDate: null, // 'YYYY-MM-DD' in config.timezone, guards against duplicate daily posts
};

export async function loadState() {
  try {
    const raw = await readFile(config.stateFilePath, 'utf8');
    return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.warn(`[state] failed to read state file, starting fresh: ${err.message}`);
    }
    return { ...DEFAULT_STATE };
  }
}

export async function saveState(state) {
  await mkdir(dirname(config.stateFilePath), { recursive: true });
  await writeFile(config.stateFilePath, JSON.stringify(state, null, 2), 'utf8');
}
