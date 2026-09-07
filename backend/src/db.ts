// ======================
// Prisma client singleton
// ======================
// WHY a singleton: every `new PrismaClient()` opens its own connection pool.
// Constructing one per request would exhaust RDS's connection limit under any
// real traffic — db.t3.micro allows relatively few. One client for the process,
// reused everywhere.
//
// tsx watch reloads modules on every save without restarting the process, so in
// development the client is cached on globalThis. Without that, a morning of
// editing leaves dozens of orphaned pools open against RDS.

import "./config/env.js"; // DATABASE_URL must be loaded before the client reads it
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // Log slow or failing queries in development; stay quiet in production so
    // PM2's log file does not fill with every SELECT the bot runs.
    log: process.env.NODE_ENV === "production" ? ["error"] : ["warn", "error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
