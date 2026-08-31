import { useCallback, useEffect, useState, type ReactNode } from "react";
import { DEFAULT_CITY, LocationContext, STORAGE_KEY } from "./locationContext.ts";

// localStorage throws outright in some contexts (private windows, embedded
// previews, browsers set to block site data), so every access is guarded and
// falls back to the default rather than blanking the page.
function readStoredCity(): string {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === null ? DEFAULT_CITY : stored;
  } catch {
    return DEFAULT_CITY;
  }
}

export function LocationProvider({ children }: { children: ReactNode }) {
  const [city, setCityState] = useState<string>(readStoredCity);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, city);
    } catch {
      // Not being able to remember the choice is a minor inconvenience, never
      // a reason to break the page.
    }
  }, [city]);

  const setCity = useCallback((next: string) => setCityState(next.trim()), []);

  return <LocationContext.Provider value={{ city, setCity }}>{children}</LocationContext.Provider>;
}
