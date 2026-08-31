import type { ReactNode } from "react";
import { SearchBar } from "../components/SearchBar.tsx";
import { EventCard } from "../components/EventCard.tsx";
import { EventCardSkeleton } from "../components/EventCardSkeleton.tsx";
import { useEventSearch } from "../hooks/useEventSearch.ts";

export function SearchPage() {
  const { status, events, error, search } = useEventSearch();

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* max-w keeps line lengths readable on desktop; px-4 is the 375px gutter */}
      <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Front Row <span aria-hidden>🎤</span>
          </h1>
          <p className="mt-2 max-w-md text-zinc-400">
            Search concerts by artist or city. Price tracking and drop
            predictions are on the way.
          </p>
        </header>

        <SearchBar onSearch={search} disabled={status === "loading"} />

        <div className="mt-8">
          <SearchResults status={status} events={events} error={error} />
        </div>
      </div>
    </main>
  );
}

// Split out so the page reads as a list of states rather than a pile of nested
// ternaries. Each branch is one screen the user can actually end up looking at.
function SearchResults({
  status,
  events,
  error,
}: {
  status: ReturnType<typeof useEventSearch>["status"];
  events: ReturnType<typeof useEventSearch>["events"];
  error: string | null;
}) {
  if (status === "idle") {
    return (
      <EmptyState
        emoji="🔍"
        title="Search for a concert"
        body="Try an artist like Zach Bryan, a city like Denver, or both together."
      />
    );
  }

  if (status === "loading") {
    return (
      <Grid>
        {/* Six placeholders fills the fold on a phone and on a laptop */}
        {Array.from({ length: 6 }, (_, index) => (
          <EventCardSkeleton key={index} />
        ))}
      </Grid>
    );
  }

  if (status === "error") {
    return (
      <EmptyState
        emoji="⚠️"
        title="Search failed"
        body={error ?? "Something went wrong. Try again in a moment."}
      />
    );
  }

  if (events.length === 0) {
    return (
      <EmptyState
        emoji="🫥"
        title="No concerts found"
        body="Nothing matched that search. Check the spelling, or try just the artist name."
      />
    );
  }

  return (
    <>
      <p className="mb-4 text-sm text-zinc-500">
        {events.length} {events.length === 1 ? "concert" : "concerts"}
      </p>
      <Grid>
        {events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </Grid>
    </>
  );
}

// One column on a phone, two from 640px, three from 1024px.
function Grid({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
  );
}

function EmptyState({ emoji, title, body }: { emoji: string; title: string; body: string }) {
  return (
    <div className="rounded-xl border border-dashed border-zinc-800 px-6 py-16 text-center">
      <div className="text-4xl" aria-hidden>
        {emoji}
      </div>
      <h2 className="mt-3 text-lg font-semibold text-zinc-200">{title}</h2>
      <p className="mx-auto mt-1 max-w-sm text-sm text-zinc-500">{body}</p>
    </div>
  );
}
