import { useParams } from "react-router";
import { useApi } from "../hooks/useApi.ts";
import type { Tour, TourDate } from "../types/tour.ts";
import { EmptyState } from "../components/EmptyState.tsx";
import { Badge } from "../components/ui/Badge.tsx";
import { ButtonLink } from "../components/ui/Button.tsx";
import { ImageWithFallback } from "../components/ui/ImageWithFallback.tsx";
import { BackLink } from "../components/ui/BackLink.tsx";
import { formatEventDate, formatEventTime } from "../utils/format.ts";

/**
 * Every date on one tour.
 *
 * This is what a card promising "20 dates" has to land on. Clicking through to
 * a generic artist page left people guessing what they were looking at — here
 * the answer is the list of dates, in order, with the city for each.
 */
export function TourDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { status, data: tour, error } = useApi<Tour>(id ? `/api/tours/${id}` : null);

  if (status === "loading" || status === "idle") return <TourSkeleton />;

  if (status === "error" || !tour) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <BackLink fallbackTo="/tours" />
        <div className="mt-8">
          <EmptyState
            title="Tour not found"
            body={error ?? "This tour may have dropped out of the current rankings."}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
      <BackLink fallbackTo="/tours" />

      {/* Stacked on a phone, photo beside the text from 640px */}
      <header className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-end">
        <ImageWithFallback
          src={tour.imageUrl}
          alt={tour.artist}
          fallbackText={tour.artist}
          className="h-40 w-40 shrink-0"
        />

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="accent">Hype {tour.hypeScore}</Badge>
            <Badge variant="outline">{sizeLabel(tour.size)}</Badge>
            <Badge variant="outline">
              {tour.dateCount === 1 ? "1 date" : `${tour.dateCount} dates`}
            </Badge>
          </div>

          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-fg sm:text-4xl">
            {tour.artist}
          </h1>

          <p className="mt-2 text-fg-muted">
            {formatEventDate(tour.firstDate)}
            {tour.dateCount > 1 ? ` — ${formatEventDate(tour.lastDate)}` : ""}
          </p>

          <div className="mt-5">
            <ButtonLink
              to={`/artist/${encodeURIComponent(tour.artist)}`}
              variant="secondary"
              size="sm"
            >
              Artist page
            </ButtonLink>
          </div>
        </div>
      </header>

      <HypeBreakdown tour={tour} />

      <section className="mt-12">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-fg-subtle">
          All dates
        </h2>

        {/* A list, not a grid: dates are read in order, and a grid would make
            the reader hunt for the chronology. */}
        <ol className="flex flex-col gap-px bg-line">
          {tour.dates.map((date) => (
            <li key={date.eventId}>
              <TourDateRow date={date} />
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

/**
 * Why this tour ranks where it does.
 *
 * The score is the reason the card appeared, so hiding how it was reached
 * makes the ranking feel arbitrary. Four bars is enough to see which signal
 * is carrying it.
 */
function HypeBreakdown({ tour }: { tour: Tour }) {
  const rows: { label: string; value: number }[] = [
    { label: "Demand", value: tour.hypeBreakdown.popularity },
    { label: "Venue size", value: tour.hypeBreakdown.venueSize },
    { label: "Just announced", value: tour.hypeBreakdown.freshness },
    { label: "Tour length", value: tour.hypeBreakdown.tourSize },
  ];

  return (
    <section className="mt-12 border border-line p-5">
      <h2 className="text-sm font-bold uppercase tracking-widest text-fg-subtle">
        Why it is hyped
      </h2>

      <dl className="mt-5 flex flex-col gap-4">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center gap-4">
            <dt className="w-32 shrink-0 text-sm text-fg-muted">{row.label}</dt>
            <dd className="flex-1">
              <div className="h-2 w-full bg-surface">
                <div
                  className="h-full bg-accent"
                  style={{ width: `${Math.round(row.value * 100)}%` }}
                />
              </div>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/**
 * One date on the tour, linking straight to where you buy it.
 *
 * Ticketmaster is preferred when the date+city match found it — it is the
 * primary seller, so it is where face-value tickets are. SeatGeek is the
 * fallback and always exists, because the tour pool is built from SeatGeek.
 *
 * This leaves the site rather than routing through our own event page. That
 * is the right call TODAY: our event page adds nothing a buyer needs yet.
 * Once there are price charts and a forecast on it, this should point inward
 * instead, and the marketplace link moves onto that page.
 */
function TourDateRow({ date }: { date: TourDate }) {
  const href = date.ticketmasterUrl ?? date.seatgeekUrl;
  const seller = date.ticketmasterUrl ? "Ticketmaster" : "SeatGeek";
  const time = formatEventTime(date.date);

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className="group flex flex-col gap-2 bg-canvas p-4 transition-colors hover:bg-surface-hover sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="min-w-0">
        <p className="text-sm font-semibold text-fg">
          {formatEventDate(date.date)}
          {time ? ` · ${time}` : ""}
        </p>
        <p className="mt-1 line-clamp-1 text-sm text-fg-muted">{date.venueName}</p>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <span className="text-sm text-fg-subtle">
          {date.city}
          {date.state ? `, ${date.state}` : ""}
        </span>
        <span className="text-xs font-semibold uppercase tracking-wide text-accent transition-colors group-hover:text-accent-hover">
          {seller}
        </span>
      </div>
    </a>
  );
}

function sizeLabel(size: Tour["size"]): string {
  if (size === "large") return "Arena";
  if (size === "medium") return "Theatre";
  return "Club";
}

function TourSkeleton() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
      <div className="h-4 w-16 animate-pulse bg-surface" />
      <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-end">
        <div className="h-40 w-40 shrink-0 animate-pulse bg-surface" />
        <div className="flex-1 space-y-4">
          <div className="h-6 w-48 animate-pulse bg-surface" />
          <div className="h-9 w-64 animate-pulse bg-surface" />
          <div className="h-4 w-40 animate-pulse bg-surface" />
        </div>
      </div>
      <div className="mt-12 h-40 w-full animate-pulse bg-surface" />
    </div>
  );
}
