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
import { discoverEvents, type TicketmasterEvent } from "./ticketmaster.js";

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

  const [seatGeekResult, ticketmasterResult] = await Promise.allSettled([
    searchEvents({
      artist: options.artist,
      city: options.city,
      genre: options.genre,
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
    getInPrice: event.stats?.lowest_price ?? null,
    onSaleDate: matched?.sales?.public?.startDateTime ?? null,
    presaleDate: matched ? earliestPresaleDate(matched) : null,
  };
}

/**
 * One event by id. Returns null when SeatGeek has no such event so the route
 * can answer 404 rather than 500.
 *
 * No Ticketmaster enrichment here: matching a SINGLE event against a keyword
 * search would be a coin flip, and a wrong on-sale date is worse than none.
 */
export async function getEventDetail(id: number): Promise<EventSummary | null> {
  const event = await getEventById(id);
  return event ? toEventSummary(event) : null;
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
    genres: performer?.genres?.map((genre) => genre.name) ?? [],
    popularity: spotify?.popularity ?? null,
    setlistFmUrl: `https://www.setlist.fm/search?query=${encodeURIComponent(resolvedName)}`,
    events,
  };
}
