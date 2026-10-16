import { Link } from "react-router";
import type { HypedPresale } from "../types/tour.ts";
import { ImageWithFallback } from "./ui/ImageWithFallback.tsx";
import { Badge } from "./ui/Badge.tsx";
import { formatEventDate } from "../utils/format.ts";

/**
 * A presale window someone can act on.
 *
 * The deadline is the whole point, so it leads: either "live now" or how long
 * until it opens. Everything else is context for deciding whether to care.
 */
export function PresaleCard({ presale }: { presale: HypedPresale }) {
  return (
    <Link
      to={`/event/${presale.id}`}
      className="group flex gap-4 bg-canvas p-4 transition-colors hover:bg-surface-hover"
    >
      <ImageWithFallback
        src={presale.imageUrl}
        alt={presale.artist}
        fallbackText={presale.artist}
        className="h-20 w-20 shrink-0"
        imageClassName="transition-transform duration-300 group-hover:scale-105"
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {presale.isLive ? (
            <Badge variant="accent">Live now</Badge>
          ) : (
            <Badge variant="outline">{countdown(presale.presaleStart)}</Badge>
          )}
        </div>

        <h3 className="mt-2 line-clamp-1 text-base font-bold text-fg">{presale.artist}</h3>

        <p className="mt-1 line-clamp-1 text-sm text-fg-muted">
          {presale.presaleName}
        </p>

        <p className="mt-1 line-clamp-1 text-sm text-fg-subtle">
          {formatEventDate(presale.eventDate)}{" · "}{presale.city}
        </p>
      </div>
    </Link>
  );
}

/**
 * "In 3 days" / "In 5 hours" — a relative deadline is far easier to act on
 * than an absolute timestamp, which the reader has to subtract from today.
 */
function countdown(startIso: string): string {
  const ms = new Date(startIso).getTime() - Date.now();
  if (Number.isNaN(ms) || ms <= 0) return "Opening now";

  const hours = Math.round(ms / 3_600_000);
  if (hours < 1) return "In under an hour";
  if (hours < 24) return `In ${hours} ${hours === 1 ? "hour" : "hours"}`;

  const days = Math.round(hours / 24);
  return `In ${days} ${days === 1 ? "day" : "days"}`;
}
