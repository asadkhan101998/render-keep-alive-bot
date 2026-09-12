import { chromium, request } from 'playwright';
import { PokeConfig } from './config';

export interface PokeResult {
  url: string;
  success: boolean;
  statusCode?: number;
  durationMs: number;
  pageTitle?: string;
  error?: string;
  attempts: number;
}

/**
 * Pokes a URL using a real Playwright Chromium browser.
 * This simulates actual user interaction, triggers SSR/hydration, and bypasses basic bot shields.
 */
async function pokeWithBrowser(url: string, config: PokeConfig): Promise<PokeResult> {
  let attempts = 0;
  const startTime = Date.now();

  while (attempts < config.maxRetries) {
    attempts++;
    console.log(`\n🌐 [Attempt ${attempts}/${config.maxRetries}] Launching headless browser to poke: ${url}`);

    let browser;
    try {
      const attemptStart = Date.now();
      browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      });

      const context = await browser.newContext({
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 (RenderKeepAlive/1.0)',
      });

      const page = await context.newPage();

      console.log(`⏳ Navigating to ${url} (waiting for cold-start up to ${config.timeoutMs / 1000}s)...`);
      const response = await page.goto(url, {
        timeout: config.timeoutMs,
        waitUntil: 'domcontentloaded',
      });

      const statusCode = response ? response.status() : 200;
      const title = await page.title().catch(() => 'N/A');
      const attemptDuration = Date.now() - attemptStart;

      console.log(`✅ Response received! HTTP Status: ${statusCode} | Page Title: "${title}" | Time: ${attemptDuration}ms`);

      if (statusCode >= 200 && statusCode < 400) {
        await browser.close();
        return {
          url,
          success: true,
          statusCode,
          durationMs: Date.now() - startTime,
          pageTitle: title,
          attempts,
        };
      } else {
        console.warn(`⚠️ HTTP status ${statusCode} is not 2xx/3xx. Retrying if attempts remain...`);
      }
    } catch (err: any) {
      console.error(`❌ Error poking ${url} on attempt ${attempts}: ${err.message}`);
      if (attempts < config.maxRetries) {
        const backoffMs = attempts * 3000;
        console.log(`⏸️ Waiting ${backoffMs / 1000}s before next retry...`);
        await new Promise((r) => setTimeout(r, backoffMs));
      }
    } finally {
      if (browser) {
        await browser.close().catch(() => {});
      }
    }
  }

  return {
    url,
    success: false,
    durationMs: Date.now() - startTime,
    error: `Failed after ${attempts} attempts`,
    attempts,
  };
}

/**
 * Pokes a URL using Playwright's lightweight APIRequestContext.
 * Much faster with minimal CPU/RAM usage while maintaining Playwright header control.
 */
async function pokeWithRequest(url: string, config: PokeConfig): Promise<PokeResult> {
  let attempts = 0;
  const startTime = Date.now();

  const reqContext = await request.newContext({
    timeout: config.timeoutMs,
    extraHTTPHeaders: {
      'User-Agent': 'Render-KeepAlive-Bot/1.0 (Playwright Request)',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
  });

  try {
    while (attempts < config.maxRetries) {
      attempts++;
      console.log(`\n⚡ [Attempt ${attempts}/${config.maxRetries}] Sending HTTP request to: ${url}`);

      try {
        const attemptStart = Date.now();
        const response = await reqContext.get(url, {
          timeout: config.timeoutMs,
        });

        const statusCode = response.status();
        const attemptDuration = Date.now() - attemptStart;

        console.log(`✅ Response received! HTTP Status: ${statusCode} | Time: ${attemptDuration}ms`);

        if (statusCode >= 200 && statusCode < 400) {
          return {
            url,
            success: true,
            statusCode,
            durationMs: Date.now() - startTime,
            attempts,
          };
        } else {
          console.warn(`⚠️ Status ${statusCode} received. Retrying...`);
        }
      } catch (err: any) {
        console.error(`❌ Request error on attempt ${attempts}: ${err.message}`);
        if (attempts < config.maxRetries) {
          const backoffMs = attempts * 3000;
          await new Promise((r) => setTimeout(r, backoffMs));
        }
      }
    }
  } finally {
    await reqContext.dispose();
  }

  return {
    url,
    success: false,
    durationMs: Date.now() - startTime,
    error: `Failed after ${attempts} attempts`,
    attempts,
  };
}

/**
 * Main Poke Runner
 */
export async function runPoke(config: PokeConfig): Promise<PokeResult[]> {
  console.log('='.repeat(60));
  console.log(`🚀 STARTING RENDER KEEP-ALIVE POKE ROUTINE`);
  console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
  console.log(`🎯 Targets: ${config.targetUrls.join(', ')}`);
  console.log(`⚙️  Mode: ${config.mode.toUpperCase()} | Max Retries: ${config.maxRetries} | Timeout: ${config.timeoutMs / 1000}s`);
  console.log('='.repeat(60));

  const results: PokeResult[] = [];

  for (const url of config.targetUrls) {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      console.error(`❌ Invalid URL skipped: "${url}". Must start with http:// or https://`);
      continue;
    }

    const result =
      config.mode === 'browser'
        ? await pokeWithBrowser(url, config)
        : await pokeWithRequest(url, config);

    results.push(result);
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 POKE EXECUTION SUMMARY');
  console.log('='.repeat(60));

  let hasFailures = false;
  for (const res of results) {
    if (res.success) {
      console.log(`✅ SUCCESS: ${res.url} (Status: ${res.statusCode}, Time: ${res.durationMs}ms, Attempts: ${res.attempts})`);
    } else {
      console.error(`❌ FAILED:  ${res.url} (Error: ${res.error}, Total Time: ${res.durationMs}ms, Attempts: ${res.attempts})`);
      hasFailures = true;
    }
  }
  console.log('='.repeat(60) + '\n');

  if (hasFailures) {
    console.warn('⚠️ At least one target failed to respond successfully.');
  } else {
    console.log('🎉 All target services are ACTIVE and AWAKE!');
  }

  return results;
}
