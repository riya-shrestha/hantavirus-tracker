// Singleton PrismaClient.
// Every pipeline script (and the admin tab API routes in /web) should import
// `prisma` from here rather than constructing its own PrismaClient. This
// keeps connection-pool usage predictable, which matters because Neon's
// free tier caps total connections.
//
// Pattern: cache the client on globalThis so hot-reload / test reruns in
// the same process don't leak connections.

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["warn", "error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
