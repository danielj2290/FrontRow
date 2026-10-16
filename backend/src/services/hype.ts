// ======================
// Hype scoring and tour grouping
// ======================
// This is the heart of the product. Resale PRICES are gated behind partner
// APIs and defended by commercial bot detection, but POPULARITY is not — it
// comes back on every SeatGeek event for free. So instead of asking "will this
// get cheaper", Front Row answers "what is worth paying attention to".
//
// Two ideas live here:
//
// 1. HYPE SCORE — a weighted, explainable blend of four signals. Deliberately
//    not a black box: every component can be shown to the user, and a ranking
//    nobody can explain is a ranking nobody trusts.
//
// 2. TOUR GROUPING — Olivia Rodrigo playing thirty arenas is ONE thing people
//    care about, not thirty. Collapsing dates into a tour is what makes a
//    browse page readable instead of thirty near-identical rows.

import type { SeatGeekEvent } from "./seatgeek.js";

// ----------------------------------------------------------------------------
// Venue size
// ----------------------------------------------------------------------------

export type VenueSize = "large" | "medium" | "small";

// Capacity thresholds. Stadiums and major arenas at the top, theatres and
// amphitheatres in the middle, clubs at the bottom.
const LARGE_MIN_CAPACITY = 12_000;
const MEDIUM_MIN_CAPACITY = 1_500;

// SeatGeek leaves capacity null on a lot of venues, so a pure capacity split
// would dump most of the catalogue into one bucket. The venue NAME is a
// surprisingly reliable fallback: rooms are named after what they are.
const LARGE_NAME_HINTS = /stadium|arena|coliseum|dome|speedway|bowl|field/i;
const MEDIUM_NAME_HINTS = /amphitheat|theat|hall|auditorium|pavilion|ballroom|opera/i;

export function venueSize(venue: { name: string; capacity?: number | null }): VenueSize {
  // Real capacity always wins when we have it.
  if (typeof venue.capacity === "number" && venue.capacity > 0) {
    if (venue.capacity >= LARGE_MIN_CAPACITY) return "large";
    if (venue.capacity >= MEDIUM_MIN_CAPACITY) return "medium";
    return "small";
  }

  // Order matters: "Hollywood Bowl" is an amphitheatre but matches the large
  // hints first, which is correct — it holds about 17,000.
  if (LARGE_NAME_HINTS.test(venue.name)) return "large";
  if (MEDIUM_NAME_HINTS.test(venue.name)) return "medium";

  // Unknown capacity and an unremarkable name is almost always a club.
  return "small";
}

// ----------------------------------------------------------------------------
// Hype score
// ----------------------------------------------------------------------------

export interface HypeBreakdown {
  popularity: number; // SeatGeek's own score for the event
  venueSize: number; // how big a room they can fill
  freshness: number; // how recently the tour was announced
  tourSize: number; // how many dates are on the run
}

export interface HypeResult {
  score: number; // 0-100, what gets displayed and sorted on
  breakdown: HypeBreakdown;
}

// Weights sum to 1. Popularity carries the most because it is the only signal
// derived from real demand rather than inference; the other three are context
// that stops a single number from being the whole story.
const WEIGHTS = { popularity: 0.45, venueSize: 0.25, freshness: 0.15, tourSize: 0.15 };

const SIZE_POINTS: Record<VenueSize, number> = { large: 1, medium: 0.55, small: 0.2 };

// A tour announced today is news; one announced six months ago is not. Decay
// is linear to zero over this window rather than a cliff, so an item slides
// down the feed instead of vanishing overnight.
const FRESHNESS_WINDOW_DAYS = 45;

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function freshnessPoints(announceDate: string | null | undefined): number {
  if (!announceDate) return 0;

  const announced = new Date(announceDate).getTime();
  if (Number.isNaN(announced)) return 0;

  const daysAgo = (Date.now() - announced) / 86_400_000;
  if (daysAgo < 0) return 1; // dated in the future — treat as brand new
  return clamp01(1 - daysAgo / FRESHNESS_WINDOW_DAYS);
}

// A 40-date arena run is a bigger deal than a one-off. Logarithmic because the
// difference between 1 and 10 dates matters far more than 30 versus 40.
function tourSizePoints(dateCount: number): number {
  return clamp01(Math.log10(dateCount + 1) / Math.log10(41));
}

