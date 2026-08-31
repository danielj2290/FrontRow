import { useEffect } from "react";
import { useSearchParams } from "react-router";
import { SearchBar } from "../components/SearchBar.tsx";
import { EventResults } from "../components/EventResults.tsx";
import { useEventSearch } from "../hooks/useEventSearch.ts";
import { ALL_CITIES, useLocation } from "../context/locationContext.ts";

export function SearchPage() {
  // The search TERM lives in the URL so results are shareable and the back
  // button walks previous searches. The CITY does not: it is a per-visitor
  // preference from the header, so a link you send someone opens in their
  // city, not yours.
  const [searchParams, setSearchParams] = useSearchParams();
  const artist = searchParams.get("artist") ?? "";
  const { city } = useLocation();

  const { status, events, error, search } = useEventSearch();

  // Re-runs when the term OR the city changes, so switching cities in the
  // header refreshes the current results rather than leaving them stale.
  useEffect(() => {
    if (artist) search(artist, city);
  }, [artist, city, search]);

  function handleSearch(nextArtist: string) {
    const next = new URLSearchParams();
    if (nextArtist.trim()) next.set("artist", nextArtist.trim());
    setSearchParams(next);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Know when to buy.
        </h1>
        <p className="mt-3 max-w-md leading-relaxed text-zinc-400">
          {city === ALL_CITIES
            ? "Search concerts anywhere. Price tracking and drop predictions are on the way."
            : `Search concerts in ${city}. Change the city any time from the header.`}
        </p>
      </header>

      <SearchBar initialArtist={artist} onSearch={handleSearch} disabled={status === "loading"} />

      <div className="mt-10">
        <EventResults
          status={status}
          events={events}
          error={error}
          idleBody={
            city === ALL_CITIES
              ? "Try an artist like Zach Bryan."
              : `Try an artist like Zach Bryan. Results are limited to ${city}.`
          }
          emptyBody={
            city === ALL_CITIES
              ? "Nothing matched that search. Check the spelling."
              : `No shows in ${city}. Try another city, or clear the location in the header.`
          }
        />
      </div>
    </div>
  );
}
