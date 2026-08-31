// Shown while a search is in flight. Matching the real card's shape keeps the
// layout from jumping when results arrive.
export function EventCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/60">
      <div className="aspect-video animate-pulse bg-zinc-800" />
      <div className="space-y-2.5 p-4">
        <div className="h-3 w-1/3 animate-pulse rounded bg-zinc-800" />
        <div className="h-4 w-4/5 animate-pulse rounded bg-zinc-800" />
        <div className="h-3 w-3/5 animate-pulse rounded bg-zinc-800" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-zinc-800 !mt-5" />
      </div>
    </div>
  );
}
