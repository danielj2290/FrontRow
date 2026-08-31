// The browse genres from the Week 2 checklist, paired with the slug SeatGeek
// uses on its PERFORMER records (Spotify no longer returns genres — see the
// note in backend/src/services/spotify.ts).
//
// VERIFY THESE against live data before relying on them: SeatGeek's genre
// vocabulary is not published, so a wrong slug returns zero events rather than
// an error. Check with:
//   curl "http://localhost:3000/api/events?genre=hip-hop&limit=3"
export interface Genre {
  label: string;
  slug: string;
}

export const GENRES: Genre[] = [
  { label: "Pop", slug: "pop" },
  { label: "Rock", slug: "rock" },
  { label: "Hip Hop", slug: "hip-hop" },
  { label: "Country", slug: "country" },
  { label: "EDM", slug: "dance" },
  { label: "Alternative", slug: "alternative" },
  { label: "R&B", slug: "rnb" },
];

export function findGenreBySlug(slug: string | undefined): Genre | undefined {
  return GENRES.find((genre) => genre.slug === slug);
}
