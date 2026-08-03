// ======================
// Ticketmaster Discovery API client
// ======================
// Ticketmaster is our SECONDARY source. What it has that SeatGeek doesn't:
// official on-sale and presale dates — the raw material for Week 8's
// presale tools. It does NOT expose resale prices.
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
  _embedded?: {
    venues?: { name: string; city?: { name: string } }[];
  };
}

interface TicketmasterResponse {
  _embedded?: { events: TicketmasterEvent[] };
  page: { totalElements: number };
}

/**
 * Discover music events by keyword (artist name) and/or city.
 * Maps to the Week 1 checklist item: "event discovery, on-sale dates".
 */
export async function discoverEvents(options: {
  keyword?: string;
  city?: string;
  size?: number;
}): Promise<TicketmasterResponse> {
  const params = new URLSearchParams({
    apikey: requireEnv("TICKETMASTER_CONSUMER_KEY"),
    classificationName: "music", // concerts only
    size: String(options.size ?? 5),
    sort: "date,asc",
  });

  if (options.keyword) params.set("keyword", options.keyword);
  if (options.city) params.set("city", options.city);

  const res = await fetch(`${BASE_URL}/events.json?${params}`);
  if (!res.ok) {
    throw new Error(`Ticketmaster API error: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as TicketmasterResponse;
}
