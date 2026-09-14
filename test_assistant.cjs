const { PrismaClient } = require("@prisma/client");

async function main() {
  const p = new PrismaClient();
  const caseRecord = await p.caseRecord.findFirst();
  console.log("Case ID:", caseRecord.id);
  
  const docs = await p.document.findMany({
    where: { caseId: caseRecord.id },
    include: { ocrData: true }
  });
  
  console.log("Docs found:", docs.length);
  const withText = docs.filter(d => d.ocrData?.rawText);
  console.log("Docs with text:", withText.length);
  
  await p.$disconnect();
}

main().catch(console.error);
