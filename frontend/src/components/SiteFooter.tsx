import { Link } from "react-router";
import { GENRES } from "../utils/genres.ts";

/**
 * Closes the page. Without one the layout just stops after the last card,
 * which is the clearest signal that a site is unfinished.
 *
 * It also does real work: it states plainly that Front Row does not sell
 * tickets, and it names where the price data comes from. Both are things a
 * visitor will wonder about and neither belongs in the middle of a search.
 */
export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-24 border-t border-line bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-12">
        {/* One column on a phone, three from 640px */}
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-3">
          <div>
            <Link
              to="/"
              className="text-lg font-extrabold uppercase tracking-tight text-fg"
            >
              Front Row
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-fg-muted">
              Concert ticket price tracking and drop prediction. Concerts only —
              no sports, no theater.
            </p>
          </div>

          <nav aria-label="Browse genres">
            <h2 className="text-xs font-bold uppercase tracking-widest text-fg-subtle">
              Browse
            </h2>
            <ul className="mt-4 space-y-2">
              {GENRES.map((genre) => (
                <li key={genre.slug}>
                  <Link
                    to={`/genre/${genre.slug}`}
                    className="text-sm text-fg-muted transition-colors hover:text-accent-hover"
                  >
                    {genre.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-fg-subtle">
              About the data
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-fg-muted">
              Event data from SeatGeek and Ticketmaster. Artist photos from
              Spotify. Prices are collected nightly and are estimates, not
              offers.
            </p>
            <a
              href="https://github.com/danielj2290/FrontRow"
              target="_blank"
              rel="noreferrer noopener"
              className="mt-4 inline-block text-sm font-medium text-accent transition-colors hover:text-accent-hover"
            >
              Source on GitHub
            </a>
          </div>
        </div>

        <div className="mt-12 border-t border-line pt-6">
          <p className="text-xs text-fg-subtle">
            {year} Front Row. Not affiliated with any ticket marketplace. Front
            Row does not sell tickets — every buy link sends you to the
            marketplace itself.
          </p>
        </div>
      </div>
    </footer>
  );
}
