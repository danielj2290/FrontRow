import { Link, NavLink } from "react-router";
import { GENRES } from "../utils/genres.ts";
import { LocationPicker } from "./LocationPicker.tsx";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-canvas/90 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4">
        {/* Two rows on purpose. Cramming the wordmark, seven genres and a
            location box into one row does not survive 375px. */}
        <div className="flex items-center justify-between gap-4 py-3">
          <Link
            to="/"
            className="shrink-0 text-lg font-extrabold uppercase tracking-tight text-fg"
          >
            Front Row
          </Link>
          <LocationPicker />
        </div>

        {/* Horizontally scrollable on a phone rather than wrapping — keeps the
            header one consistent height at every width. */}
        <nav className="-mx-1 flex gap-1 overflow-x-auto pb-2">
          {GENRES.map((genre) => (
            <NavLink
              key={genre.slug}
              to={`/genre/${genre.slug}`}
              className={({ isActive }) =>
                `shrink-0 px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-line text-fg"
                    : "text-fg-muted hover:bg-surface hover:text-fg"
                }`
              }
            >
              {genre.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
