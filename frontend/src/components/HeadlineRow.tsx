import type { Headline } from "../types/news.ts";

/**
 * One music headline, linking out to the publisher.
 *
 * Deliberately text-only. These are other people's articles — reproducing
 * their images would be both a bandwidth favour we are not owed and a
 * copyright question nobody needs. The source and age are what let a reader
 * decide whether to click.
 */
export function HeadlineRow({ headline }: { headline: Headline }) {
  return (
    <a
      href={headline.link}
      target="_blank"
      rel="noreferrer noopener"
      className="group flex flex-col gap-2 bg-canvas p-4 transition-colors hover:bg-surface-hover sm:flex-row sm:items-baseline sm:justify-between sm:gap-6"
    >
      <p className="min-w-0 text-sm font-medium leading-snug text-fg transition-colors group-hover:text-accent-hover">
        {headline.title}
      </p>

      <p className="shrink-0 text-xs uppercase tracking-wide text-fg-subtle">
        {headline.source}
        {headline.publishedAt ? ` · ${timeAgo(headline.publishedAt)}` : ""}
      </p>
    </a>
  );
}

/** "3h ago" / "2d ago" — recency is the point of a news feed. */
function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(ms) || ms < 0) return "just now";

  const hours = Math.floor(ms / 3_600_000);
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
