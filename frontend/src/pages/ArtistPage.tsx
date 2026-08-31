import { useParams } from "react-router";
import { useApi } from "../hooks/useApi.ts";
import type { ArtistProfile } from "../types/event.ts";
import { EventResults } from "../components/EventResults.tsx";
import { EmptyState } from "../components/EmptyState.tsx";

export function ArtistPage() {
  const { name } = useParams<{ name: string }>();
  const { status, data: artist, error } = useApi<ArtistProfile>(
    name ? `/api/artists/${encodeURIComponent(name)}` : null
  );

  if (status === "error") {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <EmptyState title="Artist not found" body={error ?? "We could not load this artist."} />
      </div>
    );
  }

  const loading = status === "loading" || status === "idle";

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      {/* Stacked on a phone, photo beside the text from 640px up */}
      <header className="flex flex-col gap-6 sm:flex-row sm:items-end">
        <div className="h-40 w-40 shrink-0 overflow-hidden bg-zinc-900">
          {artist?.imageUrl ? (
            <img
              src={artist.imageUrl}
              alt={artist.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className={`h-full w-full ${loading ? "animate-pulse" : ""} bg-zinc-900`} />
          )}
        </div>

        <div className="min-w-0">
          {loading ? (
            <div className="h-10 w-64 animate-pulse bg-zinc-900" />
          ) : (
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              {artist?.name ?? name}
            </h1>
          )}

          {artist && artist.genres.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {artist.genres.slice(0, 5).map((genre) => (
                <span
                  key={genre}
                  className="border border-zinc-800 px-2.5 py-1 text-xs font-medium uppercase tracking-wide text-zinc-400"
                >
                  {genre}
                </span>
              ))}
            </div>
          )}

          {artist && (
            <a
              href={artist.setlistFmUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="mt-4 inline-block text-sm font-medium text-green-400 underline-offset-4 hover:underline"
            >
              Past setlists on setlist.fm
            </a>
          )}
        </div>
      </header>

      <section className="mt-12">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-zinc-500">
          Upcoming shows
        </h2>
        <EventResults
          status={loading ? "loading" : "success"}
          events={artist?.events ?? []}
          error={null}
          emptyTitle="No upcoming shows"
          emptyBody="This artist has no concerts on sale right now. Check back after their next tour announcement."
        />
      </section>
    </div>
  );
}
