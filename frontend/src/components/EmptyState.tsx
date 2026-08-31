// One component for every "nothing to show" screen — no results, an error, or
// the state before a search has run. Text only: an icon or emoji here reads as
// decoration rather than information.
export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="border border-dashed border-zinc-800 px-6 py-16 text-center">
      <h2 className="text-lg font-semibold text-zinc-200">{title}</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-zinc-500">{body}</p>
    </div>
  );
}
