// ======================
// Curate the tracked-event list
// ======================
// The bot cannot scrape every concert on sale, so tracking is opt-in. This is
// how events get opted in — by hand for now, matching the spreadsheet workflow.
// Later this same ingestEvent/setTracked pair gets called from favourites and
// from a popularity sweep.
//
// Usage (run on EC2, where DATABASE_URL and the API keys live):
//   npm run track -- sg-17871645 tm-G5dFZ975dZstp
//   npm run track -- --list
//   npm run track -- --untrack sg-17871645

import "../config/env.js";
import { prisma } from "../db.js";
import { getEventDetail } from "../services/eventSearch.js";
import { ingestEvent, setTracked, listTrackedEvents } from "../services/ingest.js";

const args = process.argv.slice(2);

async function showTracked(): Promise<void> {
  const events = await listTrackedEvents();
  console.log(`\n${events.length} tracked event(s):\n`);

  for (const event of events) {
    const date = event.eventDate.toISOString().split("T")[0];
    const provider = event.seatgeekId ? `sg-${event.seatgeekId}` : `tm-${event.ticketmasterId}`;
    console.log(`  ${date}  ${provider.padEnd(22)} ${event.title}`);
    console.log(`              ${event.venue.name}, ${event.venue.city}`);
  }
  console.log("");
}

async function untrack(prefixedIds: string[]): Promise<void> {
  for (const prefixedId of prefixedIds) {
    const isSeatGeek = prefixedId.startsWith("sg-");
    const providerId = prefixedId.slice(3);

    const event = await prisma.event.findFirst({
      where: isSeatGeek ? { seatgeekId: providerId } : { ticketmasterId: providerId },
    });

    if (!event) {
      console.log(`  not in database: ${prefixedId}`);
      continue;
    }

    await setTracked(event.id, false);
    console.log(`  untracked: ${event.title}`);
  }
}

async function track(prefixedIds: string[]): Promise<void> {
  for (const prefixedId of prefixedIds) {
    // Fetch through the same path the website uses, so a tracked event is
    // exactly the event a visitor would see — no second normalisation to drift.
    const summary = await getEventDetail(prefixedId);

    if (!summary) {
      console.log(`  NOT FOUND: ${prefixedId}`);
      continue;
    }

    const eventId = await ingestEvent(summary);
    await setTracked(eventId, true);

    const date = summary.eventDate.split("T")[0];
    console.log(`  tracking: ${date}  ${summary.title} — ${summary.venue.name}`);
  }
}

if (args.length === 0 || args[0] === "--list") {
  await showTracked();
} else if (args[0] === "--untrack") {
  await untrack(args.slice(1));
  await showTracked();
} else {
  await track(args);
  await showTracked();
}

// Without this the process hangs: Prisma keeps its connection pool open.
await prisma.$disconnect();
