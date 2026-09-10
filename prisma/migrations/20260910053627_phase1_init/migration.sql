-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ShareToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "viewOnly" BOOLEAN NOT NULL DEFAULT true,
    "redactedFields" TEXT,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ShareToken_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ShareToken" ("createdAt", "createdById", "documentId", "expiresAt", "id", "purpose", "recipient", "redactedFields", "revoked", "token", "viewOnly") SELECT "createdAt", "createdById", "documentId", "expiresAt", "id", "purpose", "recipient", "redactedFields", "revoked", "token", "viewOnly" FROM "ShareToken";
DROP TABLE "ShareToken";
ALTER TABLE "new_ShareToken" RENAME TO "ShareToken";
CREATE UNIQUE INDEX "ShareToken_token_key" ON "ShareToken"("token");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
