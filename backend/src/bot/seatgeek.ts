// ======================
// SeatGeek scraper
// ======================
// SeatGeek is the easier of the two targets for one reason: their API hands us
// the canonical event URL, so the bot navigates straight to the right page.
// No search, no guessing which result is the right show — the single most
// fragile step in scraping is removed entirely.
//
// SELECTORS ARE UNVERIFIED. They are ordered guesses at SeatGeek's markup, and
// the first run should be a probe:
//   npm run bot -- --probe --site seatgeek --event <db-event-id>
// which saves a screenshot and the page HTML so the real selector can be read
// off the page rather than guessed at.

import type { Page } from "puppeteer";
import { getEventById } from "../services/seatgeek.js";
import { parsePrice, textFromFirstMatch } from "./scraper.js";
import type { ScrapeResult, ScrapeTarget, SiteScraper } from "./types.js";

const PRICE_SELECTORS = [
  '[data-testid="listing-price"]',
  '[data-testid="get-in-price"]',
  '[class*="GetInPrice"]',
  '[class*="get-in-price"]',
];

const LISTING_COUNT_SELECTORS = ['[data-testid="listing-count"]', '[class*="listing-count"]'];

export const seatgeekScraper: SiteScraper = {
  name: "seatgeek",
  marketplace: "SeatGeek",
  source: "bot_seatgeek",

  async buildUrl(target: ScrapeTarget): Promise<string | null> {
    // Only events we ingested FROM SeatGeek have a SeatGeek id. A Ticketmaster
    // event would need a search, which is exactly the fragility we are avoiding
    // here, so we skip it instead.
    if (!target.seatgeekId) return null;

    const event = await getEventById(Number(target.seatgeekId));
    return event?.url ?? null;
  },

  async extract(page: Page): Promise<ScrapeResult> {
    const priceText = await textFromFirstMatch(page, PRICE_SELECTORS);
    const countText = await textFromFirstMatch(page, LISTING_COUNT_SELECTORS);

    const count = countText ? Number(countText.replace(/[^\d]/g, "")) : null;

    return {
      getInPrice: parsePrice(priceText),
      listingCount: Number.isFinite(count) && count !== null ? count : null,
      // SeatGeek defaults to all-in pricing (fees included) in the US.
      isAllInPrice: true,
    };
  },
};
