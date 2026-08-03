// ======================
// Spotify smoke test
// ======================
// Run with: npm run test:spotify
//
// Verifies the full client-credentials flow end to end:
// token exchange → artist search → name + image.
//
// Pass criteria = name AND image present. Genres/popularity/followers are
// NOT required: Spotify stopped returning them to new development-mode
// apps (see note in services/spotify.ts) — genre data comes from SeatGeek.

import { searchArtist } from "../services/spotify.js";

async function main() {
  const names = ["Billie Eilish", "Zach Bryan"];

  for (const name of names) {
    console.log(`— Spotify: search artist "${name}" —`);
    const artist = await searchArtist(name);

    if (!artist) {
      throw new Error(`No Spotify match for "${name}"`);
    }

    const image = artist.images[0]?.url;
    console.log(`  name:       ${artist.name}`);
    console.log(`  image:      ${image ?? "(no image)"}`);
    console.log(`  genres:     ${artist.genres.join(", ") || "(not provided — expected, see spotify.ts)"}`);
    console.log(`  popularity: ${artist.popularity ?? "(not provided — expected, see spotify.ts)"}`);
    console.log();

    if (!image) {
      throw new Error(`Spotify returned no image for "${name}" — images are the main thing we need it for`);
    }
  }

  console.log("✅ Spotify API test passed (token flow + artist search + images)");
}

main().catch((err) => {
  console.error("❌ Spotify API test FAILED:", err.message);
  process.exit(1);
});
