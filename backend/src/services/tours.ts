// ======================
// Hyped tours and presales
// ======================
// Builds the three feeds the site now leads with:
//   - Most hyped tours coming up
//   - Hyped artist presales happening now
//   - All hyped tours, split by venue size
//
// None of this needs a price. That is the point of the pivot: popularity,
// announcement dates and presale windows all come back from APIs we are
// allowed to call, while resale prices do not.

import { searchEvents, type SeatGeekEvent } from "./seatgeek.js";
import { discoverEvents, pickImage, type TicketmasterEvent } from "./ticketmaster.js";
import { groupIntoTours, scoreHype, venueSize, type Tour, type VenueSize } from "./hype.js";
import { searchArtist } from "./spotify.js";

// ----------------------------------------------------------------------------
// Cache
// ----------------------------------------------------------------------------
// Building a national ranking costs several upstream requests. Without a cache
// every homepage visit would repeat them — slow for the visitor and a fast way
// to burn an API quota. Fifteen minutes is far fresher than the data itself,
// which changes on the order of days.

const CACHE_TTL_MS = 15 * 60 * 1000;

const cache = new Map<string, { value: unknown; expiresAt: number }>();

async function cached<T>(key: string, build: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && hit.expiresAt > Date.now()) return hit.value as T;

  const value = await build();
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
  return value;
}

// ----------------------------------------------------------------------------
// The national pool
// ----------------------------------------------------------------------------

// SeatGeek caps per_page at 100. Three pages is a wide enough pool to rank
// nationally without making the first uncached request feel broken.
const PAGE_SIZE = 100;
const PAGES = 3;

/**
 * Fetch a pool of upcoming US concerts to rank.
 *
 * `sort=score.desc` is not something SeatGeek documents explicitly, so a
 * failure is treated as "this parameter is unsupported" and the request is
 * retried without it. Sorted or not we re-rank locally anyway — sorting server
 * side only decides whether the pool contains the RIGHT hundred events.
 */
async function fetchNationalPool(): Promise<SeatGeekEvent[]> {
  const afterUtc = new Date().toISOString().split(".")[0] + "Z";
  const collected: SeatGeekEvent[] = [];

  for (let page = 1; page <= PAGES; page += 1) {
    try {
      const response = await searchEvents({
        perPage: PAGE_SIZE,
        page,
        sort: "score.desc",
        afterUtc,
      });
      collected.push(...response.events);
      if (response.events.length < PAGE_SIZE) break;
    } catch {
      // Retry this page unsorted before giving up — see the note above.
      try {
        const response = await searchEvents({ perPage: PAGE_SIZE, page, afterUtc });
        collected.push(...response.events);
        if (response.events.length < PAGE_SIZE) break;
      } catch (error) {
        console.warn(`SeatGeek pool page ${page} failed:`, error);
        break;
      }
    }
  }

  return collected;
}

// ----------------------------------------------------------------------------
// Feeds
// ----------------------------------------------------------------------------

/**
 * Tours announced recently — the "just announced" feed.
 *
 * announce_date is the signal nothing else in the app uses, and it is what
 * makes a news section possible without scraping anybody: SeatGeek tells us
 * when a run went public.
 *
 * Sorted by announcement, not by hype. This section answers "what is new",
 * and a three week old stadium tour outranking today's news would defeat it.
 */
export async function getJustAnnounced(limit = 12, withinDays = 30, city?: string): Promise<Tour[]> {
  const tours = await getAllTours();
  const cutoff = Date.now() - withinDays * 86_400_000;

  const recent = tours.filter((tour) => {
    if (!tour.announceDate) return false;
    const announced = new Date(tour.announceDate).getTime();
    if (Number.isNaN(announced) || announced < cutoff) return false;
    return !city || visitsCity(tour, city);
  });

  recent.sort(
    (a, b) =>
      new Date(b.announceDate as string).getTime() -
      new Date(a.announceDate as string).getTime()
  );

  return withArtistImages(recent.slice(0, limit));
}

/**
 * Does this tour play the given city?
 *
 * Matches on ANY date, not the first: a national tour is relevant to Denver
 * if it stops in Denver, regardless of where it opens.
 */
function visitsCity(tour: Tour, city: string): boolean {
  const target = normaliseCity(city);
  return tour.dates.some((date) => normaliseCity(date.city) === target);
}

/** Every upcoming tour, ranked by hype. Cached because it is the same for everyone. */
export async function getAllTours(): Promise<Tour[]> {
  return cached("tours:all", async () => groupIntoTours(await fetchNationalPool()));
}

