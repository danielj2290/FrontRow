// ======================
// StubHub scraper
// ======================
// Harder than SeatGeek for two reasons.
//
// 1. We have no StubHub event id, so the bot has to search by artist and city
//    and land on a page — inherently less certain than a direct URL.
// 2. StubHub sits behind commercial bot detection. A headless visit may get a
//    challenge page instead of prices. Whether it does is an open question, and
//    the probe answers it:
//      npm run bot -- --probe --site stubhub --event <db-event-id>
//
// If StubHub proves hostile, this file is the only thing that changes:
// SeatGeek becomes the primary source and the Chrome extension covers the rest.
// That is why sources are interchangeable by construction.

import type { Page } from "puppeteer";
import { parsePrice, textFromFirstMatch } from "./scraper.js";
import type { ScrapeResult, ScrapeTarget, SiteScraper } from "./types.js";

const PRICE_SELECTORS = [
  '[data-testid="get-in-price"]',
  '[data-testid="listing-price"]',
  '[class*="GetInPrice"]',
  '[class*="price"]',
];

export const stubhubScraper: SiteScraper = {
  name: "stubhub",
  marketplace: "StubHub",
  source: "bot_stubhub",

  async buildUrl(target: ScrapeTarget): Promise<string | null> {
    // Artist plus city narrows to the right tour stop; the date is included so
    // a residency or a two-night stand does not silently match the wrong show.
    const date = target.eventDate.toISOString().split("T")[0];
    const query = `${target.artistName} ${target.city} ${date}`;
    return `https://www.stubhub.com/find/s/?q=${encodeURIComponent(query)}`;
  },

  async extract(page: Page): Promise<ScrapeResult> {
    const priceText = await textFromFirstMatch(page, PRICE_SELECTORS);

    return {
      getInPrice: parsePrice(priceText),
      listingCount: null,
      // StubHub shows pre-fee prices by default in the US. Recorded honestly so
      // the model never compares an all-in price against a pre-fee one.
      isAllInPrice: false,
    };
  },
};
