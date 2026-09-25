import { useEffect, useState, type FormEvent } from "react";

interface SearchBarProps {
  onSearch: (artist: string) => void;
  disabled: boolean;
  initialArtist?: string;
}

// Artist only. Location lives in the header picker so there is exactly one
// source of truth for it — two city inputs would beg the question of which
// one wins.
export function SearchBar({ onSearch, disabled, initialArtist = "" }: SearchBarProps) {
  const [artist, setArtist] = useState(initialArtist);

  // Keep the input in step with the URL, so arriving via a shared link or
  // pressing back shows the term that produced these results.
  useEffect(() => setArtist(initialArtist), [initialArtist]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (disabled) return;
    onSearch(artist);
  }

  return (
    // Stacked on mobile, side by side from 640px. Mobile-first per the project
    // rules: the base classes ARE the 375px layout.
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
      <input
        type="text"
        value={artist}
        onChange={(event) => setArtist(event.target.value)}
        placeholder="Search an artist"
        aria-label="Artist"
        className="min-w-0 flex-1 border border-line bg-surface px-4 py-3 text-base text-fg placeholder:text-fg-subtle focus:border-accent focus:outline-none"
      />
      <button
        type="submit"
        disabled={disabled}
        className="bg-accent px-8 py-3 text-base font-bold uppercase tracking-wide text-accent-fg transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
      >
        {disabled ? "Searching" : "Search"}
      </button>
    </form>
  );
}
