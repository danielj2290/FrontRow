import { Link, NavLink } from "react-router";
import { GENRES } from "../utils/genres.ts";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-4">
        <Link
          to="/"
          className="shrink-0 text-lg font-extrabold uppercase tracking-tight text-zinc-50"
        >
          Front Row
        </Link>

        {/* Horizontally scrollable on a phone rather than wrapping to a second
            row — keeps the header one consistent height at every width. */}
        <nav className="-mx-1 flex flex-1 gap-1 overflow-x-auto">
          {GENRES.map((genre) => (
            <NavLink
              key={genre.slug}
              to={`/genre/${genre.slug}`}
              className={({ isActive }) =>
                `shrink-0 px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-zinc-800 text-zinc-50"
                    : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
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
