// ======================
// Event search — combines our two discovery sources into one list
// ======================
// SeatGeek is the CANONICAL list: best concert coverage, and it gives us
// performer images, which the search result cards need.
//
// Ticketmaster is used only to ENRICH those results with on-sale and presale
// dates, which SeatGeek does not expose.
//
// WHY enrich instead of merging two lists: the same concert appears in both
// providers with differently formatted titles, so a merge would render
// duplicate cards and de-duplicating across providers reliably is guesswork.
// One canonical list with extra fields attached always renders correctly.
//
// NOTE on getInPrice: it is always null today. SeatGeek gates pricing behind
// partner access (see the warning at the top of seatgeek.ts). Week 3's bot
// fills this in from the price_snapshots table instead. The field exists now
// so the frontend card can be built against its final shape.

import {
  searchEvents,
  getEventById,
  searchPerformer,
  type SeatGeekEvent,
} from "./seatgeek.js";
import { searchArtist } from "./spotify.js";
import { findBrowseGenre, UnknownGenreError } from "./genres.js";
import {
  discoverEvents,
  getTicketmasterEventById,
  pickImage,
  toTicketmasterDate,
  extractGenres as extractTicketmasterGenres,
  type TicketmasterEvent,
} from "./ticketmaster.js";

// The single shape every event-related page consumes. Kept deliberately flat —
// the frontend should never have to know which provider a field came from.
export interface EventSummary {
  id: string;
  title: string;
  artist: string | null;
  imageUrl: string | null;
  eventDate: string; // ISO-ish local datetime from SeatGeek
  venue: { name: string; city: string; state: string | null };
  getInPrice: number | null; // always null until Week 3 — see note above
  // Taxonomy names from SeatGeek minus the generic "concert" — this is the only
  // genre signal either provider gives us.
  genres: string[];
  onSaleDate: string | null;
  presaleDate: string | null;
}

// Lowercase and strip anything that isn't a letter or digit, so "Zach Bryan -
// With Heaven On Tour" and "Zach Bryan" can be compared without punctuation
// and casing differences getting in the way.
function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

// Ticketmaster events are indexed by "date + city" because that is the only
// pair both providers report identically. Titles differ too much to key on.
function indexTicketmasterByDateAndCity(
  events: TicketmasterEvent[]
): Map<string, TicketmasterEvent[]> {
  const index = new Map<string, TicketmasterEvent[]>();

  for (const event of events) {
    const city = event._embedded?.venues?.[0]?.city?.name;
    if (!city) continue;

    const key = `${event.dates.start.localDate}|${normalize(city)}`;
    const existing = index.get(key);
    if (existing) existing.push(event);
    else index.set(key, [event]);
  }

  return index;
}

// Two shows can share a date and city, so among the candidates prefer one whose
// name shares a word with the SeatGeek title. Falls back to the first candidate
// rather than giving up — a slightly wrong on-sale date is better than none,
// and these fields are supplementary, not the reason someone visits the page.
function matchTicketmasterEvent(
  candidates: TicketmasterEvent[],
  seatGeekTitle: string
): TicketmasterEvent | undefined {
  if (candidates.length === 1) return candidates[0];

  const titleWords = new Set(
    seatGeekTitle.split(/\s+/).map(normalize).filter((word) => word.length > 3)
  );

  return (
    candidates.find((candidate) =>
      candidate.name.split(/\s+/).some((word) => titleWords.has(normalize(word)))
    ) ?? candidates[0]
  );
}

// Presales come back unordered; the useful one to show a user is the earliest.
function earliestPresaleDate(event: TicketmasterEvent): string | null {
  const presales = event.sales?.presales;
  if (!presales?.length) return null;

  return presales
    .map((presale) => presale.startDateTime)
    .filter(Boolean)
    .sort()[0] ?? null;
}

/**
 * Search concerts by artist name and/or city.
 *
 * Both providers are queried in parallel. If Ticketmaster fails we still return
 * the SeatGeek results without on-sale dates — a partial page beats an error
 * page, and Ticketmaster is only ever supplementary here.
 */
