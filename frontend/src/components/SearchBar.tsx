import { useEffect, useState, type FormEvent } from "react";

interface SearchBarProps {
  onSearch: (artist: string, city: string) => void;
  disabled: boolean;
  initialArtist?: string;
  initialCity?: string;
}

export function SearchBar({
  onSearch,
  disabled,
  initialArtist = "",
  initialCity = "",
}: SearchBarProps) {
  const [artist, setArtist] = useState(initialArtist);
  const [city, setCity] = useState(initialCity);

  // Keep the inputs in step with the URL, so arriving via a shared link or
  // pressing the back button shows the terms that produced these results.
  useEffect(() => setArtist(initialArtist), [initialArtist]);
  useEffect(() => setCity(initialCity), [initialCity]);

  // The API rejects a search with neither field, so block it here rather than
  // making the user wait for a round trip to find that out.
  const canSubmit = artist.trim().length > 0 || city.trim().length > 0;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit || disabled) return;
    onSearch(artist, city);
  }

  const inputClass =
    "min-w-0 flex-1 border border-zinc-800 bg-zinc-900 px-4 py-3 text-base text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none";

  return (
    // Stacked on mobile, side by side from 640px up. Mobile-first per the
    // project rules: the base classes ARE the 375px layout.
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
      <input
        type="text"
        value={artist}
        onChange={(event) => setArtist(event.target.value)}
        placeholder="Artist"
        aria-label="Artist"
        className={inputClass}
      />
      <input
        type="text"
        value={city}
        onChange={(event) => setCity(event.target.value)}
        placeholder="City"
        aria-label="City"
        className={inputClass}
      />
      <button
        type="submit"
        disabled={!canSubmit || disabled}
        className="bg-green-500 px-8 py-3 text-base font-bold uppercase tracking-wide text-green-950 transition-colors hover:bg-green-400 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {disabled ? "Searching" : "Search"}
      </button>
    </form>
  );
}
