import { loadConfig } from './config';
import { runPoke } from './poker';

async function main() {
  const config = loadConfig();
  const isDaemon = process.argv.includes('--daemon') || process.argv.includes('-d');

  if (isDaemon) {
    console.log(`🔄 Running in DAEMON mode (Interval: every ${config.daemonIntervalMinutes} minutes)`);
    console.log(`Press Ctrl+C to stop.\n`);

    // Run immediately on start
    await runPoke(config);

    // Schedule periodic pokes
    const intervalMs = config.daemonIntervalMinutes * 60 * 1000;
    setInterval(async () => {
      try {
        await runPoke(config);
      } catch (err: any) {
        console.error('Unexpected error in daemon loop:', err.message);
      }
    }, intervalMs);
  } else {
    // Single execution (e.g. for GitHub Actions cron or manual run)
    const results = await runPoke(config);
    const hasFailures = results.some((r) => !r.success);
    if (hasFailures) {
      process.exitCode = 1;
    }
  }
}

main().catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
