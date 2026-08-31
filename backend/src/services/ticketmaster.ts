// ======================
// Ticketmaster Discovery API client
// ======================
// Ticketmaster started as our SECONDARY source, for official on-sale and
// presale dates. It is now also our ONLY genre source: SeatGeek's taxonomy tree
// has no music genres at all — the whole Concerts branch is just "Concert" and
// "Music Festivals" (verified 2026-08-31 by dumping /taxonomies). Ticketmaster
// classifies music properly as Segment > Genre > Sub-Genre.
//
// It does NOT reliably expose resale prices — priceRanges is usually absent —
// so it is still not a price source. We map it anyway: it costs nothing, and
// on the events that do carry it we get a real number instead of null.
//
// Auth model: API key ("consumer key") in the query string. The consumer
// SECRET is not used for the Discovery API — it exists for OAuth endpoints
// we don't need.
// Docs: https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/

import { requireEnv } from "../config/env.js";

const BASE_URL = "https://app.ticketmaster.com/discovery/v2";

export interface TicketmasterEvent {
  id: string;
  name: string;
  dates: {
    start: { localDate: string; localTime?: string };
  };
  sales?: {
    public?: { startDateTime?: string }; // ← on-sale date
    presales?: { name: string; startDateTime: string; endDateTime: string }[];
  };
  // Multiple crops of the same photo. We pick the widest 16:9 — see pickImage.
  images?: { url: string; ratio?: string; width: number; height: number }[];
  // Segment (Music) > Genre (Rock) > Sub-Genre (Alternative Rock)
  classifications?: {
    segment?: { id: string; name: string };
    genre?: { id: string; name: string };
    subGenre?: { id: string; name: string };
  }[];
  priceRanges?: { min?: number; max?: number; currency?: string }[];
  _embedded?: {
    venues?: { name: string; city?: { name: string }; state?: { stateCode?: string } }[];
    attractions?: { name: string }[];
  };
}

interface TicketmasterResponse {
  _embedded?: { events: TicketmasterEvent[] };
  page: { totalElements: number };
}

/**
 * Discover music events by keyword (artist name), city, and/or genre.
 *
 * `classificationName` matches a segment, genre, sub-genre, type or sub-type by
 * name, so passing "Rock" or "Hip-Hop/Rap" filters to that genre directly.
 */
export async function discoverEvents(options: {
  keyword?: string;
  city?: string;
  genre?: string;
  size?: number;
}): Promise<TicketmasterResponse> {
  const params = new URLSearchParams({
    apikey: requireEnv("TICKETMASTER_CONSUMER_KEY"),
    size: String(options.size ?? 5),
    sort: "date,asc",
  });

  // segmentName pins us to music even when a genre name is ambiguous across
  // segments ("Alternative" exists under more than one).
  params.set("segmentName", "Music");

  if (options.keyword) params.set("keyword", options.keyword);
  if (options.city) params.set("city", options.city);
  if (options.genre) params.set("classificationName", options.genre);

  const res = await fetch(`${BASE_URL}/events.json?${params}`);
  if (!res.ok) {
    throw new Error(`Ticketmaster API error: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as TicketmasterResponse;
}

/**
 * Fetch one Ticketmaster event by id. Returns null on 404 so the route can
 * answer 404 rather than 500.
 */
export async function getTicketmasterEventById(id: string): Promise<TicketmasterEvent | null> {
  const params = new URLSearchParams({ apikey: requireEnv("TICKETMASTER_CONSUMER_KEY") });

  const res = await fetch(`${BASE_URL}/events/${encodeURIComponent(id)}.json?${params}`);
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`Ticketmaster API error: ${res.status} ${res.statusText}`);
  }

  return (await res.json()) as TicketmasterEvent;
}

/**
 * Widest 16:9 image available. Ticketmaster returns the same photo in several
 * crops and sizes; 16:9 matches the card's aspect-video box, and taking the
 * widest avoids a blurry thumbnail stretched across a detail page hero.
 */
export function pickImage(event: TicketmasterEvent): string | null {
  const images = event.images ?? [];
  if (images.length === 0) return null;

  const widescreen = images.filter((image) => image.ratio === "16_9");
  const pool = widescreen.length > 0 ? widescreen : images;

  return pool.reduce((widest, image) => (image.width > widest.width ? image : widest)).url;
}

// Ticketmaster labels a lot of records "Undefined" rather than omitting the
// field, and that is not something to render as a genre chip.
const PLACEHOLDER_CLASSIFICATIONS = new Set(["undefined", "other", "unknown"]);

/** Genre and sub-genre names for an event, deduped, placeholders removed. */
export function extractGenres(event: TicketmasterEvent): string[] {
  const names = (event.classifications ?? []).flatMap((classification) => [
    classification.genre?.name,
    classification.subGenre?.name,
  ]);

  return [
    ...new Set(
      names.filter(
        (name): name is string =>
          typeof name === "string" && !PLACEHOLDER_CLASSIFICATIONS.has(name.toLowerCase())
      )
    ),
  ];
}
