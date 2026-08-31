// ======================
// /api/events — concert search
// ======================
// One file per resource, per the folder rules. The route's only jobs are
// validating input, calling the service, and shaping the HTTP response.
// All the provider logic lives in services/eventSearch.ts.

import { Router } from "express";
import { searchConcerts } from "../services/eventSearch.js";

const router = Router();

// Guard against someone requesting 10,000 results and hammering our upstream
// API quota. 50 is well above what any page actually renders.
const MAX_LIMIT = 50;
const DEFAULT_LIMIT = 20;

function parseLimit(raw: unknown): number {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return DEFAULT_LIMIT;
  return Math.min(Math.max(Math.trunc(parsed), 1), MAX_LIMIT);
}

// Query params arrive as string | string[] | undefined, so narrow to a plain
// trimmed string before using them.
function parseText(raw: unknown): string | undefined {
  if (typeof raw !== "string") return undefined;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/**
 * GET /api/events?artist=zach+bryan&city=Denver&limit=20
 *
 * At least one of artist or city is required — an unfiltered search would
 * return an arbitrary slice of every concert on sale, which is never what a
 * user means and wastes an upstream call.
 */
router.get("/", async (req, res) => {
  const artist = parseText(req.query.artist);
  const city = parseText(req.query.city);
  const limit = parseLimit(req.query.limit);

  if (!artist && !city) {
    return res.status(400).json({
      error: "Provide at least one of ?artist= or ?city=",
    });
  }

  try {
    const events = await searchConcerts({ artist, city, limit });
    res.json({ count: events.length, events });
  } catch (error) {
    // 502, not 500: our server is fine, the upstream provider is what failed.
    // Log the real reason server-side; never leak provider internals to the client.
    console.error("GET /api/events failed:", error);
    res.status(502).json({ error: "Event provider unavailable. Please try again shortly." });
  }
});

export default router;