export async function searchConcerts(options: {
  artist?: string;
  city?: string;
  genre?: string;
  limit?: number;
}): Promise<EventSummary[]> {
  const limit = options.limit ?? 20;

  // Genre browse cannot use SeatGeek at all: its taxonomy tree has no music
  // genres (verified by dumping /taxonomies — the Concerts branch is only
  // "Concert" and "Music Festivals"). Ticketmaster classifies music properly,
  // so genre requests are served entirely from there.
  if (options.genre) {
    return searchByGenre(options.genre, options.city, limit);
  }

  const [seatGeekResult, ticketmasterResult] = await Promise.allSettled([
    searchEvents({
      artist: options.artist,
      city: options.city,
      perPage: limit,
    }),
    discoverEvents({ keyword: options.artist, city: options.city, size: limit }),
  ]);

  // SeatGeek is the canonical list — if it fails, there is nothing to return.
  if (seatGeekResult.status === "rejected") {
    throw seatGeekResult.reason;
  }

  if (ticketmasterResult.status === "rejected") {
    console.warn(
      "Ticketmaster enrichment failed, returning SeatGeek results only:",
      ticketmasterResult.reason
    );
  }

  const ticketmasterIndex =
    ticketmasterResult.status === "fulfilled"
      ? indexTicketmasterByDateAndCity(ticketmasterResult.value._embedded?.events ?? [])
      : new Map<string, TicketmasterEvent[]>();

  return seatGeekResult.value.events.map((event) => {
    // SeatGeek's datetime_local is "2026-08-13T19:00:00" — the date half is
    // what Ticketmaster reports as localDate.
    const datePart = event.datetime_local.split("T")[0];
    const candidates = ticketmasterIndex.get(`${datePart}|${normalize(event.venue.city)}`);
    const matched = candidates ? matchTicketmasterEvent(candidates, event.title) : undefined;

    return toEventSummary(event, matched);
  });
}

// Shared normaliser. Search results and the single-event endpoint both go
// through it so the frontend only ever renders one shape.
export function toEventSummary(event: SeatGeekEvent, matched?: TicketmasterEvent): EventSummary {
  // The first performer is the headliner on every SeatGeek concert response.
  const headliner = event.performers?.[0];

  return {
    id: `sg-${event.id}`,
    title: event.title,
    artist: headliner?.name ?? null,
    imageUrl: headliner?.image ?? null,
    eventDate: event.datetime_local,
    venue: {
      name: event.venue.name,
      city: event.venue.city,
      state: event.venue.state ?? null,
    },
    genres: matched ? extractTicketmasterGenres(matched) : [],
    getInPrice: event.stats?.lowest_price ?? null,
    onSaleDate: matched?.sales?.public?.startDateTime ?? null,
    presaleDate: matched ? earliestPresaleDate(matched) : null,
  };
}

/**
 * One event by its prefixed id — "sg-17871645" or "tm-G5vYZ4Aa9k".
 *
 * Two providers, two id spaces. The prefix is what lets the frontend treat an
 * event as one thing regardless of where it came from, and it is why genre
 * results (Ticketmaster) can sit in the same grid as search results (SeatGeek)
 * and still open a working detail page.
 */
export async function getEventDetail(prefixedId: string): Promise<EventSummary | null> {
  const seatGeekMatch = /^sg-(\d+)$/.exec(prefixedId);
  if (seatGeekMatch) return getSeatGeekEventDetail(Number(seatGeekMatch[1]));

  const ticketmasterMatch = /^tm-(.+)$/.exec(prefixedId);
  if (ticketmasterMatch) {
    const event = await getTicketmasterEventById(ticketmasterMatch[1]);
    return event ? toEventSummaryFromTicketmaster(event) : null;
  }

  return null;
}

/**
 * A SeatGeek event, enriched with Ticketmaster's on-sale dates and genres.
 *
 * Matching is MORE reliable here than in search, not less: we know the exact
 * headliner, date and city, so the shared date+city index usually has a single
 * obvious candidate.
 */
async function getSeatGeekEventDetail(id: number): Promise<EventSummary | null> {
  const event = await getEventById(id);
  if (!event) return null;

  const headliner = event.performers?.[0]?.name;

  // Best-effort: a Ticketmaster failure costs two dates and the genre chips,
  // not the page.
  const [ticketmasterResult] = await Promise.allSettled([
    discoverEvents({ keyword: headliner ?? event.title, city: event.venue.city, size: 20 }),
  ]);

  if (ticketmasterResult.status === "rejected") {
    console.warn("Ticketmaster enrichment failed for event", id, ticketmasterResult.reason);
    return toEventSummary(event);
  }

  const index = indexTicketmasterByDateAndCity(ticketmasterResult.value._embedded?.events ?? []);
  const datePart = event.datetime_local.split("T")[0];
  const candidates = index.get(`${datePart}|${normalize(event.venue.city)}`);
  const matched = candidates ? matchTicketmasterEvent(candidates, event.title) : undefined;

  return toEventSummary(event, matched);
}

/**
 * Normalise a Ticketmaster event into the same shape SeatGeek events produce,
 * so genre browse results render through the identical card component.
 */