/**
 * The homepage headline feed.
 *
 * One-off shows are excluded: a single club date is an event, not a tour, and
 * mixing them in is what made the old homepage read as noise.
 */
export async function getHypedTours(limit = 8, city?: string): Promise<Tour[]> {
  const tours = await getAllTours();

  // Single-date shows are excluded nationally — a one-off club night is an
  // event, not a tour. With a city set that filter is dropped: a one-night
  // stand in YOUR city is exactly what you want to know about.
  const relevant = city
    ? tours.filter((tour) => visitsCity(tour, city))
    : tours.filter((tour) => tour.dateCount > 1);

  return withArtistImages(relevant.slice(0, limit));
}

/**
 * Fill in artist photos from Spotify.
 *
 * SeatGeek returns no performer image on the national pool query, so tours
 * would render as text-only fallbacks. Spotify has a photo for essentially
 * every touring artist, at far higher resolution than SeatGeek carries.
 *
 * Only ever called on the SLICE being returned — one lookup per artist, so
 * enriching the whole national pool would be hundreds of calls for images
 * nobody is going to see. Failures are per-artist and silent: a missing photo
 * falls back to the artist name, which is a cosmetic gap, not an error.
 */
// Artist photos keyed by name, separately from the tour cache and for far
// longer — an artist photo changes on the order of years, while a ranking
// changes daily. Without this, every homepage visit would fire a Spotify
// lookup per card even though the tours themselves came from cache.
const ARTIST_IMAGE_TTL_MS = 24 * 60 * 60 * 1000;
const artistImages = new Map<string, { url: string | null; expiresAt: number }>();

async function artistImage(name: string): Promise<string | null> {
  const hit = artistImages.get(name);
  if (hit && hit.expiresAt > Date.now()) return hit.url;

  const artist = await searchArtist(name);
  const url = artist?.images?.[0]?.url ?? null;

  // A miss is cached too. An artist Spotify cannot find will not be findable
  // on the next request either, and retrying every time is the expensive case.
  artistImages.set(name, { url, expiresAt: Date.now() + ARTIST_IMAGE_TTL_MS });
  return url;
}

async function withArtistImages(tours: Tour[]): Promise<Tour[]> {
  const results = await Promise.allSettled(
    tours.map(async (tour) => {
      if (tour.imageUrl) return tour.imageUrl;
      return artistImage(tour.artist);
    })
  );

  return tours.map((tour, index) => {
    const result = results[index];
    return {
      ...tour,
      imageUrl: result.status === "fulfilled" ? result.value : tour.imageUrl,
    };
  });
}

/**
 * Attach Ticketmaster links to a tour's dates.
 *
 * The tour pool is built entirely from SeatGeek, so no date arrives knowing
 * its Ticketmaster counterpart. One keyword search for the artist returns
 * their Ticketmaster dates, and the same date + city key used everywhere else
 * in this codebase resolves which record is which show.
 *
 * Only called on a single tour, never on a list: this costs one upstream
 * request, which is fine when somebody opened a page and wasteful when they
 * merely scrolled past a card.
 *
 * Best effort throughout — an unmatched date keeps its SeatGeek link, which
 * still sells tickets to the right concert.
 */
async function withTicketmasterLinks(tour: Tour): Promise<Tour> {
  let events: TicketmasterEvent[] = [];

  try {
    const response = await discoverEvents({ keyword: tour.artist, size: 50, countryCode: "US" });
    events = response._embedded?.events ?? [];
  } catch (error) {
    console.warn(`Ticketmaster lookup failed for ${tour.artist}:`, error);
    return tour;
  }

  // date + normalised city — the only pair both providers report identically.
  const index = new Map<string, TicketmasterEvent>();
  for (const event of events) {
    const city = event._embedded?.venues?.[0]?.city?.name;
    if (!city || !event.url) continue;
    index.set(`${event.dates.start.localDate}|${normaliseCity(city)}`, event);
  }

  return {
    ...tour,
    dates: tour.dates.map((date) => {
      const key = `${date.date.split("T")[0]}|${normaliseCity(date.city)}`;
      return { ...date, ticketmasterUrl: index.get(key)?.url ?? null };
    }),
  };
}

