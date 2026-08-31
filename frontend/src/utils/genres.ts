// Browse genres, served by Ticketmaster.
//
// SeatGeek cannot do this: its taxonomy tree contains no music genres at all —
// the entire Concerts branch is "Concert" and "Music Festivals" (verified
// 2026-08-31 by dumping /taxonomies). Ticketmaster classifies music as
// Segment (Music) > Genre (Rock) > Sub-Genre (Alternative Rock), and its
// `classificationName` parameter matches any level by name.
//
// The slugs below are OUR url segments; `tmName` is the exact string sent to
// Ticketmaster. Keeping them separate means a pretty url does not depend on a
// third party's naming, and "Hip-Hop/Rap" never has to survive a url.
export interface Genre {
  label: string;
  slug: string;
  tmName: string;
}

export const GENRES: Genre[] = [
  { label: "Pop", slug: "pop", tmName: "Pop" },
  { label: "Rock", slug: "rock", tmName: "Rock" },
  { label: "Hip Hop", slug: "hip-hop", tmName: "Hip-Hop/Rap" },
  { label: "Country", slug: "country", tmName: "Country" },
  { label: "EDM", slug: "edm", tmName: "Dance/Electronic" },
  { label: "Alternative", slug: "alternative", tmName: "Alternative" },
  { label: "R&B", slug: "rnb", tmName: "R&B" },
];

export function findGenreBySlug(slug: string | undefined): Genre | undefined {
  return GENRES.find((genre) => genre.slug === slug);
}
