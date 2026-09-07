// ======================
// SeatGeek API client
// ======================
// SeatGeek is our PRIMARY data source for event discovery.
//
// ⚠️ IMPORTANT (verified 2026-07-23): the `stats` object (lowest_price /
// average_price / etc.) comes back EMPTY ({}) for our API keys — even for
// stadium shows happening this week, and on the single-event endpoint too.
// SeatGeek now gates pricing data behind partner-level API access.
// Ticketmaster's priceRanges field was also null in testing.
// → Price data sourcing is an OPEN PROBLEM for the Week 3 tracking engine.
//   Options: request expanded SeatGeek access, or find another source.
//
// Auth model: simplest of the three — client_id + secret go directly in the
// query string. No token exchange step.
// Docs: https://platform.seatgeek.com/

import { requireEnv } from "../config/env.js";

const BASE_URL = "https://api.seatgeek.com/2";

// A trimmed-down shape of what SeatGeek returns for an event.
// (The real response has ~50 fields; we only type what we use.)
export interface SeatGeekEvent {
  id: number;
  title: string;
  datetime_local: string;
  // The public event page. The bot navigates straight here instead of
  // searching, which removes the most fragile step in scraping SeatGeek.
  url: string;
  venue: { name: string; city: string; state: string };
  performers: { name: string; image: string | null }[];
  // Genre lives here. Concert events carry the generic "concert" taxonomy plus
  // narrower ones; parent_id links a child taxonomy to its parent.
  taxonomies?: { id: number; name: string; parent_id?: number | string | null }[];
  // All optional because our keys currently receive an EMPTY stats object —
  // see the warning at the top of this file.
  stats: {
    lowest_price?: number | null; // ← the "get-in" price we want to track
    average_price?: number | null;
    highest_price?: number | null;
    listing_count?: number | null;
  };
}

interface SeatGeekResponse {
  events: SeatGeekEvent[];
  meta: { total: number };
}

/**
 * Search concert events by artist name and/or city. NOT by genre — SeatGeek
 * has no music genres; see the note in ticketmaster.ts.
 * Maps to the Week 1 checklist item: "search events by artist/city".
 */
export async function searchEvents(options: {
  artist?: string;
  city?: string;
  perPage?: number;
}): Promise<SeatGeekResponse> {
  const params = new URLSearchParams({
    client_id: requireEnv("SEATGEEK_CLIENT_ID"),
    client_secret: requireEnv("SEATGEEK_CLIENT_SECRET"),
    "taxonomies.name": "concert", // concerts only — we're not TicketData
    per_page: String(options.perPage ?? 5),
  });

  // "q" does fuzzy text search across performer names
  if (options.artist) params.set("q", options.artist);
  if (options.city) params.set("venue.city", options.city);
const res = await fetch(`${BASE_URL}/events?${params}`);
  if (!res.ok) {
    throw new Error(`SeatGeek API error: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as SeatGeekResponse;
}

/**
 * Fetch one event by its SeatGeek numeric id.
 * Returns null on 404 so callers can send a clean 404 instead of a 500.
 */
export async function getEventById(id: number): Promise<SeatGeekEvent | null> {
  const params = new URLSearchParams({
    client_id: requireEnv("SEATGEEK_CLIENT_ID"),
    client_secret: requireEnv("SEATGEEK_CLIENT_SECRET"),
  });

  const res = await fetch(`${BASE_URL}/events/${id}?${params}`);
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`SeatGeek API error: ${res.status} ${res.statusText}`);
  }

  // The single-event endpoint returns the event object directly, not wrapped
  // in an { events: [...] } envelope like the search endpoint does.
  return (await res.json()) as SeatGeekEvent;
}

export interface SeatGeekPerformer {
  id: number;
  name: string;
  image: string | null;
  // NOTE: SeatGeek performers do NOT expose genres — the documented Performer
  // schema is id/image/images/name/primary/score/short_name/slug/type/url only.
  // Artist genres are derived from their EVENTS taxonomies instead.
}

/**
 * Look up a performer by name. This is where artist GENRES come from —
 * Spotify no longer returns them for apps created after Nov 2024.
 */
export async function searchPerformer(name: string): Promise<SeatGeekPerformer | null> {
  const params = new URLSearchParams({
    client_id: requireEnv("SEATGEEK_CLIENT_ID"),
    client_secret: requireEnv("SEATGEEK_CLIENT_SECRET"),
    q: name,
    "taxonomies.name": "concert",
    per_page: "1",
  });

  const res = await fetch(`${BASE_URL}/performers?${params}`);
  if (!res.ok) {
    throw new Error(`SeatGeek API error: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as { performers: SeatGeekPerformer[] };
  return data.performers[0] ?? null;
}
