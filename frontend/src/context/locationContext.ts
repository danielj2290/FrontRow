import { createContext, useContext } from "react";

// Ticketmaster-style: location is app-wide state, not a field on the search
// form. Every list — search results, genre browse — is scoped to it, which is
// what stops one artist's twelve tour dates from filling the whole grid.
export const STORAGE_KEY = "frontrow.city";
export const DEFAULT_CITY = "Los Angeles";

// Empty string means "everywhere" — the backend simply omits the city filter.
export const ALL_CITIES = "";

export interface LocationValue {
  city: string;
  setCity: (city: string) => void;
}

export const LocationContext = createContext<LocationValue | null>(null);

export function useLocation(): LocationValue {
  const value = useContext(LocationContext);
  if (!value) throw new Error("useLocation must be used inside a LocationProvider");
  return value;
}
