import { useParams } from "react-router";
import { useApi } from "../hooks/useApi.ts";
import type { ArtistProfile } from "../types/event.ts";
import { EventResults } from "../components/EventResults.tsx";
import { EmptyState } from "../components/EmptyState.tsx";
import { Badge } from "../components/ui/Badge.tsx";
import { ButtonLink } from "../components/ui/Button.tsx";
import { ImageWithFallback } from "../components/ui/ImageWithFallback.tsx";
import { BackLink } from "../components/ui/BackLink.tsx";

export function ArtistPage() {
  const { name } = useParams<{ name: string }>();
  const { status, data: artist, error } = useApi<ArtistProfile>(
    name ? `/api/artists/${encodeURIComponent(name)}` : null
  );

  if (status === "error") {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <BackLink />
        <div className="mt-8">
          <EmptyState title="Artist not found" body={error ?? "We could not load this artist."} />
        </div>
      </div>
    );
  }

  const loading = status === "loading" || status === "idle";

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <BackLink />

      {/* Stacked on a phone, photo beside the text from 640px up */}
      <header className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-end">
        <ImageWithFallback
          src={artist?.imageUrl}
          alt={artist?.name ?? name ?? "Artist"}
          fallbackText={artist?.name ?? name ?? ""}
          className={`h-40 w-40 shrink-0 ${loading ? "animate-pulse" : ""}`}
        />

        <div className="min-w-0">
          {loading ? (
            <div className="h-10 w-64 animate-pulse bg-surface" />
          ) : (
            <h1 className="text-3xl font-extrabold tracking-tight text-fg sm:text-4xl">
              {artist?.name ?? name}
            </h1>
          )}

          {artist && artist.genres.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {artist.genres.slice(0, 5).map((genre) => (
                <Badge key={genre} variant="accent">
                  {genre}
                </Badge>
              ))}
            </div>
          )}

          {artist && (
            <div className="mt-5">
              <ButtonLink to={artist.setlistFmUrl} external variant="secondary" size="sm">
                Past setlists
              </ButtonLink>
            </div>
          )}
        </div>
      </header>

      <section className="mt-14">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-fg-subtle">
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
