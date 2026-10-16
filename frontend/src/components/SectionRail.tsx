/**
 * Jump links for a long page, with the current section highlighted.
 *
 * Anchor links rather than scroll handlers: the browser already knows how to
 * jump to an id, it works with the back button, and each section ends up with
 * a shareable url.
 *
 * Sticky on desktop so it stays reachable while reading; a horizontal strip on
 * a phone, where a vertical rail would eat half the width.
 */
export function SectionRail({
  sections,
  activeId,
}: {
  sections: { id: string; label: string }[];
  activeId: string;
}) {
  return (
    <nav aria-label="Sections" className="lg:w-44 lg:shrink-0">
      <ul className="-mx-1 flex gap-1 overflow-x-auto lg:sticky lg:top-32 lg:mx-0 lg:flex-col lg:gap-0 lg:overflow-visible">
        {sections.map((section) => {
          const isActive = section.id === activeId;
          return (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                aria-current={isActive ? "true" : undefined}
                className={`block shrink-0 whitespace-nowrap px-3 py-2 text-sm font-semibold uppercase tracking-wide transition-colors lg:border-l-2 lg:px-4 ${
                  isActive
                    ? "bg-surface text-fg lg:border-accent lg:bg-transparent lg:text-accent"
                    : "text-fg-subtle hover:text-fg lg:border-line"
                }`}
              >
                {section.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
