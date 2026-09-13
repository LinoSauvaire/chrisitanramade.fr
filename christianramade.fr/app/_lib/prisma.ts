import { PrismaClient } from "../generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  // Remplace les alias SSL dépréciés par verify-full explicite
  const url = (process.env.DATABASE_URL ?? '').replace(
    /sslmode=(prefer|require|verify-ca)/i,
    'sslmode=verify-full',
  )
  const adapter = new PrismaPg({ connectionString: url })
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
