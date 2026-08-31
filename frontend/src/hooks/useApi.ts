import { useEffect, useState } from "react";

export type ApiStatus = "idle" | "loading" | "success" | "error";

/**
 * Declarative GET for pages whose data is determined by the URL.
 *
 * Pass null for `path` to stay idle — useful before a route param resolves.
 * The request is aborted on unmount or whenever `path` changes, so navigating
 * away mid-flight cannot set state on a component that no longer exists.
 */
export function useApi<T>(path: string | null) {
  const [status, setStatus] = useState<ApiStatus>(path ? "loading" : "idle");
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!path) {
      setStatus("idle");
      return;
    }

    const controller = new AbortController();
    setStatus("loading");
    setError(null);

    async function load() {
      try {
        const response = await fetch(path as string, { signal: controller.signal });

        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(body?.error ?? `Request failed (${response.status})`);
        }

        setData((await response.json()) as T);
        setStatus("success");
      } catch (caught) {
        if (controller.signal.aborted) return;
        setError(caught instanceof Error ? caught.message : "Something went wrong.");
        setStatus("error");
      }
    }

    void load();
    return () => controller.abort();
  }, [path]);

  return { status, data, error };
}
