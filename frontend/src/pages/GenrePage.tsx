import { useParams } from "react-router";
import { useApi } from "../hooks/useApi.ts";
import type { EventSearchResponse } from "../types/event.ts";
import { EventResults } from "../components/EventResults.tsx";
import { EmptyState } from "../components/EmptyState.tsx";
import { findGenreBySlug } from "../utils/genres.ts";

export function GenrePage() {
  const { slug } = useParams<{ slug: string }>();
  const genre = findGenreBySlug(slug);

  const { status, data, error } = useApi<EventSearchResponse>(
    genre ? `/api/events?genre=${encodeURIComponent(genre.tmName)}&limit=24` : null
  );

  // An unknown slug is a bad URL, not a failed request — say so rather than
  // firing a request we know will come back empty.
  if (!genre) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <EmptyState
          title="Unknown genre"
          body="Pick one of the genres in the header to browse concerts."
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{genre.label}</h1>
      <p className="mt-3 text-zinc-400">Concerts on sale now.</p>

      <div className="mt-10">
        <EventResults
          status={status}
          events={data?.events ?? []}
          error={error}
          emptyTitle={`No ${genre.label} concerts found`}
          emptyBody="Nothing is on sale in this genre right now, or the genre tag needs adjusting."
        />
      </div>
    </div>
  );
}
