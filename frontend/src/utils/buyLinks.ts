import type { EventSummary } from "../types/event.ts";

export interface BuyLink {
  name: string;
  url: string;
}

/**
 * Marketplace links for an event.
 *
 * These are SEARCH urls, not deep links to the specific listing page. Deep
 * links would need each marketplace's own event id, which means four more API
 * integrations for a link the user clicks once. A pre-filled search lands them
 * on the right event in one step and never 404s when a marketplace changes its
 * url structure.
 */
export function buildBuyLinks(event: EventSummary): BuyLink[] {
  const query = encodeURIComponent(`${event.artist ?? event.title} ${event.venue.city}`);

  return [
    { name: "StubHub", url: `https://www.stubhub.com/find/s/?q=${query}` },
    { name: "SeatGeek", url: `https://seatgeek.com/search?q=${query}` },
    { name: "Vivid Seats", url: `https://www.vividseats.com/search?searchTerm=${query}` },
    { name: "Gametime", url: `https://gametime.co/search?q=${query}` },
  ];
}
