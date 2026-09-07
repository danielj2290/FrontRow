// ======================
// Nightly cron schedule
// ======================
// Imported by server.ts, so the schedule lives inside the API process that PM2
// already keeps alive. That is deliberate: PM2 restarts it on crash and brings
// it back on reboot, which a bare crontab entry would not.
//
// The consequence is that a dead API process is also a dead bot — which is
// exactly why the PM2 systemd unit had to be registered. A missed night cannot
// be backfilled: nobody can tell you what the price was last Tuesday.

import cron from "node-cron";
import { runBot } from "../bot/index.js";
import { log } from "../bot/logger.js";

// Midnight America/Los_Angeles rather than the server's UTC. Prices move on
// the venue's calendar, and pinning the timezone means the daily deltas the
// Monte Carlo model reads are evenly spaced even across daylight saving.
const SCHEDULE = "0 0 * * *";
const TIMEZONE = "America/Los_Angeles";

// Guards against a slow run still going when the next one fires. Overlapping
// runs would double the load on both marketplaces for no benefit — the DB
// would collapse them into the same row anyway.
let running = false;

export function startNightlyJob(): void {
  cron.schedule(
    SCHEDULE,
    async () => {
      if (running) {
        log("previous run still going — skipping this tick");
        return;
      }

      running = true;
      try {
        await runBot();
      } catch (error) {
        // Never let a bot failure take down the API process it shares.
        log(`run threw: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        running = false;
      }
    },
    { timezone: TIMEZONE }
  );

  log(`nightly scrape scheduled: ${SCHEDULE} ${TIMEZONE}`);
}
