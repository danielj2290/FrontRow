import { useEffect, useState, type FormEvent } from "react";
import { ALL_CITIES, useLocation } from "../context/locationContext.ts";
import { SUGGESTED_CITIES } from "../utils/cities.ts";

export function LocationPicker() {
  const { city, setCity } = useLocation();
  const [draft, setDraft] = useState(city);

  // Keep the box in step if the city changes elsewhere.
  useEffect(() => setDraft(city), [city]);

  function commit(event: FormEvent) {
    event.preventDefault();
    setCity(draft);
  }

  return (
    <form onSubmit={commit} className="flex shrink-0 items-center gap-2">
      <label htmlFor="location" className="hidden text-xs uppercase tracking-wider text-zinc-500 sm:block">
        Near
      </label>

      {/* A plain input with a datalist rather than a select: people should be
          able to type any city, while the common markets stay one click away. */}
      <input
        id="location"
        list="city-suggestions"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        // Committing on blur as well as submit means clicking a datalist
        // suggestion applies immediately, without also pressing Enter.
        onBlur={() => setCity(draft)}
        placeholder="All cities"
        className="w-32 border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none sm:w-40"
      />

      <datalist id="city-suggestions">
        {SUGGESTED_CITIES.map((suggestion) => (
          <option key={suggestion} value={suggestion} />
        ))}
      </datalist>

      {city !== ALL_CITIES && (
        <button
          type="button"
          onClick={() => setCity(ALL_CITIES)}
          className="shrink-0 px-2 py-1.5 text-xs font-medium uppercase tracking-wide text-zinc-500 transition-colors hover:text-zinc-200"
        >
          Clear
        </button>
      )}
    </form>
  );
}
