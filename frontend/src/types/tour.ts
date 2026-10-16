// Mirror of what /api/tours returns. Hand-written rather than shared code
// because the frontend and backend are separate npm projects with no build
// step between them — if the API shape changes, this file changes with it.

export type VenueSize = "large" | "medium" | "small";

export interface HypeBreakdown {
  popularity: number;
  venueSize: number;
  freshness: number;
  tourSize: number;
}

export interface TourDate {
  eventId: string;
  date: string;
  city: string;
  state: string | null;
  venueName: string;
  size: VenueSize;
  seatgeekUrl: string;
  ticketmasterUrl: string | null;
}

export interface Tour {
  id: string;
  artist: string;
  title: string;
  imageUrl: string | null;
  hypeScore: number;
  hypeBreakdown: HypeBreakdown;
  size: VenueSize;
  dateCount: number;
  firstDate: string;
  lastDate: string;
  cities: string[];
  announceDate: string | null;
  dates: TourDate[];
}

export interface TourResponse {
  count: number;
  size?: VenueSize;
  tours: Tour[];
}

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
  isLive: boolean;
  hypeScore: number;
}

export interface PresaleResponse {
  count: number;
  presales: HypedPresale[];
}

export const SIZE_LABELS: Record<VenueSize, string> = {
  large: "Arenas & Stadiums",
  medium: "Theatres & Amphitheatres",
  small: "Clubs & Small Rooms",
};
