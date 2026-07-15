import "server-only";
import { PrismaClient } from "@prisma/client";
import { observability } from "./observability";
import logger from "./logger";

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

export const getPrisma = (): PrismaClient => {
  return prisma;
};
