import type { HypedPresale, Tour } from "./tour.ts";

export interface Headline {
  title: string;
  link: string;
  source: string;
  publishedAt: string | null;
}

export interface NewsResponse {
  announced: Tour[];
  presales: HypedPresale[];
  headlines: Headline[];
  // Which sections failed upstream. The page renders the others regardless —
  // a dead RSS host should never blank the announcements.
  failed: {
    announced: boolean;
    presales: boolean;
    headlines: boolean;
  };
}
