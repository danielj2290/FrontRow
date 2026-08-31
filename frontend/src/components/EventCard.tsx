import type { EventSummary } from "../types/event.ts";
import { formatEventDate, formatEventTime, formatPrice, formatVenue } from "../utils/format.ts";

export function EventCard({ event }: { event: EventSummary }) {
  const price = formatPrice(event.getInPrice);
  const time = formatEventTime(event.eventDate);

  return (
    <article className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/60 transition-colors hover:border-zinc-700">
      {/* Fixed aspect ratio so cards line up in a grid even while images load
          or when an event has no photo at all. */}
      <div className="aspect-video bg-zinc-800">
        {event.imageUrl ? (
          <img
            src={event.imageUrl}
            alt={event.artist ?? event.title}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-3xl" aria-hidden>
            🎤
          </div>
        )}
      </div>

      <div className="p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-green-400">
          {formatEventDate(event.eventDate)}
          {time ? ` · ${time}` : ""}
        </p>

        <h3 className="mt-1.5 line-clamp-2 text-base font-semibold text-zinc-50">
          {event.title}
        </h3>

        <p className="mt-1 line-clamp-1 text-sm text-zinc-400">{formatVenue(event.venue)}</p>

        <div className="mt-3 flex items-baseline justify-between border-t border-zinc-800 pt-3">
          {price ? (
            <>
              <span className="text-xs text-zinc-500">Get-in price</span>
              <span className="text-lg font-bold text-zinc-50">{price}</span>
            </>
          ) : (
            // Honest empty state rather than "$0" or a dash. Resale pricing is
            // gated behind partner API access, so this stays blank until the
            // Week 3 bot starts writing snapshots.
            <span className="text-xs text-zinc-500">Price tracking starts soon</span>
          )}
        </div>
      </div>
    </article>
  );
}
