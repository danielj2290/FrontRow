import { useState, type FormEvent } from "react";

interface SearchBarProps {
  onSearch: (artist: string, city: string) => void;
  disabled: boolean;
}

export function SearchBar({ onSearch, disabled }: SearchBarProps) {
  const [artist, setArtist] = useState("");
  const [city, setCity] = useState("");

  // The API rejects a search with neither field, so block it here too rather
  // than making the user wait for a round trip to learn that.
  const canSubmit = artist.trim().length > 0 || city.trim().length > 0;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit || disabled) return;
    onSearch(artist, city);
  }

  return (
    // Stacked on mobile, side by side from 640px up. Mobile-first per the
    // project rules: the base classes ARE the 375px layout.
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
      <input
        type="text"
        value={artist}
        onChange={(event) => setArtist(event.target.value)}
        placeholder="Artist — e.g. Zach Bryan"
        aria-label="Artist"
        className="min-w-0 flex-1 rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 text-base text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none"
      />
      <input
        type="text"
        value={city}
        onChange={(event) => setCity(event.target.value)}
        placeholder="City — e.g. Denver"
        aria-label="City"
        className="min-w-0 flex-1 rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 text-base text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none"
      />
      <button
        type="submit"
        disabled={!canSubmit || disabled}
        className="rounded-lg bg-green-500 px-6 py-3 text-base font-semibold text-green-950 transition-colors hover:bg-green-400 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
      >
        {disabled ? "Searching…" : "Search"}
      </button>
    </form>
  );
}
