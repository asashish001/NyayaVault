const { PrismaClient } = require("@prisma/client");

async function main() {
    const p = new PrismaClient();
    const docId = "cmu02n0vu0003tpzwn1iulewe";

    const newMetadata = {
        fields: {
            caseNumber: "FIR-FIN-2026-9418",
            date: "19-May-2026",
            accusedNames: ["Eleanor Vance"]
        },
        confidences: {
            caseNumber: 0.8,
            date: 0.6,
            accusedNames: 0.75
        }
    };

    await p.ocrExtraction.update({
        where: { documentId: docId },
        data: { extractedData: JSON.stringify(newMetadata, null, 2) }
    });

    console.log("Metadata updated successfully!");
    await p.$disconnect();
}

main().catch(console.error);
