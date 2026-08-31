// ======================
// /api/artists — artist profile pages
// ======================
// Artist data is stitched together from three providers in the service layer.
// This route only validates the name and shapes the HTTP response.

import { Router } from "express";
import { getArtistProfile } from "../services/eventSearch.js";

const router = Router();

/**
 * GET /api/artists/:name
 *
 * The name arrives URL-encoded from the frontend ("zach%20bryan"). We match on
 * name rather than an id because none of our three providers share one — a
 * SeatGeek performer id means nothing to Spotify, and vice versa.
 */
router.get("/:name", async (req, res) => {
  const name = req.params.name.trim();

  if (!name) {
    return res.status(400).json({ error: "Artist name is required." });
  }

  try {
    const profile = await getArtistProfile(name);
    res.json(profile);
  } catch (error) {
    console.error(`GET /api/artists/${req.params.name} failed:`, error);
    res.status(502).json({ error: "Artist provider unavailable. Please try again shortly." });
  }
});

export default router;
