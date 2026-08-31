import { useCallback, useRef, useState } from "react";
import type { EventSearchResponse, EventSummary } from "../types/event.ts";

// "idle" is a real state, not a loading state: before the first search there is
// nothing to show and no spinner to justify. The page renders a prompt instead.
export type SearchStatus = "idle" | "loading" | "success" | "error";

export function useEventSearch() {
  const [status, setStatus] = useState<SearchStatus>("idle");
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Holds the in-flight request. Without this, a slow earlier search can resolve
  // AFTER a faster later one and overwrite the newer results — the classic race
  // where you type "drake", then "adele", and end up looking at Drake shows.
  const activeRequest = useRef<AbortController | null>(null);

  const search = useCallback(async (artist: string, city: string) => {
    activeRequest.current?.abort();
    const controller = new AbortController();
    activeRequest.current = controller;

    setStatus("loading");
    setError(null);

    const params = new URLSearchParams();
    if (artist.trim()) params.set("artist", artist.trim());
    if (city.trim()) params.set("city", city.trim());
    params.set("limit", "24");

    try {
      // Relative path on purpose: in dev the Vite proxy forwards /api to the
      // backend, and in production vercel.json rewrites it to EC2. Same code,
      // both environments, no base-URL config to keep in sync.
      const response = await fetch(`/api/events?${params}`, { signal: controller.signal });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? `Search failed (${response.status})`);
      }

      const data = (await response.json()) as EventSearchResponse;
      setEvents(data.events);
      setStatus("success");
    } catch (caught) {
      // An aborted request was superseded by a newer one — leave the state alone
      // and let the newer request finish rendering.
      if (controller.signal.aborted) return;

      setError(caught instanceof Error ? caught.message : "Something went wrong.");
      setStatus("error");
    }
  }, []);

  return { status, events, error, search };
}
