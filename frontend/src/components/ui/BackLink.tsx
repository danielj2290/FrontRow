import { Link, useNavigate } from "react-router";

/**
 * "Back" that behaves correctly in both cases.
 *
 * If the visitor arrived here from inside the app there is history to pop, and
 * popping returns them to their exact scroll position in the results they were
 * browsing. If they arrived cold — a shared link, a search engine — there is
 * nothing to pop, so going "back" would leave the site entirely. In that case
 * we send them somewhere useful instead.
 */
export function BackLink({
  fallbackTo = "/",
  label = "Back",
}: {
  fallbackTo?: string;
  label?: string;
}) {
  const navigate = useNavigate();

  // A fresh tab has length 1 — this page and nothing before it.
  const hasHistory = window.history.length > 1;

  const className =
    "inline-flex items-center gap-2 text-sm font-medium text-fg-muted transition-colors hover:text-accent-hover";

  if (!hasHistory) {
    return (
      <Link to={fallbackTo} className={className}>
        <Arrow />
        {label}
      </Link>
    );
  }

  return (
    <button type="button" onClick={() => navigate(-1)} className={className}>
      <Arrow />
      {label}
    </button>
  );
}

// Inline SVG rather than an emoji or an icon font: it inherits currentColor,
// scales cleanly, and adds no network request. Per the design rules, no emoji.
function Arrow() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M10 3L5 8l5 5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="square"
      />
    </svg>
  );
}
