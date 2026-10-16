// ======================
// /api/news — the feed
// ======================
// Three sections, three sources, none of which require defeating anybody:
// announcement dates from SeatGeek, presale windows from Ticketmaster, and
// headlines from publishers' own RSS.

import { Router } from "express";
import { getJustAnnounced, getHypedPresales } from "../services/tours.js";
import { getHeadlines } from "../services/headlines.js";

const router = Router();

function parseCity(raw: unknown): string | undefined {
  if (typeof raw !== "string") return undefined;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/**
 * GET /api/news?city=Denver
 *
 * One request for the whole page rather than three. The sections render
 * together, so three round trips would only add latency and three chances to
 * half-fail.
 *
 * allSettled, not all: a dead RSS host must not blank the announcements. Each
 * section fails on its own and the page says so in that section alone.
 */
router.get("/", async (req, res) => {
  const city = parseCity(req.query.city);

  const [announced, presales, headlines] = await Promise.allSettled([
    getJustAnnounced(12, 30, city),
    getHypedPresales(12, city),
    getHeadlines(12),
  ]);

  res.json({
    announced: announced.status === "fulfilled" ? announced.value : [],
    presales: presales.status === "fulfilled" ? presales.value : [],
    headlines: headlines.status === "fulfilled" ? headlines.value : [],
    failed: {
      announced: announced.status === "rejected",
      presales: presales.status === "rejected",
      headlines: headlines.status === "rejected",
    },
  });
});

export default router;
