import { PrismaClient } from "@prisma/client";
import { cache } from "react";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const client =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

export const prisma = client;

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = client;

// Request-level memoization for Prisma client access
export const getPrisma = cache((): PrismaClient => {
  return prisma;
});
