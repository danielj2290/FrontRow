import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router";

/**
 * Remembers where you were on each page and puts you back there.
 *
 * React Router's own <ScrollRestoration> only works with a data router; this
 * app uses plain <BrowserRouter>, so it needs doing by hand.
 *
 * WHY it matters: without this, scrolling through forty search results,
 * opening one, and pressing back drops you at the top of the list with no idea
 * where you were. It reads as the site losing your place — which it is.
 *
 * The rule is different per navigation type:
 *   POP  (back/forward) → restore the saved position
 *   PUSH (a new page)   → start at the top, like any new page
 */
const STORAGE_PREFIX = "frontrow.scroll.";

export function ScrollRestoration() {
  const location = useLocation();
  const navigationType = useNavigationType();

  // Save on the way out. The cleanup runs just before the location changes,
  // which is the last moment the old page's scroll position still exists.
  useEffect(() => {
    const key = STORAGE_PREFIX + location.key;

    return () => {
      try {
        window.sessionStorage.setItem(key, String(window.scrollY));
      } catch {
        // Private windows and blocked site data throw here. Losing the scroll
        // position is a small annoyance; a crash is not acceptable.
      }
    };
  }, [location.key]);

  // Restore (or reset) on the way in.
  useEffect(() => {
    if (navigationType !== "POP") {
      window.scrollTo(0, 0);
      return;
    }

    try {
      const saved = window.sessionStorage.getItem(STORAGE_PREFIX + location.key);
      // Wait a frame: on a back navigation the new page has not painted yet,
      // so the document is still too short to scroll to the saved offset.
      requestAnimationFrame(() => window.scrollTo(0, saved ? Number(saved) : 0));
    } catch {
      window.scrollTo(0, 0);
    }
  }, [location.key, navigationType]);

  return null;
}
