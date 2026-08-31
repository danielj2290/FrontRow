// Mirror of the shapes the backend returns. Kept as a hand-written copy rather
// than shared code because the frontend and backend are separate npm projects
// with no build step between them. If the API changes, this file changes too.
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

export interface ArtistProfile {
  name: string;
  imageUrl: string | null;
  genres: string[];
  popularity: number | null;
  setlistFmUrl: string;
  events: EventSummary[];
}
