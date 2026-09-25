import type { ReactNode } from "react";
import { useParams } from "react-router";
import { useApi } from "../hooks/useApi.ts";
import type { EventSummary } from "../types/event.ts";
import { EmptyState } from "../components/EmptyState.tsx";
import { Badge } from "../components/ui/Badge.tsx";
import { ButtonLink } from "../components/ui/Button.tsx";
import { ImageWithFallback } from "../components/ui/ImageWithFallback.tsx";
import { BackLink } from "../components/ui/BackLink.tsx";
import { buildBuyLinks } from "../utils/buyLinks.ts";
import { formatEventDate, formatEventTime, formatPrice, formatVenue } from "../utils/format.ts";

export function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { status, data: event, error } = useApi<EventSummary>(id ? `/api/events/${id}` : null);

  if (status === "loading" || status === "idle") return <DetailSkeleton />;

  if (status === "error" || !event) {
    return (
      <Shell>
        <BackLink />
        <div className="mt-8">
          <EmptyState
            title="Event not found"
            body={error ?? "We could not load this event. It may have been removed."}
          />
        </div>
      </Shell>
    );
  }

  const time = formatEventTime(event.eventDate);
  const price = formatPrice(event.getInPrice);
  const buyLinks = buildBuyLinks(event);

  return (
    <Shell>
      <BackLink />

      <div className="mt-8 aspect-video w-full sm:aspect-[21/9]">
        <ImageWithFallback
          src={event.imageUrl}
          alt={event.artist ?? event.title}
          fallbackText={event.artist ?? event.title}
          className="h-full w-full"
        />
      </div>

      <p className="mt-8 text-sm font-semibold uppercase tracking-wider text-accent">
        {formatEventDate(event.eventDate)}
        {time ? ` \u00b7 ${time}` : ""}
      </p>

      <h1 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight text-fg sm:text-4xl">
        {event.title}
      </h1>

      <p className="mt-3 text-lg text-fg-muted">{formatVenue(event.venue)}</p>

      {event.genres.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {event.genres.slice(0, 4).map((genre) => (
            <Badge key={genre} variant="accent">
              {genre}
            </Badge>
          ))}
        </div>
      )}

      {event.artist && (
        <div className="mt-6">
          <ButtonLink
            to={`/artist/${encodeURIComponent(event.artist)}`}
            variant="secondary"
            size="sm"
          >
            More from {event.artist}
          </ButtonLink>
        </div>
      )}

      <dl className="mt-12 grid grid-cols-1 gap-px border border-line bg-line sm:grid-cols-3">
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

      <section className="mt-12">
        <h2 className="text-sm font-bold uppercase tracking-widest text-fg-subtle">
          Where to buy
        </h2>
        {/* Two columns on a phone so all four fit above the fold without
            scrolling; four across from 640px. */}
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {buyLinks.map((link) => (
            <ButtonLink key={link.name} to={link.url} external variant="secondary" fullWidth>
              {link.name}
            </ButtonLink>
          ))}
        </div>
        <p className="mt-4 text-xs leading-relaxed text-fg-subtle">
          Links open a pre-filled search on each marketplace. Front Row does not
          sell tickets.
        </p>
      </section>
    </Shell>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="bg-canvas p-5">
      <dt className="text-xs font-semibold uppercase tracking-wider text-fg-subtle">{label}</dt>
      <dd className="mt-2 text-xl font-bold text-fg">{value}</dd>
      {hint && <p className="mt-1 text-xs text-fg-subtle">{hint}</p>}
    </div>
  );
}

function Shell({ children }: { children: ReactNode }) {
  return <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12">{children}</div>;
}

function DetailSkeleton() {
  return (
    <Shell>
      <div className="h-4 w-16 animate-pulse bg-surface" />
      <div className="mt-8 aspect-video w-full animate-pulse bg-surface sm:aspect-[21/9]" />
      <div className="mt-8 h-3 w-40 animate-pulse bg-surface" />
      <div className="mt-4 h-9 w-4/5 animate-pulse bg-surface" />
      <div className="mt-4 h-5 w-2/3 animate-pulse bg-surface" />
      <div className="mt-12 h-28 w-full animate-pulse bg-surface" />
    </Shell>
  );
}
