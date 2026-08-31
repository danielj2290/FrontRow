// ======================
// Browse genres
// ======================
// Genre is Ticketmaster's job — SeatGeek has no music genres at all. See
// CRITICAL CONTEXT in CLAUDE.md for the evidence.
//
// The ids below were read from Ticketmaster's own /classifications endpoint on
// 2026-08-31 (npm run test:genres reprints them). We filter by genreId rather
// than classificationName because classificationName matches ANY level —
// segment, genre, sub-genre, type, sub-type — so "Alternative" would also pull
// in sub-genre records and "Rock" would drag in "Alternative Rock". An id
// matches exactly one node.
//
// The slug is OURS and appears in urls; the Ticketmaster id never leaves the
// server. That keeps "Hip-Hop/Rap" out of a url and means a provider change
// does not break anyone's bookmarks.

export interface BrowseGenre {
  slug: string;
  label: string;
  ticketmasterGenreId: string;
}

export const BROWSE_GENRES: BrowseGenre[] = [
  { slug: "pop", label: "Pop", ticketmasterGenreId: "KnvZfZ7vAev" },
  { slug: "rock", label: "Rock", ticketmasterGenreId: "KnvZfZ7vAeA" },
  { slug: "hip-hop", label: "Hip Hop", ticketmasterGenreId: "KnvZfZ7vAv1" },
  { slug: "country", label: "Country", ticketmasterGenreId: "KnvZfZ7vAv6" },
  { slug: "edm", label: "EDM", ticketmasterGenreId: "KnvZfZ7vAvF" },
  { slug: "alternative", label: "Alternative", ticketmasterGenreId: "KnvZfZ7vAvv" },
  { slug: "rnb", label: "R&B", ticketmasterGenreId: "KnvZfZ7vAee" },
];

export function findBrowseGenre(slug: string): BrowseGenre | undefined {
  return BROWSE_GENRES.find((genre) => genre.slug === slug.toLowerCase());
}

/** Thrown when a url carries a genre slug we do not browse. */
export class UnknownGenreError extends Error {
  constructor(slug: string) {
    super(`Unknown genre: ${slug}`);
    this.name = "UnknownGenreError";
  }
}
