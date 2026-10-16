import { Link } from "react-router";
import type { Tour } from "../types/tour.ts";
import { ImageWithFallback } from "./ui/ImageWithFallback.tsx";
import { Badge } from "./ui/Badge.tsx";
import { formatEventDate } from "../utils/format.ts";

/**
 * One tour, not one date.
 *
 * This is the component that fixes the old browse experience. Olivia Rodrigo
 * playing thirty arenas used to be thirty near-identical rows; here it is one
 * panel that says "32 dates, Mar 4 to Jun 18, 6 cities" and links through to
 * the artist page where every date is listed.
 */
export function TourCard({ tour }: { tour: Tour }) {
  // "Mar 4" rather than "Mar 4, 2027" in the range — the year is repeated
  // noise when both ends usually sit inside the same one.
  const range =
    tour.dateCount === 1
      ? formatEventDate(tour.firstDate)
      : `${formatEventDate(tour.firstDate)} — ${formatEventDate(tour.lastDate)}`;

  return (
    <Link
      to={`/artist/${encodeURIComponent(tour.artist)}`}
      className="group block bg-canvas transition-colors hover:bg-surface-hover"
    >
      <div className="relative">
        <ImageWithFallback
          src={tour.imageUrl}
          alt={tour.artist}
          fallbackText={tour.artist}
          className="aspect-[3/2]"
          imageClassName="transition-transform duration-300 group-hover:scale-105"
        />

        {/* Over the image rather than beside it: the score is the reason this
            card is here, so it should be readable before anything else. */}
        <div className="absolute left-0 top-0 bg-accent px-2.5 py-1.5">
          <span className="text-sm font-extrabold tabular-nums text-accent-fg">
            {tour.hypeScore}
          </span>
        </div>
      </div>

      <div className="p-4">
        <h3 className="line-clamp-1 text-base font-bold text-fg">{tour.artist}</h3>

        <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-accent">
          {tour.dateCount === 1 ? "1 date" : `${tour.dateCount} dates`}
        </p>

        <p className="mt-2 text-sm text-fg-muted">{range}</p>

        {tour.cities.length > 0 && (
          <p className="mt-1 line-clamp-1 text-sm text-fg-subtle">
            {tour.cities.slice(0, 3).join(" · ")}
            {tour.cities.length > 3 ? ` +${tour.cities.length - 3}` : ""}
          </p>
        )}

        <div className="mt-4 border-t border-line pt-3">
          <Badge variant="outline">{sizeLabel(tour.size)}</Badge>
        </div>
      </div>
    </Link>
  );
}

function sizeLabel(size: Tour["size"]): string {
  if (size === "large") return "Arena";
  if (size === "medium") return "Theatre";
  return "Club";
}
