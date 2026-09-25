import type { ReactNode } from "react";
import { Link, useNavigate } from "react-router";
import { SearchBar } from "../components/SearchBar.tsx";
import { EventResults } from "../components/EventResults.tsx";
import { ImageWithFallback } from "../components/ui/ImageWithFallback.tsx";
import { useApi } from "../hooks/useApi.ts";
import type { EventSearchResponse, EventSummary } from "../types/event.ts";
import { ALL_CITIES, useLocation } from "../context/locationContext.ts";
import { GENRES } from "../utils/genres.ts";

export function HomePage() {
  const navigate = useNavigate();
  const { city } = useLocation();

  // "What is on near me" needs no new endpoint: a city-only search already
  // returns the concerts on sale there. Twelve fills the grid four-across
  // without pushing the artist row below a second scroll.
  const query = new URLSearchParams({ limit: "12" });
  if (city !== ALL_CITIES) query.set("city", city);
  else query.set("city", "Los Angeles"); // never render an empty homepage

  const { status, data, error } = useApi<EventSearchResponse>(`/api/events?${query}`);

  function handleSearch(artist: string) {
    if (!artist.trim()) return;
    // The homepage does not show results itself — it hands off to /search, so
    // a result set always has a shareable url of its own.
    navigate(`/search?artist=${encodeURIComponent(artist.trim())}`);
  }

  return (
    <div>
      <Hero onSearch={handleSearch} />

      <div className="mx-auto max-w-6xl px-4">
        <Section
          title={city === ALL_CITIES ? "On sale now" : `On sale in ${city}`}
          subtitle="Concerts we are tracking prices for"
        >
          <EventResults
            status={status}
            events={data?.events ?? []}
            error={error}
            emptyTitle="No concerts found"
            emptyBody="Nothing on sale here right now. Try another city from the header."
          />
        </Section>

        <ArtistStrip events={data?.events ?? []} loading={status === "loading"} />
      </div>
    </div>
  );
}

function Hero({ onSearch }: { onSearch: (artist: string) => void }) {
  return (
    // The one place in the app with a colour wash. A flat purple block would
    // fight the black everywhere else; a radial fade reads as light falling on
    // the page instead of a painted panel.
    <section className="relative overflow-hidden border-b border-line">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% -10%, var(--color-accent-dim), transparent 70%)",
        }}
      />

      <div className="relative mx-auto max-w-3xl px-4 py-20 text-center sm:py-28">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">
          Concerts only
        </p>

        {/* text-balance stops a two-word orphan on the second line at tablet
            widths, where headlines break worst. */}
        <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight text-fg text-balance sm:text-6xl">
          Know when to buy.
        </h1>

        <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-fg-muted">
          Front Row tracks resale prices every night and tells you whether to
          buy now or wait.
        </p>

        <div className="mx-auto mt-10 max-w-xl">
          <SearchBar onSearch={onSearch} disabled={false} />
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
          {GENRES.map((genre) => (
            <Link
              key={genre.slug}
              to={`/genre/${genre.slug}`}
              className="border border-line px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-fg-muted transition-colors hover:border-accent hover:text-fg"
            >
              {genre.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <section className="py-14 sm:py-20">
      <header className="mb-8">
        <h2 className="text-2xl font-extrabold tracking-tight text-fg sm:text-3xl">
          {title}
        </h2>
        <p className="mt-2 text-sm text-fg-muted">{subtitle}</p>
      </header>
      {children}
    </section>
  );
}

/**
 * Artists pulled from the events already on screen — no extra request.
 *
 * Deduped by name, because a headliner on a three-night run would otherwise
 * appear three times, and only artists with a photo are shown: a row of
 * text-fallback tiles is worse than a shorter row.
 */
function ArtistStrip({ events, loading }: { events: EventSummary[]; loading: boolean }) {
  const seen = new Set<string>();
  const artists: { name: string; imageUrl: string }[] = [];

  for (const event of events) {
    if (!event.artist || !event.imageUrl || seen.has(event.artist)) continue;
    seen.add(event.artist);
    artists.push({ name: event.artist, imageUrl: event.imageUrl });
  }

  if (!loading && artists.length === 0) return null;

  return (
    <section className="border-t border-line py-14 sm:py-20">
      <header className="mb-8">
        <h2 className="text-2xl font-extrabold tracking-tight text-fg sm:text-3xl">
          Artists to watch
        </h2>
        <p className="mt-2 text-sm text-fg-muted">Playing near you soon</p>
      </header>

      {/* Horizontal scroll on a phone rather than a wrapped grid — a row that
          runs off the edge invites a swipe; a 2x3 grid of faces does not. */}
      <div className="-mx-4 flex gap-px overflow-x-auto bg-line px-4 sm:mx-0 sm:px-0">
        {loading
          ? Array.from({ length: 6 }, (_, index) => (
              <div key={index} className="w-36 shrink-0 bg-canvas p-3">
                <div className="aspect-square animate-pulse bg-surface" />
                <div className="mt-3 h-3 w-3/4 animate-pulse bg-surface" />
              </div>
            ))
          : artists.slice(0, 10).map((artist) => (
              <Link
                key={artist.name}
                to={`/artist/${encodeURIComponent(artist.name)}`}
                className="group w-36 shrink-0 bg-canvas p-3 transition-colors hover:bg-surface-hover"
              >
                <ImageWithFallback
                  src={artist.imageUrl}
                  alt={artist.name}
                  fallbackText={artist.name}
                  className="aspect-square"
                  imageClassName="transition-transform duration-300 group-hover:scale-105"
                />
                <p className="mt-3 line-clamp-2 text-sm font-semibold text-fg">
                  {artist.name}
                </p>
              </Link>
            ))}
      </div>
    </section>
  );
}
