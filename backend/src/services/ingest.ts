// ======================
// Event ingestion
// ======================
// Turns an EventSummary — which is a live API response and disappears after the
// request — into durable Artist / Venue / Event rows.
//
// WHY this has to exist: a PriceSnapshot points at an Event row. Until an event
// is in the database there is nothing for the bot to attach a price to. This is
// the bridge between "search results" and "things we track".
//
// Everything here is an UPSERT keyed on a natural key, so running it twice on
// the same event updates rather than duplicates. That matters because the bot,
// the extension and any manual curation can all ingest the same event.

import { prisma } from "../db.js";
import type { EventSummary } from "./eventSearch.js";

// "Zach Bryan" -> "zach-bryan". Used as Artist.slug, which is unique, so it is
// also what makes repeat ingests of the same artist idempotent.
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD") // strip accents: "Beyoncé" -> "Beyonce"
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Upsert an event and everything it depends on. Returns the database id.
 *
 * `isTracked` is deliberately NOT set here. Ingesting an event and choosing to
 * scrape it nightly are separate decisions — we may ingest hundreds through
 * ordinary browsing, and the bot must only visit the ones we opted into.
 */
export async function ingestEvent(summary: EventSummary): Promise<string> {
  // Event.artistId is required, but SeatGeek occasionally returns an event with
  // no performer. Falling back to the title keeps the row valid rather than
  // dropping the event entirely.
  const artistName = summary.artist ?? summary.title;

  const artist = await prisma.artist.upsert({
    where: { slug: slugify(artistName) },
    create: {
      name: artistName,
      slug: slugify(artistName),
      imageUrl: summary.imageUrl,
      genre: summary.genres[0] ?? null,
    },
    // Only fill gaps on update. A later ingest with a missing image should not
    // erase an image an earlier one already found.
    update: {
      imageUrl: summary.imageUrl ?? undefined,
      genre: summary.genres[0] ?? undefined,
    },
  });

  const venue = await prisma.venue.upsert({
    where: { name_city: { name: summary.venue.name, city: summary.venue.city } },
    create: {
      name: summary.venue.name,
      city: summary.venue.city,
      state: summary.venue.state,
      // EventSummary carries no country because both providers are queried
      // US-only. Stored explicitly so the column means something if that
      // ever changes.
      country: "US",
    },
    update: { state: summary.venue.state ?? undefined },
  });

  // The provider prefix decides which natural key we upsert on — the two id
  // spaces are unrelated and must never collide.
  const isSeatGeek = summary.id.startsWith("sg-");
  const providerId = summary.id.slice(3);

  const where = isSeatGeek ? { seatgeekId: providerId } : { ticketmasterId: providerId };

  const shared = {
    title: summary.title,
    artistId: artist.id,
    venueId: venue.id,
    eventDate: new Date(summary.eventDate),
    onSaleDate: summary.onSaleDate ? new Date(summary.onSaleDate) : null,
    presaleDate: summary.presaleDate ? new Date(summary.presaleDate) : null,
  };

  const event = await prisma.event.upsert({
    where,
    create: {
      ...shared,
      seatgeekId: isSeatGeek ? providerId : null,
      ticketmasterId: isSeatGeek ? null : providerId,
    },
    // Dates and titles genuinely change — shows move and get renamed — so these
    // are overwritten rather than only filled in.
    update: shared,
  });

  return event.id;
}

/** Opt an event into nightly scraping, or out of it. */
export async function setTracked(eventId: string, isTracked: boolean): Promise<void> {
  await prisma.event.update({ where: { id: eventId }, data: { isTracked } });
}

/**
 * Every event the nightly bot should visit: tracked, and not already over.
 * Past events are excluded because a concert that has happened has no resale
 * price left to collect.
 */
export async function listTrackedEvents() {
  return prisma.event.findMany({
    where: { isTracked: true, eventDate: { gte: new Date() } },
    include: { artist: true, venue: true },
    orderBy: { eventDate: "asc" },
  });
}
