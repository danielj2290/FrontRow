// ======================
// Ticketmaster smoke test
// ======================
// Run with: npm run test:ticketmaster
//
// Verifies the two things we need Ticketmaster for:
//   1. Event discovery (finding concerts)
//   2. On-sale / presale dates (SeatGeek doesn't have these)

import { discoverEvents } from "../services/ticketmaster.js";

async function main() {
  console.log("— Ticketmaster: discover events by keyword —");
  const byKeyword = await discoverEvents({ keyword: "Zach Bryan" });
  console.log(`Total matching events: ${byKeyword.page.totalElements}`);

  for (const event of byKeyword._embedded?.events ?? []) {
    const venue = event._embedded?.venues?.[0];
    console.log(`  ${event.dates.start.localDate}  ${event.name} @ ${venue?.name ?? "?"}, ${venue?.city?.name ?? "?"}`);

    // The data SeatGeek can't give us:
    const onSale = event.sales?.public?.startDateTime;
    if (onSale) console.log(`    on-sale: ${onSale}`);
    for (const presale of event.sales?.presales ?? []) {
      console.log(`    presale "${presale.name}": ${presale.startDateTime} → ${presale.endDateTime}`);
    }
  }

  console.log("\n— Ticketmaster: discover events by city —");
  const byCity = await discoverEvents({ city: "Chicago" });
  console.log(`Total music events in Chicago: ${byCity.page.totalElements}`);
  for (const event of byCity._embedded?.events ?? []) {
    console.log(`  ${event.dates.start.localDate}  ${event.name}`);
  }

  console.log("\n✅ Ticketmaster API test passed");
}

main().catch((err) => {
  console.error("❌ Ticketmaster API test FAILED:", err.message);
  process.exit(1);
});