function normaliseCity(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * One tour by its slug id.
 *
 * Served from the same cached national ranking rather than a fresh query, so
 * opening a tour costs nothing extra and the dates shown are exactly the ones
 * the card was ranked on.
 */
export async function getTourById(id: string): Promise<Tour | null> {
  const tours = await getAllTours();
  const tour = tours.find((item) => item.id === id);
  if (!tour) return null;
  const withImages = (await withArtistImages([tour]))[0];
  return withTicketmasterLinks(withImages);
}

/** Tours filtered to one venue size, for the browse page. */
export async function getToursBySize(
  size: VenueSize,
  limit = 24,
  city?: string
): Promise<Tour[]> {
  const tours = await getAllTours();
  const matching = tours.filter(
    (tour) => tour.size === size && (!city || visitsCity(tour, city))
  );
  return withArtistImages(matching.slice(0, limit));
}

// ----------------------------------------------------------------------------
// Presales
// ----------------------------------------------------------------------------

export interface HypedPresale {
  id: string;
  artist: string;
  title: string;
  imageUrl: string | null;
  venueName: string;
  city: string;
  eventDate: string;
  presaleName: string;
  presaleStart: string;
  presaleEnd: string | null;
  /** True when the window is open right now rather than still upcoming. */
  isLive: boolean;
  hypeScore: number;
}

// How far ahead to look. Beyond a couple of weeks a presale is not something
// anyone can act on yet, and the feed is meant to be actionable.
const PRESALE_WINDOW_DAYS = 14;

/**
 * Presales open now or opening shortly, ranked by hype.
 *
 * Ticketmaster is the only source for this — SeatGeek does not expose presale
 * windows at all. Each event can carry several presales (artist, venue, credit
 * card); we surface the one starting soonest, because that is the deadline
 * that matters to someone deciding whether to act today.
 */
export async function getHypedPresales(limit = 8, city?: string): Promise<HypedPresale[]> {
  // The city is part of the key — without it a Denver visitor would be served
  // whatever the previous visitor cached.
  return cached(`presales:${limit}:${city ?? "all"}`, async () => {
    const now = Date.now();
    const horizon = now + PRESALE_WINDOW_DAYS * 86_400_000;

    const response = await discoverEvents({
      size: 100,
      countryCode: "US",
      sort: "relevance,desc",
      city,
    });
    const events = response._embedded?.events ?? [];

    const presales: HypedPresale[] = [];

    for (const event of events) {
      const soonest = soonestRelevantPresale(event, now, horizon);
      if (!soonest) continue;

      const venue = event._embedded?.venues?.[0];
      const start = new Date(soonest.startDateTime).getTime();

      presales.push({
        id: `tm-${event.id}`,
        artist: event._embedded?.attractions?.[0]?.name ?? event.name,
        title: event.name,
        imageUrl: pickImage(event),
        venueName: venue?.name ?? "Venue TBA",
        city: venue?.city?.name ?? "",
        eventDate: `${event.dates.start.localDate}T${event.dates.start.localTime ?? "00:00:00"}`,
        presaleName: soonest.name,
        presaleStart: soonest.startDateTime,
        presaleEnd: soonest.endDateTime ?? null,
        isLive: start <= now,
        // No SeatGeek score on a Ticketmaster record, so hype here leans on the
        // room and the announcement — honest about what we actually know.
        hypeScore: scoreHype({
          seatGeekScore: null,
          venue: { name: venue?.name ?? "" },
          announceDate: null,
          dateCount: 1,
        }).score,
      });
    }

    // Live windows first, then whichever opens soonest.
    return presales
      .sort((a, b) => {
        if (a.isLive !== b.isLive) return a.isLive ? -1 : 1;
        return new Date(a.presaleStart).getTime() - new Date(b.presaleStart).getTime();
      })
      .slice(0, limit);
  });
}

/** The presale on this event that a user could act on soonest, if any. */
function soonestRelevantPresale(
  event: TicketmasterEvent,
  now: number,
  horizon: number
): { name: string; startDateTime: string; endDateTime: string | null } | null {
  const presales = event.sales?.presales ?? [];

  const relevant = presales
    .filter((presale) => {
      const start = new Date(presale.startDateTime).getTime();
      const end = presale.endDateTime ? new Date(presale.endDateTime).getTime() : null;
      if (Number.isNaN(start)) return false;

      // Either opening within the horizon, or already open and not yet closed.
      const openingSoon = start > now && start <= horizon;
      const liveNow = start <= now && (end === null || end > now);
      return openingSoon || liveNow;
    })
    .sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime());

  const first = relevant[0];
  if (!first) return null;

  return {
    name: first.name,
    startDateTime: first.startDateTime,
    endDateTime: first.endDateTime ?? null,
  };
}

/** Re-exported so routes can validate a size without importing two modules. */
export function isVenueSize(value: string): value is VenueSize {
  return value === "large" || value === "medium" || value === "small";
}

export { venueSize };
