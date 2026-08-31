// ======================
// Dump SeatGeek's taxonomy tree
// ======================
// SeatGeek has NO genre parameter. /events documents exactly one category
// filter — taxonomies.{name,id,parent_id} — and /taxonomies is the
// authoritative list of values it accepts.
//
// Run on EC2 where the keys live:  npm run test:genres
//
// SAFETY: prints taxonomy data only, never the request URL (it carries the key).

import "../config/env.js";
import { requireEnv } from "../config/env.js";

interface Taxonomy {
  id: number;
  name: string;
  parent_id: number | null;
}

// /taxonomies caps per_page at 100, so page through until we have them all.
async function fetchAllTaxonomies(): Promise<Taxonomy[]> {
  const clientId = requireEnv("SEATGEEK_CLIENT_ID");
  const collected: Taxonomy[] = [];

  for (let page = 1; page <= 20; page += 1) {
    const response = await fetch(
      `https://api.seatgeek.com/2/taxonomies?client_id=${clientId}&per_page=100&page=${page}`
    );

    if (!response.ok) {
      console.error(`/taxonomies page ${page} failed: ${response.status} ${response.statusText}`);
      break;
    }

    const data = (await response.json()) as {
      taxonomies: Taxonomy[];
      meta?: { total?: number };
    };
    const batch = data.taxonomies ?? [];
    collected.push(...batch);

    const total = data.meta?.total;
    if (batch.length < 100 || (total !== undefined && collected.length >= total)) break;
  }

  return collected;
}

const all = await fetchAllTaxonomies();
const byId = new Map(all.map((taxonomy) => [taxonomy.id, taxonomy]));

console.log(`\nTotal taxonomies fetched: ${all.length}\n`);

console.log("— Top-level taxonomies —");
for (const taxonomy of all.filter((item) => item.parent_id === null)) {
  const childCount = all.filter((item) => item.parent_id === taxonomy.id).length;
  console.log(`  ${String(taxonomy.id).padEnd(10)} ${taxonomy.name.padEnd(24)} (${childCount} children)`);
}

// Case-insensitive, and tolerant of "Concert" vs "Concerts" — the previous run
// missed it by matching the exact lowercase string.
const musicRoots = all.filter((taxonomy) => /concert|music/i.test(taxonomy.name));

console.log("\n— Anything music-shaped —");
for (const root of musicRoots) {
  const parent = root.parent_id !== null ? byId.get(root.parent_id)?.name : "(top level)";
  console.log(`  ${String(root.id).padEnd(10)} ${root.name.padEnd(24)} parent: ${parent}`);
}

for (const root of musicRoots) {
  const children = all.filter((taxonomy) => taxonomy.parent_id === root.id);
  if (children.length === 0) continue;

  console.log(`\n— Children of "${root.name}" (${children.length}) — candidate genre values —`);
  for (const child of children) {
    console.log(`  ${String(child.id).padEnd(10)} ${child.name}`);
  }
}
console.log("");
