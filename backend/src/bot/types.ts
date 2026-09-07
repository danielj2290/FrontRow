import type { Page } from "puppeteer";

// What one scrape of one marketplace produced. All fields nullable because a
// partial read is still worth storing — a get-in price with no listing count is
// useful; nothing at all is not.
export interface ScrapeResult {
  getInPrice: number | null;
  listingCount: number | null;
  isAllInPrice: boolean;
}

// The event as the bot sees it — enough to find the right page on a
// marketplace that has never heard of our database ids.
export interface ScrapeTarget {
  id: string;
  title: string;
  artistName: string;
  venueName: string;
  city: string;
  eventDate: Date;
  seatgeekId: string | null;
  ticketmasterId: string | null;
}

// Each marketplace implements this. Adding a site later means adding one file,
// not touching the runner.
export interface SiteScraper {
  /** Short id used in logs, filenames and the snapshot's source column. */
  name: string;
  /** Human name stored in PriceSnapshot.marketplace. */
  marketplace: string;
  /** Value stored in PriceSnapshot.source, e.g. "bot_stubhub". */
  source: string;
  /** Where to look for this event, or null if this site cannot locate it. */
  buildUrl(target: ScrapeTarget): Promise<string | null>;
  /** Read prices off a loaded page. */
  extract(page: Page): Promise<ScrapeResult>;
}
