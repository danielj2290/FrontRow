import { useSearchParams } from "react-router";
import { TourCard } from "../components/TourCard.tsx";
import { EmptyState } from "../components/EmptyState.tsx";
import { useApi } from "../hooks/useApi.ts";
import { SIZE_LABELS, type TourResponse, type VenueSize } from "../types/tour.ts";

const SIZES: VenueSize[] = ["large", "medium", "small"];

/**
 * The hyped tours browse page, split by how big a room the artist is playing.
 *
 * WHY SIZE IS THE SPLIT: "most hyped in America" is dominated by stadium acts,
 * which buries everything else. Separating by venue size means a club tour
 * competes against other club tours rather than against Beyoncé, and it maps
 * to how people actually decide what to go to.
 */
export function ToursPage() {
  // The selected tab lives in the url so a tab is shareable and the back
  // button steps between them.
  const [searchParams, setSearchParams] = useSearchParams();
  const sizeParam = searchParams.get("size");
  const size: VenueSize = isVenueSize(sizeParam) ? sizeParam : "large";

  const { status, data, error } = useApi<TourResponse>(`/api/tours?size=${size}&limit=24`);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight text-fg sm:text-4xl">
          Most Hyped Concerts in America
        </h1>
        <p className="mt-3 max-w-xl leading-relaxed text-fg-muted">
          Every tour on sale, grouped by artist and ranked by hype. Split by
          venue size so a club run is not competing with a stadium run.
        </p>
      </header>

      {/* Scrolls horizontally on a phone rather than wrapping — keeps the tab
          row one line at every width. */}
      <nav className="-mx-1 mt-8 flex gap-1 overflow-x-auto" aria-label="Venue size">
        {SIZES.map((option) => {
          const isActive = option === size;
          return (
            <button
              key={option}
              type="button"
              onClick={() => setSearchParams({ size: option })}
              aria-current={isActive ? "true" : undefined}
              className={`shrink-0 border px-4 py-2 text-sm font-semibold uppercase tracking-wide transition-colors ${
                isActive
                  ? "border-accent bg-accent text-accent-fg"
                  : "border-line text-fg-muted hover:border-accent hover:text-fg"
              }`}
            >
              {SIZE_LABELS[option]}
            </button>
          );
        })}
      </nav>

      <div className="mt-10">
        {status === "error" ? (
          <EmptyState
            title="Could not load tours"
            body={error ?? "Try again in a moment."}
          />
        ) : status === "success" && data?.tours.length === 0 ? (
          <EmptyState
            title={`No ${SIZE_LABELS[size].toLowerCase()} tours found`}
            body="Nothing in this tier right now. Try another size."
          />
        ) : (
          <div className="grid grid-cols-1 gap-px bg-line sm:grid-cols-2 lg:grid-cols-4">
            {status === "loading" || status === "idle"
              ? Array.from({ length: 8 }, (_, index) => <TourSkeleton key={index} />)
              : data?.tours.map((tour) => <TourCard key={tour.id} tour={tour} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function isVenueSize(value: string | null): value is VenueSize {
  return value === "large" || value === "medium" || value === "small";
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
