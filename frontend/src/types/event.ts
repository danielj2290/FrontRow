// Mirror of the EventSummary interface the backend returns from /api/events.
// Kept as a hand-written copy rather than shared code because the frontend and
// backend are separate npm projects with no build step between them. If the API
// shape changes, this file changes with it.
export interface EventSummary {
  id: string;
  title: string;
  artist: string | null;
  imageUrl: string | null;
  eventDate: string;
  venue: { name: string; city: string; state: string | null };
  // Always null until the Week 3 bot starts writing price_snapshots.
  getInPrice: number | null;
  onSaleDate: string | null;
  presaleDate: string | null;
}

export interface EventSearchResponse {
  count: number;
  events: EventSummary[];
}
