// ======================
// Music headlines via RSS
// ======================
// RSS, not scraping. These publications hand out a machine-readable feed on
// purpose, so there is nothing to defeat, nothing to break when a layout
// changes, and no bot detection to trip. After the DataDome experience that
// distinction matters: a feed designed to be consumed will still work next
// month.
//
// Parsed by hand rather than with a library. RSS 2.0 and Atom are both small,
// well-defined formats, and four known feeds is not enough surface area to
// justify another dependency.

const FEEDS = [
  { source: "Pitchfork", url: "https://pitchfork.com/rss/news/" },
  { source: "Stereogum", url: "https://www.stereogum.com/feed/" },
  { source: "Consequence", url: "https://consequence.net/feed/" },
  { source: "Billboard", url: "https://www.billboard.com/feed/" },
];

export interface Headline {
  title: string;
  link: string;
  source: string;
  publishedAt: string | null;
}

// Headlines change on the order of hours, and four upstream fetches per
// visitor would be both slow and rude.
const CACHE_TTL_MS = 30 * 60 * 1000;
let cache: { value: Headline[]; expiresAt: number } | null = null;

/** Pull the text out of the first <tag>...</tag>, handling CDATA. */
function tagText(block: string, tag: string): string | null {
  const match = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i").exec(block);
  if (!match) return null;

  return decodeEntities(
    match[1]
      .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
      .replace(/<[^>]+>/g, "") // strip any markup inside the title
      .trim()
  );
}

/** Atom puts the url in an attribute rather than the element body. */
function atomLink(block: string): string | null {
  const match = /<link[^>]*href=["']([^"']+)["'][^>]*>/i.exec(block);
  return match ? match[1] : null;
}

// Feeds routinely contain &amp; &#8217; and friends. Only the handful that
// actually show up in headlines are worth handling.
function decodeEntities(value: string): string {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;|&#8217;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#821[12];/g, '"')
    .replace(/&#8230;/g, "...")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&"); // last: decoding it earlier would corrupt the rest
}

function parseFeed(xml: string, source: string): Headline[] {
  // RSS uses <item>, Atom uses <entry>. Both appear across these four.
  const blocks = xml.match(/<(item|entry)[\s\S]*?<\/\1>/gi) ?? [];

  return blocks
    .map((block) => {
      const title = tagText(block, "title");
      const link = tagText(block, "link") ?? atomLink(block);
      const published =
        tagText(block, "pubDate") ?? tagText(block, "published") ?? tagText(block, "updated");

      if (!title || !link) return null;

      const parsed = published ? new Date(published) : null;

      return {
        title,
        link,
        source,
        publishedAt:
          parsed && !Number.isNaN(parsed.getTime()) ? parsed.toISOString() : null,
      } satisfies Headline;
    })
    .filter((item): item is Headline => item !== null);
}

/**
 * Newest headlines across every feed, interleaved by publication time.
 *
 * One slow or dead publication must not take the section down, so feeds are
 * fetched in parallel and failures are dropped silently — three sources is
 * still a news feed.
 */
export async function getHeadlines(limit = 12): Promise<Headline[]> {
  if (cache && cache.expiresAt > Date.now()) return cache.value.slice(0, limit);

  const results = await Promise.allSettled(
    FEEDS.map(async (feed) => {
      // A hung feed would otherwise hold the whole request open.
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);

      try {
        const response = await fetch(feed.url, {
          signal: controller.signal,
          // Some publishers reject requests with no user agent outright.
          headers: { "User-Agent": "FrontRow/1.0 (+https://frontrow-tickets.vercel.app)" },
        });
        if (!response.ok) throw new Error(`${feed.source}: ${response.status}`);
        return parseFeed(await response.text(), feed.source);
      } finally {
        clearTimeout(timer);
      }
    })
  );

  const headlines = results
    .flatMap((result) => (result.status === "fulfilled" ? result.value : []))
    .sort((a, b) => {
      // Undated items sink rather than jumping to the top on a null compare.
      const left = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const right = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return right - left;
    });

  cache = { value: headlines, expiresAt: Date.now() + CACHE_TTL_MS };
  return headlines.slice(0, limit);
}
