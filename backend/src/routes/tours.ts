// ======================
// /api/tours — hyped tours and presales
// ======================
// The feeds the site now leads with. All three are derived from popularity,
// announcement dates and presale windows, none of which require a price.

import { Router } from "express";
import {
  getHypedTours,
  getToursBySize,
  getHypedPresales,
  isVenueSize,
  getTourById,
} from "../services/tours.js";

const router = Router();

const MAX_LIMIT = 48;

// An empty or whitespace-only city means "everywhere", which is also what the
// frontend sends when the visitor clears the picker.
function parseCity(raw: unknown): string | undefined {
  if (typeof raw !== "string") return undefined;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function parseLimit(raw: unknown, fallback: number): number {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(Math.trunc(parsed), 1), MAX_LIMIT);
}

/**
 * GET /api/tours/hyped?limit=8
 * The homepage headline: multi-date tours ranked by hype score.
 */
router.get("/hyped", async (req, res) => {
  try {
    const tours = await getHypedTours(parseLimit(req.query.limit, 8), parseCity(req.query.city));
    res.json({ count: tours.length, tours });
  } catch (error) {
    console.error("GET /api/tours/hyped failed:", error);
    res.status(502).json({ error: "Could not build the tour ranking right now." });
  }
});

/**
 * GET /api/tours/presales?limit=8
 * Presales open now or opening within a fortnight.
 */
router.get("/presales", async (req, res) => {
  try {
    const presales = await getHypedPresales(parseLimit(req.query.limit, 8), parseCity(req.query.city));
    res.json({ count: presales.length, presales });
  } catch (error) {
    console.error("GET /api/tours/presales failed:", error);
    res.status(502).json({ error: "Could not load presales right now." });
  }
});

/**
 * GET /api/tours?size=large|medium|small&limit=24
 * The browse page. Size is required — the whole point of that page is the
 * split, and an unfiltered list is just the hyped feed again.
 */
router.get("/", async (req, res) => {
  const size = typeof req.query.size === "string" ? req.query.size.toLowerCase() : "";

  if (!isVenueSize(size)) {
    return res.status(400).json({ error: "size must be one of: large, medium, small" });
  }

  try {
    const tours = await getToursBySize(size, parseLimit(req.query.limit, 24), parseCity(req.query.city));
    res.json({ count: tours.length, size, tours });
  } catch (error) {
    console.error("GET /api/tours failed:", error);
    res.status(502).json({ error: "Could not build the tour ranking right now." });
  }
});

/**
 * GET /api/tours/:id
 *
 * Declared LAST so it cannot shadow /hyped and /presales — Express matches in
 * definition order, and ":id" would happily swallow both.
 */
router.get("/:id", async (req, res) => {
  try {
    const tour = await getTourById(req.params.id);
    if (!tour) {
      return res.status(404).json({ error: "Tour not found." });
    }
    res.json(tour);
  } catch (error) {
    console.error(`GET /api/tours/${req.params.id} failed:`, error);
    res.status(502).json({ error: "Could not load that tour right now." });
  }
});

export default router;
