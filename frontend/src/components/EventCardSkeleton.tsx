// Shown while a request is in flight. Matching the real card's shape keeps the
// layout from jumping when results arrive.
export function EventCardSkeleton() {
  return (
    <div className="bg-canvas">
      <div className="aspect-video animate-pulse bg-surface" />
      <div className="space-y-3 p-4">
        <div className="h-3 w-1/3 animate-pulse bg-surface" />
        <div className="h-4 w-4/5 animate-pulse bg-surface" />
        <div className="h-3 w-3/5 animate-pulse bg-surface" />
        <div className="mt-5 h-3 w-1/2 animate-pulse bg-surface" />
      </div>
    </div>
  );
}