export function toEventSummaryFromTicketmaster(event: TicketmasterEvent): EventSummary {
  const venue = event._embedded?.venues?.[0];

  // Ticketmaster splits date and time; SeatGeek returns them joined, and the
  // frontend formatter expects the joined form.
  const localTime = event.dates.start.localTime ?? "00:00:00";

  return {
    id: `tm-${event.id}`,
    title: event.name,
    artist: event._embedded?.attractions?.[0]?.name ?? null,
    imageUrl: pickImage(event),
    eventDate: `${event.dates.start.localDate}T${localTime}`,
    venue: {
      name: venue?.name ?? "Venue TBA",
      city: venue?.city?.name ?? "",
      state: venue?.state?.stateCode ?? null,
    },
    genres: extractTicketmasterGenres(event),
    // priceRanges is usually absent on resale-heavy events, but when it IS
    // present this is a real face-value number rather than a null placeholder.
    getInPrice: event.priceRanges?.[0]?.min ?? null,
    onSaleDate: event.sales?.public?.startDateTime ?? null,
    presaleDate: earliestPresaleDate(event),
  };
}

/**
 * Genre browse, served entirely from Ticketmaster.
 *
 * Events without a venue are dropped: a card with no city reads as broken, and
 * Ticketmaster occasionally returns records whose venue is not yet announced.
 */
async function searchByGenre(
  genre: string,
  city: string | undefined,
  limit: number
): Promise<EventSummary[]> {
  // An unknown slug means a bad url, not an empty genre — say so loudly rather
  // than firing a request that would return nothing and look like no results.
  const browseGenre = findBrowseGenre(genre);
  if (!browseGenre) throw new UnknownGenreError(genre);

  // Browsing a genre means "show me what is worth going to", not "show me the
  // chronologically next thing". Sorted by date the list fills with tiny local
  // shows happening this week; relevance is Ticketmaster's own prominence
  // ranking, which surfaces the acts people actually search a genre to find.
  const now = new Date();
  const threeMonthsOut = new Date(now);
  threeMonthsOut.setMonth(threeMonthsOut.getMonth() + 3);

  const response = await discoverEvents({
    genreId: browseGenre.ticketmasterGenreId,
    city,
    size: limit,
    sort: "relevance,desc",
    // Without an explicit window Ticketmaster happily returns dates years out,
    // which is not a browsing horizon anyone thinks in.
    startDateTime: toTicketmasterDate(now),
    endDateTime: toTicketmasterDate(threeMonthsOut),
    // SeatGeek is US-only, so a UK club night in these results is noise the
    // rest of the app cannot even price.
    countryCode: "US",
  });
  const events = response._embedded?.events ?? [];

  return events
    .filter((event) => Boolean(event._embedded?.venues?.[0]))
    .map(toEventSummaryFromTicketmaster);
}

export interface ArtistProfile {
  name: string;
  imageUrl: string | null;
  genres: string[];
  popularity: number | null;
  setlistFmUrl: string;
  events: EventSummary[];
}

/**
 * Everything the artist page needs, from three sources at once.
 *
 * Spotify supplies the photo (its images are much higher resolution than
 * SeatGeek's), SeatGeek supplies the genres — Spotify stopped returning them
 * for apps created after Nov 2024, see the note in spotify.ts — and the event
 * search supplies upcoming shows.
 *
 * Any of the three can fail without taking down the page: a missing photo or
 * genre list is a cosmetic gap, not an error worth showing the user.
 */
export async function getArtistProfile(name: string): Promise<ArtistProfile> {
  const [performerResult, spotifyResult, eventsResult] = await Promise.allSettled([
    searchPerformer(name),
    searchArtist(name),
    searchConcerts({ artist: name, limit: 24 }),
  ]);

  const performer = performerResult.status === "fulfilled" ? performerResult.value : null;
  const spotify = spotifyResult.status === "fulfilled" ? spotifyResult.value : null;
  const events = eventsResult.status === "fulfilled" ? eventsResult.value : [];

  // Prefer whichever source actually knows the artist's proper casing.
  const resolvedName = spotify?.name ?? performer?.name ?? name;

  return {
    name: resolvedName,
    imageUrl: spotify?.images?.[0]?.url ?? performer?.image ?? null,
    // SeatGeek performers do not expose genres and Spotify stopped returning
    // them for new apps, so the only genre signal left is the taxonomies on
    // this artist's own events.
    genres: [...new Set(events.flatMap((event) => event.genres))].slice(0, 5),
    popularity: spotify?.popularity ?? null,
    setlistFmUrl: `https://www.setlist.fm/search?query=${encodeURIComponent(resolvedName)}`,
    events,
  };
}
