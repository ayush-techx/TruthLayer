const { PrismaClient } = require('@prisma/client')

/**
 * Singleton Prisma client instance.
 * Reuses a single connection across the entire application.
 */
const prisma = new PrismaClient()

// Graceful shutdown — close DB connection when the process exits
process.on('beforeExit', async () => {
  await prisma.$disconnect()
})

module.exports = prisma
