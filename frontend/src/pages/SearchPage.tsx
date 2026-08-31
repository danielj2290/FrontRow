import { useEffect } from "react";
import { useSearchParams } from "react-router";
import { SearchBar } from "../components/SearchBar.tsx";
import { EventResults } from "../components/EventResults.tsx";
import { useEventSearch } from "../hooks/useEventSearch.ts";

export function SearchPage() {
  // Search terms live in the URL, not in component state. That makes results
  // shareable, bookmarkable, and survivable across a refresh — and the back
  // button walks through previous searches for free.
  const [searchParams, setSearchParams] = useSearchParams();
  const artist = searchParams.get("artist") ?? "";
  const city = searchParams.get("city") ?? "";

  const { status, events, error, search } = useEventSearch();

  // Re-run whenever the URL changes, including on a direct visit to a link
  // someone shared.
  useEffect(() => {
    if (artist || city) search(artist, city);
  }, [artist, city, search]);

  function handleSearch(nextArtist: string, nextCity: string) {
    const next = new URLSearchParams();
    if (nextArtist.trim()) next.set("artist", nextArtist.trim());
    if (nextCity.trim()) next.set("city", nextCity.trim());
    setSearchParams(next);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Know when to buy.
        </h1>
        <p className="mt-3 max-w-md leading-relaxed text-zinc-400">
          Search concerts by artist or city. Price tracking and drop predictions
          are on the way.
        </p>
      </header>

      <SearchBar
        initialArtist={artist}
        initialCity={city}
        onSearch={handleSearch}
        disabled={status === "loading"}
      />

      <div className="mt-10">
        <EventResults status={status} events={events} error={error} />
      </div>
    </div>
  );
}
