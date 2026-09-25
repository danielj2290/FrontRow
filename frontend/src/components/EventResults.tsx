import type { EventSummary } from "../types/event.ts";
import { EventCard } from "./EventCard.tsx";
import { EventCardSkeleton } from "./EventCardSkeleton.tsx";
import { EventGrid } from "./EventGrid.tsx";
import { EmptyState } from "./EmptyState.tsx";

interface EventResultsProps {
  status: "idle" | "loading" | "success" | "error";
  events: EventSummary[];
  error: string | null;
  idleTitle?: string;
  idleBody?: string;
  emptyTitle?: string;
  emptyBody?: string;
}

/**
 * Every list of events — search, genre browse, an artist's upcoming shows —
 * renders through here so all three share the same loading, empty and error
 * behaviour. Each state is its own branch rather than nested ternaries.
 */
export function EventResults({
  status,
  events,
  error,
  idleTitle = "Search for a concert",
  idleBody = "Try an artist like Zach Bryan, a city like Denver, or both together.",
  emptyTitle = "No concerts found",
  emptyBody = "Nothing matched that search. Check the spelling, or try just the artist name.",
}: EventResultsProps) {
  if (status === "idle") {
    return <EmptyState title={idleTitle} body={idleBody} />;
  }

  if (status === "loading") {
    return (
      <EventGrid>
        {/* Six placeholders fills the fold on a phone and on a laptop */}
        {Array.from({ length: 6 }, (_, index) => (
          <EventCardSkeleton key={index} />
        ))}
      </EventGrid>
    );
  }

  if (status === "error") {
    return (
      <EmptyState
        title="Something went wrong"
        body={error ?? "The request failed. Try again in a moment."}
      />
    );
  }

  if (events.length === 0) {
    return <EmptyState title={emptyTitle} body={emptyBody} />;
  }

  return (
    <>
      <p className="mb-4 text-sm text-fg0">
        {events.length} {events.length === 1 ? "concert" : "concerts"}
      </p>
      <EventGrid>
        {events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </EventGrid>
    </>
  );
}
