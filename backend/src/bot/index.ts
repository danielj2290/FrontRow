// ======================
// Bot entry point
// ======================
// Visits every tracked event on every marketplace and records one get-in price
// per event, per marketplace, per night.
//
//   npm run bot                                    full run
//   npm run bot -- --probe --site seatgeek         one event, saves artifacts
//   npm run bot -- --probe --site stubhub --event <db-event-id>
//
// PROBE MODE exists because the selectors in stubhub.ts and seatgeek.ts are
// unverified guesses, and because whether StubHub serves us prices or a
// challenge page is an open question. A probe visits one page, saves a
// screenshot and the HTML, and reports what it found — evidence instead of
// speculation, before any selector is trusted.

import "../config/env.js";
import type { Browser } from "puppeteer";
import { prisma } from "../db.js";
import { listTrackedEvents } from "../services/ingest.js";
import { launchBrowser, openPage, politeDelay, saveDebugArtifacts } from "./scraper.js";
import { finishRun, log, startRun, type RunStats } from "./logger.js";
import { alreadyCapturedToday, saveSnapshot } from "./deduplicator.js";
import { seatgeekScraper } from "./seatgeek.js";
import { stubhubScraper } from "./stubhub.js";
import type { ScrapeTarget, SiteScraper } from "./types.js";

const SCRAPERS: SiteScraper[] = [seatgeekScraper, stubhubScraper];

/**
 * Scrape one event on one site.
 *
 * Every failure path here logs and returns rather than throwing. One dead page
 * must never end the night's run — the whole value of this bot is that it
 * collects something every night, and a thrown error would abandon every event
 * after the failure.
 */
async function scrapeOne(
  browser: Browser,
  scraper: SiteScraper,
  target: ScrapeTarget,
  stats: RunStats,
  probe: boolean
): Promise<void> {
  if (!probe && (await alreadyCapturedToday(target.id, scraper.marketplace))) {
    stats.skipped += 1;
    return;
  }

  stats.attempted += 1;

  const url = await scraper.buildUrl(target);
  if (!url) {
    log(`  ${scraper.name}: no url for "${target.title}" — skipping`);
    stats.skipped += 1;
    return;
  }

  const page = await openPage(browser);

  try {
    log(`  ${scraper.name}: ${target.title}`);
    // domcontentloaded, not networkidle: ticket pages poll continuously, so
    // waiting for an idle network can hang until the timeout every time.
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30_000 });

    // Prices are rendered by JavaScript after load, so give the app a moment
    // to paint before reading the DOM.
    await new Promise((resolve) => setTimeout(resolve, 4000));

    const result = await scraper.extract(page);

    if (probe) {
      log(`  probe result: ${JSON.stringify(result)}`);
      log(`  page title: ${await page.title()}`);
      await saveDebugArtifacts(page, scraper.name);
      return;
    }

    if (result.getInPrice === null) {
      // Almost always a changed selector or a challenge page, not a genuinely
      // priceless event — so leave artifacts behind to diagnose it later.
      stats.failed += 1;
      stats.errors.push({
        event: target.title,
        site: scraper.name,
        reason: "no price found (selector changed or blocked?)",
      });
      await saveDebugArtifacts(page, `${scraper.name}-noprice`);
      return;
    }

    await saveSnapshot({
      eventId: target.id,
      source: scraper.source,
      marketplace: scraper.marketplace,
      getInPrice: result.getInPrice,
      listingCount: result.listingCount,
      isAllInPrice: result.isAllInPrice,
    });

    stats.captured += 1;
    log(`  captured $${result.getInPrice}`);
  } catch (error) {
    stats.failed += 1;
    stats.errors.push({
      event: target.title,
      site: scraper.name,
      reason: error instanceof Error ? error.message : String(error),
    });
  } finally {
    await page.close();
  }
}

export async function runBot(options: {
  probe?: boolean;
  site?: string;
  eventId?: string;
} = {}): Promise<RunStats> {
  const stats = startRun();
  const scrapers = options.site
    ? SCRAPERS.filter((scraper) => scraper.name === options.site)
    : SCRAPERS;

  if (scrapers.length === 0) {
    log(`no scraper named "${options.site}" — try seatgeek or stubhub`);
    return stats;
  }

  const events = await listTrackedEvents();
  const selected = options.eventId
    ? events.filter((event) => event.id === options.eventId)
    : options.probe
      ? events.slice(0, 1)
      : events;

  log(`${selected.length} event(s) x ${scrapers.length} site(s)`);

  if (selected.length === 0) {
    log("nothing to scrape — track some events first: npm run track -- sg-<id>");
    return stats;
  }

  const browser = await launchBrowser();

  try {
    for (const event of selected) {
      const target: ScrapeTarget = {
        id: event.id,
        title: event.title,
        artistName: event.artist.name,
        venueName: event.venue.name,
        city: event.venue.city,
        eventDate: event.eventDate,
        seatgeekId: event.seatgeekId,
        ticketmasterId: event.ticketmasterId,
      };

      for (const scraper of scrapers) {
        await scrapeOne(browser, scraper, target, stats, options.probe ?? false);
        // One page per event per site per night, spaced out. Being a light
        // visitor is both the polite choice and the one least likely to be
        // blocked.
        if (!options.probe) await politeDelay();
      }
    }
  } finally {
    await browser.close();
  }

  finishRun(stats);
  return stats;
}

// Only parse argv when run directly, so importing this from the cron job does
// not accidentally read the server's command line.
if (process.argv[1]?.includes("bot")) {
  const args = process.argv.slice(2);
  const valueAfter = (flag: string): string | undefined => {
    const index = args.indexOf(flag);
    return index >= 0 ? args[index + 1] : undefined;
  };

  await runBot({
    probe: args.includes("--probe"),
    site: valueAfter("--site"),
    eventId: valueAfter("--event"),
  });

  await prisma.$disconnect();
}
