import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined};

export const prisma =
globalForPrisma.prisma ??
new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"], // could add "query" for debugging
  datasourceUrl: process.env.DIRECT_URL,
});

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

