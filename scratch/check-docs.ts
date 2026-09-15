import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  const docs = await prisma.document.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: { ocrData: true }
  });
  console.log(JSON.stringify(docs, null, 2));
}

check().catch(console.error).finally(() => prisma.$disconnect());
