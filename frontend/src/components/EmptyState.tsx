// One component for every "nothing to show" screen — no results, an error, or
// the state before a search has run. Text only: an icon or emoji here reads as
// decoration rather than information.
export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="border border-dashed border-line px-6 py-16 text-center">
      <h2 className="text-lg font-semibold text-fg">{title}</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-fg0">{body}</p>
    </div>
  );
}
