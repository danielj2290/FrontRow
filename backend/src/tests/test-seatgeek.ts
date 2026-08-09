// ======================
// SeatGeek smoke test
// ======================
// Run with: npm run test:seatgeek
//
// A "smoke test" answers one question: do our keys work and does the API
// return the shape we expect? It hits the REAL API, so it needs internet
// and valid keys in the root .env.

import { searchEvents } from "../services/seatgeek.js";

async function main() {
  console.log("— SeatGeek: search by artist —");
  // Zach Bryan is on a 2026 stadium tour, so this should always return events.
  // (If this drops to 0 someday, swap in any artist currently touring.)
  const byArtist = await searchEvents({ artist: "Zach Bryan" });
  console.log(`Total matching events: ${byArtist.meta.total}`);
  if (byArtist.meta.total === 0) {
    throw new Error("Artist search returned 0 events — expected an active tour");
  }
  for (const event of byArtist.events) {
    console.log(
      `  ${event.datetime_local}  ${event.title} @ ${event.venue.name}, ${event.venue.city}` +
        `  | get-in: $${event.stats.lowest_price ?? "n/a"}`
    );
  }

  console.log("\n— SeatGeek: search by city —");
  const byCity = await searchEvents({ city: "Chicago" });
  console.log(`Total concerts in Chicago: ${byCity.meta.total}`);
  if (byCity.meta.total === 0) {
    throw new Error("City search returned 0 events — Chicago always has concerts");
  }
  for (const event of byCity.events) {
    console.log(`  ${event.datetime_local}  ${event.title}`);
  }

  // Price stats: report status honestly rather than failing the test.
  // Empty stats is a KNOWN limitation of our key tier (see services/seatgeek.ts).
  const anyPrices = [...byArtist.events, ...byCity.events].some(
    (e) => e.stats.lowest_price != null
  );
  if (anyPrices) {
    console.log("\n💰 Price stats ARE present — key tier may have been upgraded!");
  } else {
    console.log(
      "\n⚠️  Price stats still empty for all events (known key limitation — see services/seatgeek.ts)"
    );
  }

  console.log("\n✅ SeatGeek API test passed (search works; see price note above)");
}

main().catch((err) => {
  console.error("❌ SeatGeek API test FAILED:", err.message);
  process.exit(1);
});
