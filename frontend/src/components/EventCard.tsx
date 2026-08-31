import { Link } from "react-router";
import type { EventSummary } from "../types/event.ts";
import { formatEventDate, formatEventTime, formatPrice, formatVenue } from "../utils/format.ts";

export function EventCard({ event }: { event: EventSummary }) {
  const price = formatPrice(event.getInPrice);
  const time = formatEventTime(event.eventDate);

  return (
    <Link
      to={`/event/${event.id}`}
      className="group block bg-zinc-950 transition-colors hover:bg-zinc-900"
    >
      {/* Fixed aspect ratio so cards align in a grid even while images load or
          when an event has no photo at all. */}
      <div className="aspect-video overflow-hidden bg-zinc-900">
        {event.imageUrl ? (
          <img
            src={event.imageUrl}
            alt={event.artist ?? event.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          // Text placeholder rather than an icon — it tells you WHICH event has
          // no photo, which an icon cannot.
          <div className="flex h-full items-center justify-center px-4">
            <span className="line-clamp-2 text-center text-sm font-medium uppercase tracking-widest text-zinc-700">
              {event.artist ?? event.title}
            </span>
          </div>
        )}
      </div>

      <div className="p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-green-400">
          {formatEventDate(event.eventDate)}
          {time ? ` \u00b7 ${time}` : ""}
        </p>

        <h3 className="mt-2 line-clamp-2 text-base font-semibold leading-snug text-zinc-50">
          {event.title}
        </h3>

        <p className="mt-1 line-clamp-1 text-sm text-zinc-400">{formatVenue(event.venue)}</p>

        <div className="mt-4 flex items-baseline justify-between border-t border-zinc-800 pt-3">
          {price ? (
            <>
              <span className="text-xs uppercase tracking-wide text-zinc-500">Get-in</span>
              <span className="text-lg font-bold text-zinc-50">{price}</span>
            </>
          ) : (
            // Honest placeholder rather than $0 or a dash. Resale pricing is
            // gated until the Week 3 bot starts writing snapshots.
            <span className="text-xs uppercase tracking-wide text-zinc-600">
              Price tracking soon
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
