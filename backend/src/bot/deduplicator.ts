// ======================
// Idempotent snapshot writes
// ======================
// The bot must be safe to run twice. That guarantee lives in the DATABASE, not
// here: PriceSnapshot has @@unique([eventId, marketplace, observedOn]), where
// observedOn is a DATE. So "one snapshot per event per marketplace per night"
// is enforced by Postgres and cannot be defeated by two runs overlapping.
//
// A check-then-insert in application code would race: two runs could both see
// "no row yet" before either writes. An upsert against a unique constraint
// cannot.

import { prisma } from "../db.js";

/** Midnight UTC for a given moment — the DATE half of an observation. */
export function observationDay(when: Date = new Date()): Date {
  return new Date(Date.UTC(when.getUTCFullYear(), when.getUTCMonth(), when.getUTCDate()));
}

export interface SnapshotInput {
  eventId: string;
  source: string;
  marketplace: string;
  getInPrice: number;
  listingCount: number | null;
  isAllInPrice: boolean;
}

/**
 * Write tonight's snapshot, replacing one already recorded for the same event,
 * marketplace and day.
 *
 * Update-on-conflict rather than ignore-on-conflict: a re-run usually means the
 * first attempt was wrong or partial, so the newer reading is the better one.
 */
export async function saveSnapshot(input: SnapshotInput): Promise<void> {
  const observedOn = observationDay();

  await prisma.priceSnapshot.upsert({
    where: {
      eventId_marketplace_observedOn: {
        eventId: input.eventId,
        marketplace: input.marketplace,
        observedOn,
      },
    },
    create: {
      eventId: input.eventId,
      source: input.source,
      marketplace: input.marketplace,
      observedAt: new Date(),
      observedOn,
      getInPrice: input.getInPrice,
      listingCount: input.listingCount,
      isAllInPrice: input.isAllInPrice,
    },
    update: {
      observedAt: new Date(),
      getInPrice: input.getInPrice,
      listingCount: input.listingCount,
      isAllInPrice: input.isAllInPrice,
      source: input.source,
    },
  });
}

/** Whether we already have tonight's reading — used to skip cheaply. */
export async function alreadyCapturedToday(
  eventId: string,
  marketplace: string
): Promise<boolean> {
  const existing = await prisma.priceSnapshot.findUnique({
    where: {
      eventId_marketplace_observedOn: {
        eventId,
        marketplace,
        observedOn: observationDay(),
      },
    },
    select: { id: true },
  });

  return existing !== null;
}