export function scoreHype(options: {
  seatGeekScore: number | null | undefined;
  venue: { name: string; capacity?: number | null };
  announceDate: string | null | undefined;
  dateCount: number;
}): HypeResult {
  const breakdown: HypeBreakdown = {
    // SeatGeek's score is roughly 0-1 but is not documented as bounded, so it
    // is clamped rather than trusted.
    popularity: clamp01(options.seatGeekScore ?? 0),
    venueSize: SIZE_POINTS[venueSize(options.venue)],
    freshness: freshnessPoints(options.announceDate),
    tourSize: tourSizePoints(options.dateCount),
  };

  const weighted =
    breakdown.popularity * WEIGHTS.popularity +
    breakdown.venueSize * WEIGHTS.venueSize +
    breakdown.freshness * WEIGHTS.freshness +
    breakdown.tourSize * WEIGHTS.tourSize;

  return { score: Math.round(weighted * 100), breakdown };
}

// ----------------------------------------------------------------------------
// Tour grouping
// ----------------------------------------------------------------------------

export interface TourDate {
  eventId: string;
  date: string;
  city: string;
  state: string | null;
  venueName: string;
  size: VenueSize;
}

export interface Tour {
  /** Stable id built from the artist name, so it survives between requests. */
  id: string;
  artist: string;
  title: string;
  imageUrl: string | null;
  hypeScore: number;
  hypeBreakdown: HypeBreakdown;
  /** The dominant venue size across the run — what the browse page filters on. */
  size: VenueSize;
  dateCount: number;
  firstDate: string;
  lastDate: string;
  /** Distinct cities, capped for display. */
  cities: string[];
  announceDate: string | null;
  dates: TourDate[];
}

function slugifyArtist(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const SIZE_RANK: Record<VenueSize, number> = { small: 0, medium: 1, large: 2 };

/**
 * Collapse a flat list of events into one entry per artist.
 *
 * Grouping by HEADLINER, not by title: SeatGeek titles vary per stop ("Olivia
 * Rodrigo" versus "Olivia Rodrigo with Chappell Roan"), so titles would split
 * one tour into several. The first performer is the headliner on every
 * SeatGeek concert response, which makes it the only stable grouping key
 * available to us.
 */
export function groupIntoTours(events: SeatGeekEvent[]): Tour[] {
  const byArtist = new Map<string, SeatGeekEvent[]>();

  for (const event of events) {
    const headliner = event.performers?.[0]?.name;
    if (!headliner) continue;

    const key = slugifyArtist(headliner);
    const existing = byArtist.get(key);
    if (existing) existing.push(event);
    else byArtist.set(key, [event]);
  }

  const tours: Tour[] = [];

  for (const [key, group] of byArtist) {
    const sorted = [...group].sort(
      (a, b) => new Date(a.datetime_local).getTime() - new Date(b.datetime_local).getTime()
    );

    const headliner = sorted[0].performers[0];

    const dates: TourDate[] = sorted.map((event) => ({
      eventId: `sg-${event.id}`,
      date: event.datetime_local,
      city: event.venue.city,
      state: event.venue.state ?? null,
      venueName: event.venue.name,
      size: venueSize(event.venue),
    }));

    // The run's size is its BIGGEST room, not its average. A stadium tour with
    // two club warm-up shows is still a stadium tour.
    const size = dates.reduce<VenueSize>(
      (biggest, date) => (SIZE_RANK[date.size] > SIZE_RANK[biggest] ? date.size : biggest),
      "small"
    );

    // Rank on the strongest night. The marquee date is what makes a tour
    // notable, and averaging would punish long runs that include small markets.
    const bestScore = Math.max(...sorted.map((event) => event.score ?? 0));
    const announceDate = sorted.find((event) => event.announce_date)?.announce_date ?? null;
    const biggestVenue = sorted.find((event) => venueSize(event.venue) === size)?.venue;

    const hype = scoreHype({
      seatGeekScore: bestScore,
      venue: biggestVenue ?? sorted[0].venue,
      announceDate,
      dateCount: sorted.length,
    });

    tours.push({
      id: key,
      artist: headliner.name,
      title: sorted[0].title,
      imageUrl: headliner.image ?? null,
      hypeScore: hype.score,
      hypeBreakdown: hype.breakdown,
      size,
      dateCount: sorted.length,
      firstDate: sorted[0].datetime_local,
      lastDate: sorted[sorted.length - 1].datetime_local,
      cities: [...new Set(dates.map((date) => date.city))].slice(0, 6),
      announceDate,
      dates,
    });
  }

  return tours.sort((a, b) => b.hypeScore - a.hypeScore);
}
