// ======================
// Dump SeatGeek's taxonomy tree
// ======================
// SeatGeek has NO genre parameter. The /events endpoint documents exactly one
// category filter — taxonomies.{name,id,parent_id} — and /taxonomies is the
// authoritative list of values it accepts. Guessing slugs returns 400 or an
// empty result set, so this prints the real tree instead.
//
// Run on EC2 where the keys live:  npm run test:genres
//
// SAFETY: prints taxonomy data only. The client_id travels in the query string,
// so the URL is never logged.

import "../config/env.js";
import { requireEnv } from "../config/env.js";

interface Taxonomy {
  id: number;
  name: string;
  parent_id: number | null;
}

const response = await fetch(
  `https://api.seatgeek.com/2/taxonomies?client_id=${requireEnv("SEATGEEK_CLIENT_ID")}&per_page=200`
);

if (!response.ok) {
  console.error(`SeatGeek /taxonomies failed: ${response.status} ${response.statusText}`);
  process.exit(1);
}

const data = (await response.json()) as { taxonomies: Taxonomy[] };
const all = data.taxonomies ?? [];

// The concert taxonomy is the parent of every music genre we care about.
const concert = all.find((taxonomy) => taxonomy.name === "concert");

console.log(`\nTotal taxonomies: ${all.length}`);
console.log(`concert taxonomy id: ${concert?.id ?? "NOT FOUND"}\n`);

if (concert) {
  const children = all.filter((taxonomy) => taxonomy.parent_id === concert.id);
  console.log(`— Children of "concert" (${children.length}) — these are the genre values —`);
  for (const child of children) {
    console.log(`  ${String(child.id).padEnd(10)} ${child.name}`);
  }
  console.log("");
}

// Anything else music-shaped that is not under concert, so nothing is missed.
console.log("— All top-level taxonomies —");
for (const taxonomy of all.filter((item) => item.parent_id === null)) {
  console.log(`  ${String(taxonomy.id).padEnd(10)} ${taxonomy.name}`);
}
console.log("");
