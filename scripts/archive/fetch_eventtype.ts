import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const firstRecord = await prisma.eventtype.findFirst()
  console.log(JSON.stringify(firstRecord, null, 2))
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
