import { useParams } from "react-router";
import { useApi } from "../hooks/useApi.ts";
import type { EventSearchResponse } from "../types/event.ts";
import { EventResults } from "../components/EventResults.tsx";
import { EmptyState } from "../components/EmptyState.tsx";
import { findGenreBySlug } from "../utils/genres.ts";
import { ALL_CITIES, useLocation } from "../context/locationContext.ts";

export function GenrePage() {
  const { slug } = useParams<{ slug: string }>();
  const genre = findGenreBySlug(slug);
  const { city } = useLocation();

  const query = new URLSearchParams({ limit: "24" });
  if (genre) query.set("genre", genre.slug);
  if (city !== ALL_CITIES) query.set("city", city);

  const { status, data, error } = useApi<EventSearchResponse>(
    genre ? `/api/events?${query}` : null
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
      <p className="mt-3 text-fg-muted">
        {city === ALL_CITIES
          ? "Popular concerts over the next three months."
          : `Popular concerts in ${city} over the next three months.`}
      </p>

      <div className="mt-10">
        <EventResults
          status={status}
          events={data?.events ?? []}
          error={error}
          emptyTitle={`No ${genre.label} concerts found`}
          emptyBody={
            city === ALL_CITIES
              ? "Nothing is on sale in this genre over the next three months."
              : `Nothing in ${city} over the next three months. Try another city, or clear the location in the header.`
          }
        />
      </div>
    </div>
  );
}
