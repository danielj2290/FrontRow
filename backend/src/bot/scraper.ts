// ======================
// Shared Puppeteer setup
// ======================
// One browser for the whole run, one page per scrape. Launching a browser costs
// a second or two and a few hundred MB, so doing it per event would be slow and
// would risk the OOM killer on a t2.micro.

import puppeteer, { type Browser, type Page } from "puppeteer";
import { log } from "./logger.js";

// Rotated per page. Not a disguise — a real Chrome on Linux announces itself
// honestly — but a fleet of requests with an identical UA is a pattern, and
// varying it costs nothing.
const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
];

export async function launchBrowser(): Promise<Browser> {
  return puppeteer.launch({
    headless: true,
    args: [
      // EC2 runs this without a user namespace sandbox available; without this
      // flag Chromium refuses to start on most server images.
      "--no-sandbox",
      "--disable-setuid-sandbox",
      // Chromium's default /dev/shm is small on servers and it will crash
      // mid-render when it fills. Using regular memory avoids that.
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
  });
}

export async function openPage(browser: Browser): Promise<Page> {
  const page = await browser.newPage();

  await page.setUserAgent(USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]);
  await page.setViewport({ width: 1366, height: 900 });

  // Images and fonts are a large share of page weight and we never look at
  // them — we read text out of the DOM. Blocking them makes each scrape
  // noticeably faster and lighter on memory.
  await page.setRequestInterception(true);
  page.on("request", (request) => {
    const type = request.resourceType();
    if (type === "image" || type === "font" || type === "media") request.abort();
    else request.continue();
  });

  return page;
}

/**
 * Random pause between requests. Fixed intervals are themselves a signature,
 * and the point is to be a light, unremarkable visitor — we ask each site for
 * one page per event per night.
 */
export async function politeDelay(minMs = 2000, maxMs = 5000): Promise<void> {
  const ms = minMs + Math.random() * (maxMs - minMs);
  await new Promise((resolve) => setTimeout(resolve, ms));
}

/** Parse "From $86 each" / "$1,204.50" into a number. */
export function parsePrice(text: string | null | undefined): number | null {
  if (!text) return null;
  const match = text.replace(/,/g, "").match(/\d+(\.\d{1,2})?/);
  if (!match) return null;

  const value = Number(match[0]);
  // A get-in price of 0 means we matched something that was not a price.
  return Number.isFinite(value) && value > 0 ? value : null;
}

/**
 * Try each selector in order and return the first that yields text.
 *
 * Selectors are arrays, not single strings, ON PURPOSE: these sites ship new
 * markup constantly, and a list lets an old selector keep working while a new
 * one is added, instead of the bot breaking the day a class name changes.
 */
export async function textFromFirstMatch(
  page: Page,
  selectors: string[]
): Promise<string | null> {
  for (const selector of selectors) {
    try {
      const element = await page.$(selector);
      if (!element) continue;
      const text = await element.evaluate((node) => node.textContent);
      if (text && text.trim()) return text.trim();
    } catch {
      // A malformed or unsupported selector should not end the run.
      continue;
    }
  }
  return null;
}

/** Save a screenshot and the raw HTML — the first move when a selector breaks. */
export async function saveDebugArtifacts(page: Page, label: string): Promise<void> {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const base = `debug-${label}-${stamp}`;

  await page.screenshot({ path: `${base}.png`, fullPage: false });

  const html = await page.content();
  const { writeFile } = await import("node:fs/promises");
  await writeFile(`${base}.html`, html, "utf8");

  log(`  saved ${base}.png and ${base}.html`);
}
