// ======================
// Bot run logging
// ======================
// Every run prints a summary: how many events it visited, how many prices it
// captured, what failed, and how long it took. When the bot runs unattended at
// midnight, this log is the only evidence of what happened — so it has to say
// enough to diagnose a bad night without re-running anything.

export interface RunStats {
  startedAt: Date;
  attempted: number;
  captured: number;
  skipped: number;
  failed: number;
  errors: { event: string; site: string; reason: string }[];
}

export function startRun(): RunStats {
  return {
    startedAt: new Date(),
    attempted: 0,
    captured: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  };
}

export function log(message: string): void {
  console.log(`[bot ${new Date().toISOString()}] ${message}`);
}

export function finishRun(stats: RunStats): void {
  const seconds = Math.round((Date.now() - stats.startedAt.getTime()) / 1000);

  log(
    `run complete in ${seconds}s — attempted ${stats.attempted}, ` +
      `captured ${stats.captured}, skipped ${stats.skipped}, failed ${stats.failed}`
  );

  // Errors are grouped at the end rather than only appearing inline, so a
  // failing site is obvious at a glance instead of buried in a long log.
  for (const error of stats.errors) {
    log(`  FAILED ${error.site} / ${error.event}: ${error.reason}`);
  }

  // A run where everything failed usually means a block or a layout change,
  // not thirty unrelated bugs. Call that out explicitly.
  if (stats.attempted > 0 && stats.captured === 0) {
    log("  WARNING: nothing captured. Likely a block or changed selectors, not a per-event fault.");
  }
}
