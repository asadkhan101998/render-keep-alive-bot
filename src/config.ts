import * as dotenv from 'dotenv';
dotenv.config();

export interface PokeConfig {
  targetUrls: string[];
  timeoutMs: number;
  maxRetries: number;
  mode: 'browser' | 'request';
  daemonIntervalMinutes: number;
}

export function loadConfig(): PokeConfig {
  // Support TARGET_URL, TARGET_URLS, or RENDER_APP_URL
  const rawUrls =
    process.env.TARGET_URLS ||
    process.env.TARGET_URL ||
    process.env.RENDER_APP_URL ||
    'https://httpbin.org/get'; // Fallback demo url

  const targetUrls = rawUrls
    .split(',')
    .map((u) => u.trim())
    .filter((u) => u.length > 0);

  const timeoutMs = parseInt(process.env.TIMEOUT_MS || '90000', 10);
  const maxRetries = parseInt(process.env.MAX_RETRIES || '3', 10);
  const mode = (process.env.POKE_MODE === 'request' ? 'request' : 'browser') as 'browser' | 'request';
  const daemonIntervalMinutes = parseInt(process.env.DAEMON_INTERVAL_MINUTES || '12', 10);

  return {
    targetUrls,
    timeoutMs,
    maxRetries,
    mode,
    daemonIntervalMinutes,
  };
}
