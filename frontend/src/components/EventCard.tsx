import { Link } from "react-router";
import type { EventSummary } from "../types/event.ts";
import { ImageWithFallback } from "./ui/ImageWithFallback.tsx";
import { formatEventDate, formatEventTime, formatPrice, formatVenue } from "../utils/format.ts";

export function EventCard({ event }: { event: EventSummary }) {
  const price = formatPrice(event.getInPrice);
  const time = formatEventTime(event.eventDate);

  return (
    <Link
      to={`/event/${event.id}`}
      className="group block bg-canvas transition-colors hover:bg-surface-hover"
    >
      {/* Fixed aspect ratio so cards align in a grid even while images load or
          when an event has no photo at all. */}
      <ImageWithFallback
        src={event.imageUrl}
        alt={event.artist ?? event.title}
        fallbackText={event.artist ?? event.title}
        className="aspect-video"
        imageClassName="transition-transform duration-300 group-hover:scale-105"
      />

      <div className="p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent">
          {formatEventDate(event.eventDate)}
          {time ? ` \u00b7 ${time}` : ""}
        </p>

        <h3 className="mt-2 line-clamp-2 text-base font-semibold leading-snug text-fg">
          {event.title}
        </h3>

        <p className="mt-1 line-clamp-1 text-sm text-fg-muted">{formatVenue(event.venue)}</p>

        <div className="mt-4 flex items-baseline justify-between border-t border-line pt-3">
          {price ? (
            <>
              <span className="text-xs uppercase tracking-wide text-fg-subtle">Get-in</span>
              <span className="text-lg font-bold text-fg">{price}</span>
            </>
          ) : (
            // Honest placeholder rather than $0 or a dash. Resale pricing is
            // gated until the nightly bot starts writing snapshots.
            <span className="text-xs uppercase tracking-wide text-fg-subtle">
              Price tracking soon
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
