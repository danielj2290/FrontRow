import type { ReactNode } from "react";
import { Link, useParams } from "react-router";
import { useApi } from "../hooks/useApi.ts";
import type { EventSummary } from "../types/event.ts";
import { EmptyState } from "../components/EmptyState.tsx";
import { buildBuyLinks } from "../utils/buyLinks.ts";
import { formatEventDate, formatEventTime, formatPrice, formatVenue } from "../utils/format.ts";

export function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { status, data: event, error } = useApi<EventSummary>(id ? `/api/events/${id}` : null);

  if (status === "loading") return <DetailSkeleton />;

  if (status === "error" || !event) {
    return (
      <Shell>
        <EmptyState
          title="Event not found"
          body={error ?? "We could not load this event. It may have been removed."}
        />
      </Shell>
    );
  }

  const time = formatEventTime(event.eventDate);
  const price = formatPrice(event.getInPrice);
  const buyLinks = buildBuyLinks(event);

  return (
    <Shell>
      {event.imageUrl && (
        <div className="mb-8 aspect-video w-full overflow-hidden bg-zinc-900 sm:aspect-[21/9]">
          <img
            src={event.imageUrl}
            alt={event.artist ?? event.title}
            className="h-full w-full object-cover"
          />
        </div>
      )}

      <p className="text-sm font-semibold uppercase tracking-wider text-green-400">
        {formatEventDate(event.eventDate)}
        {time ? ` \u00b7 ${time}` : ""}
      </p>

      <h1 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
        {event.title}
      </h1>

      <p className="mt-3 text-lg text-zinc-400">{formatVenue(event.venue)}</p>

      {event.artist && (
        <Link
          to={`/artist/${encodeURIComponent(event.artist)}`}
          className="mt-4 inline-block border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-200 transition-colors hover:border-zinc-500 hover:bg-zinc-900"
        >
          More from {event.artist}
        </Link>
      )}

      <dl className="mt-10 grid grid-cols-1 gap-px border border-zinc-800 bg-zinc-800 sm:grid-cols-3">
        <Stat
          label="Get-in price"
          value={price ?? "Tracking soon"}
          hint={price ? undefined : "Starts once nightly price collection is live"}
        />
        <Stat
          label="On sale"
          value={event.onSaleDate ? formatEventDate(event.onSaleDate) : "Not listed"}
        />
        <Stat
          label="Presale"
          value={event.presaleDate ? formatEventDate(event.presaleDate) : "Not listed"}
        />
      </dl>

      <section className="mt-10">
        <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500">
          Where to buy
        </h2>
        {/* Two columns on a phone so all four fit above the fold without
            scrolling; four across from 640px. */}
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {buyLinks.map((link) => (
            <a
              key={link.name}
              href={link.url}
              target="_blank"
              rel="noreferrer noopener"
              className="border border-zinc-800 bg-zinc-900 px-4 py-3 text-center text-sm font-semibold text-zinc-200 transition-colors hover:border-zinc-600 hover:text-zinc-50"
            >
              {link.name}
            </a>
          ))}
        </div>
        <p className="mt-3 text-xs leading-relaxed text-zinc-600">
          Links open a pre-filled search on each marketplace. Front Row does not
          sell tickets.
        </p>
      </section>
    </Shell>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="bg-zinc-950 p-5">
      <dt className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{label}</dt>
      <dd className="mt-2 text-xl font-bold text-zinc-50">{value}</dd>
      {hint && <p className="mt-1 text-xs text-zinc-600">{hint}</p>}
    </div>
  );
}

function Shell({ children }: { children: ReactNode }) {
  return <div className="mx-auto max-w-4xl px-4 py-10 sm:py-14">{children}</div>;
}

function DetailSkeleton() {
  return (
    <Shell>
      <div className="mb-8 aspect-video w-full animate-pulse bg-zinc-900 sm:aspect-[21/9]" />
      <div className="h-3 w-40 animate-pulse bg-zinc-900" />
      <div className="mt-4 h-9 w-4/5 animate-pulse bg-zinc-900" />
      <div className="mt-4 h-5 w-2/3 animate-pulse bg-zinc-900" />
      <div className="mt-10 h-28 w-full animate-pulse bg-zinc-900" />
    </Shell>
  );
}
