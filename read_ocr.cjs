const { PrismaClient } = require("@prisma/client");

async function main() {
  const p = new PrismaClient();
  const d = await p.ocrExtraction.findFirst({ where: { document: { type: 'WITNESS_STATEMENT' } } });
  console.log(d.rawText);
  await p.$disconnect();
}

main().catch(console.error);
