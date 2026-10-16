import type { ReactNode } from "react";
import { Link, useNavigate } from "react-router";
import { SearchBar } from "../components/SearchBar.tsx";
import { TourCard } from "../components/TourCard.tsx";
import { PresaleCard } from "../components/PresaleCard.tsx";
import { EmptyState } from "../components/EmptyState.tsx";
import { useApi } from "../hooks/useApi.ts";
import type { PresaleResponse, TourResponse } from "../types/tour.ts";
import { GENRES } from "../utils/genres.ts";
import { ALL_CITIES, useLocation } from "../context/locationContext.ts";

export function HomePage() {
  const navigate = useNavigate();

  const { city } = useLocation();

  // The city goes into the request path, so changing it in the header changes
  // the url useApi is watching and both feeds refetch on their own.
  const cityParam = city === ALL_CITIES ? "" : `&city=${encodeURIComponent(city)}`;
  const tours = useApi<TourResponse>(`/api/tours/hyped?limit=8${cityParam}`);
  const presales = useApi<PresaleResponse>(`/api/tours/presales?limit=6${cityParam}`);

  function handleSearch(artist: string) {
    if (!artist.trim()) return;
    // The homepage hands off to /search so every result set has a shareable
    // url of its own rather than living in this page's state.
    navigate(`/search?artist=${encodeURIComponent(artist.trim())}`);
  }

  return (
    <div>
      <Hero onSearch={handleSearch} />

      <div className="mx-auto max-w-6xl px-4">
        <Section
          title={city === ALL_CITIES ? "Most Hyped Tours Coming Up" : `Most Hyped Tours Coming to ${city}`}
          subtitle="Ranked by demand, venue size, how recently they were announced, and how many dates they are playing"
          action={{ label: "See all tours", to: "/tours" }}
        >
          {tours.status === "error" ? (
            <EmptyState
              title="Could not load tours"
              body={tours.error ?? "Try again in a moment."}
            />
          ) : (
            <div className="grid grid-cols-1 gap-px bg-line sm:grid-cols-2 lg:grid-cols-4">
              {tours.status === "loading" || tours.status === "idle"
                ? Array.from({ length: 8 }, (_, index) => <TourSkeleton key={index} />)
                : tours.data?.tours.map((tour) => <TourCard key={tour.id} tour={tour} />)}
            </div>
          )}
        </Section>

        <Section
          title={city === ALL_CITIES ? "Hyped Artist Presales Right Now" : `Hyped Presales Near ${city}`}
          subtitle="Presale windows open now or opening in the next two weeks — the ones you can still act on"
        >
          {presales.status === "error" ? (
            <EmptyState
              title="Could not load presales"
              body={presales.error ?? "Try again in a moment."}
            />
          ) : presales.status === "success" && presales.data?.presales.length === 0 ? (
            <EmptyState
              title="No presales in the next two weeks"
              body={city === ALL_CITIES ? "Nothing is opening soon. Check back — announcements come in waves." : `Nothing opening near ${city}. Clear the location in the header to see every presale.`}
            />
          ) : (
            <div className="grid grid-cols-1 gap-px bg-line sm:grid-cols-2">
              {presales.status === "loading" || presales.status === "idle"
                ? Array.from({ length: 4 }, (_, index) => <PresaleSkeleton key={index} />)
                : presales.data?.presales.map((presale) => (
                    <PresaleCard key={presale.id} presale={presale} />
                  ))}
            </div>
          )}
        </Section>
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
          Find the tours worth going to.
        </h1>

        <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-fg-muted">
          Front Row ranks every upcoming tour in America by hype, and tells you
          when the presale opens.
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
  action,
  children,
}: {
  title: string;
  subtitle: string;
  action?: { label: string; to: string };
  children: ReactNode;
}) {
  return (
    <section className="py-14 sm:py-20">
      {/* Stacked on a phone so the heading keeps its full width; the link
          moves alongside it from 640px. */}
      <header className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-fg sm:text-3xl">
            {title}
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-fg-muted">{subtitle}</p>
        </div>

        {action && (
          <Link
            to={action.to}
            className="shrink-0 text-sm font-semibold uppercase tracking-wide text-accent transition-colors hover:text-accent-hover"
          >
            {action.label}
          </Link>
        )}
      </header>

      {children}
    </section>
  );
}

function TourSkeleton() {
  return (
    <div className="bg-canvas">
      <div className="aspect-[3/2] animate-pulse bg-surface" />
      <div className="space-y-3 p-4">
        <div className="h-4 w-3/4 animate-pulse bg-surface" />
        <div className="h-3 w-1/3 animate-pulse bg-surface" />
        <div className="h-3 w-2/3 animate-pulse bg-surface" />
      </div>
    </div>
  );
}

function PresaleSkeleton() {
  return (
    <div className="flex gap-4 bg-canvas p-4">
      <div className="h-20 w-20 shrink-0 animate-pulse bg-surface" />
      <div className="flex-1 space-y-3">
        <div className="h-5 w-24 animate-pulse bg-surface" />
        <div className="h-4 w-3/4 animate-pulse bg-surface" />
        <div className="h-3 w-1/2 animate-pulse bg-surface" />
      </div>
    </div>
  );
}
