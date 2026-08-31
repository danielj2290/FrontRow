// Browse genres for the header nav.
//
// Only the slug and the label live here. The Ticketmaster genre id that
// actually drives the query stays server-side in backend/src/services/genres.ts
// — the frontend should not know or care which provider answers a genre.
//
// (SeatGeek cannot: its taxonomy tree has no music genres at all. See CRITICAL
// CONTEXT in CLAUDE.md.)
export interface Genre {
  label: string;
  slug: string;
}

export const GENRES: Genre[] = [
  { label: "Pop", slug: "pop" },
  { label: "Rock", slug: "rock" },
  { label: "Hip Hop", slug: "hip-hop" },
  { label: "Country", slug: "country" },
  { label: "EDM", slug: "edm" },
  { label: "Alternative", slug: "alternative" },
  { label: "R&B", slug: "rnb" },
];

export function findGenreBySlug(slug: string | undefined): Genre | undefined {
  return GENRES.find((genre) => genre.slug === slug);
}
