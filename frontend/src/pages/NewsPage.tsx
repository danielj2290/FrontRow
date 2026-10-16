import { useEffect, useRef, useState, type ReactNode } from "react";
import { useApi } from "../hooks/useApi.ts";
import type { NewsResponse } from "../types/news.ts";
import { TourCard } from "../components/TourCard.tsx";
import { PresaleCard } from "../components/PresaleCard.tsx";
import { HeadlineRow } from "../components/HeadlineRow.tsx";
import { EmptyState } from "../components/EmptyState.tsx";
import { SectionRail } from "../components/SectionRail.tsx";
import { ALL_CITIES, useLocation } from "../context/locationContext.ts";

// Ids are shared with the rail so its links and the scroll spy agree. Keeping
// them in one array means adding a section cannot leave the nav out of step.
const SECTIONS = [
  { id: "announced", label: "Just Announced" },
  { id: "presales", label: "Presales" },
  { id: "headlines", label: "Headlines" },
];

export function NewsPage() {
  const { city } = useLocation();
  const cityParam = city === ALL_CITIES ? "" : `?city=${encodeURIComponent(city)}`;
  const { status, data, error } = useApi<NewsResponse>(`/api/news${cityParam}`);

  const activeId = useActiveSection(SECTIONS.map((section) => section.id));
  const loading = status === "loading" || status === "idle";

  if (status === "error") {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <EmptyState title="Could not load the feed" body={error ?? "Try again in a moment."} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      <header className="mb-10">
        <h1 className="text-3xl font-extrabold tracking-tight text-fg sm:text-4xl">
          Feed
        </h1>
        <p className="mt-3 max-w-xl leading-relaxed text-fg-muted">
          {city === ALL_CITIES
            ? "New tour announcements, presales you can still act on, and what the music press is covering."
            : `New announcements and presales near ${city}, plus what the music press is covering.`}
        </p>
      </header>

      {/* Rail on the left from 1024px, horizontal chips above the content
          below that — a vertical rail on a phone would eat half the width. */}
      <div className="flex flex-col gap-10 lg:flex-row lg:gap-12">
        <SectionRail sections={SECTIONS} activeId={activeId} />

        <div className="min-w-0 flex-1 space-y-16">
          <Section id="announced" title="Just Announced" subtitle="Tours that went public in the last 30 days">
            {loading ? (
              <CardSkeletons />
            ) : data?.announced.length ? (
              <div className="grid grid-cols-1 gap-px bg-line sm:grid-cols-2 xl:grid-cols-3">
                {data.announced.map((tour) => (
                  <TourCard key={tour.id} tour={tour} />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No recent announcements"
                body={
                  city === ALL_CITIES
                    ? "Nothing announced in the last 30 days. Announcements come in waves."
                    : `Nothing announced near ${city} recently. Clear the location to see everywhere.`
                }
              />
            )}
          </Section>

          <Section id="presales" title="Presales" subtitle="Open now or opening within two weeks">
            {loading ? (
              <RowSkeletons />
            ) : data?.presales.length ? (
              <div className="grid grid-cols-1 gap-px bg-line sm:grid-cols-2">
                {data.presales.map((presale) => (
                  <PresaleCard key={presale.id} presale={presale} />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No presales opening soon"
                body="Nothing in the next two weeks. Check back — these land in bursts."
              />
            )}
          </Section>

          <Section id="headlines" title="Headlines" subtitle="From Pitchfork, Stereogum, Consequence and Billboard">
            {loading ? (
              <RowSkeletons />
            ) : data?.headlines.length ? (
              <div className="flex flex-col gap-px bg-line">
                {data.headlines.map((headline) => (
                  <HeadlineRow key={headline.link} headline={headline} />
                ))}
              </div>
            ) : (
              <EmptyState
                title="Headlines unavailable"
                body="The news feeds could not be reached. The rest of the page is unaffected."
              />
            )}
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({
  id,
  title,
  subtitle,
  children,
}: {
  id: string;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    // scroll-mt offsets the sticky header, which would otherwise cover the
    // heading when a rail link jumps here.
    <section id={id} className="scroll-mt-32">
      <header className="mb-6">
        <h2 className="text-2xl font-extrabold tracking-tight text-fg">{title}</h2>
        <p className="mt-1 text-sm text-fg-muted">{subtitle}</p>
      </header>
      {children}
    </section>
  );
}

/**
 * Which section is currently on screen, for highlighting in the rail.
 *
 * IntersectionObserver rather than a scroll listener: the browser does the
 * work off the main thread and only tells us when something crosses the
 * boundary, instead of firing on every pixel of scroll.
 *
 * The rootMargin pins the trigger line near the top of the viewport, so a
 * section becomes "active" when its heading reaches the top rather than when
 * it first peeks in from the bottom.
 */
function useActiveSection(ids: string[]): string {
  const [activeId, setActiveId] = useState(ids[0]);
  const idsRef = useRef(ids);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-120px 0px -70% 0px" }
    );

    for (const id of idsRef.current) {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    }

    return () => observer.disconnect();
  }, []);

  return activeId;
}

function CardSkeletons() {
  return (
    <div className="grid grid-cols-1 gap-px bg-line sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="bg-canvas">
          <div className="aspect-[3/2] animate-pulse bg-surface" />
          <div className="space-y-3 p-4">
            <div className="h-4 w-3/4 animate-pulse bg-surface" />
            <div className="h-3 w-1/3 animate-pulse bg-surface" />
          </div>
        </div>
      ))}
    </div>
  );
}

function RowSkeletons() {
  return (
    <div className="flex flex-col gap-px bg-line">
      {Array.from({ length: 5 }, (_, index) => (
        <div key={index} className="bg-canvas p-4">
          <div className="h-4 w-3/4 animate-pulse bg-surface" />
          <div className="mt-2 h-3 w-1/4 animate-pulse bg-surface" />
        </div>
      ))}
    </div>
  );
}
