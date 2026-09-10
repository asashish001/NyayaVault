/*
  Warnings:

  - Added the required column `token` to the `ShareToken` table without a default value. This is not possible if the table is not empty.

*/
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_ShareToken" ("createdAt", "createdById", "documentId", "expiresAt", "id", "purpose", "recipient", "revoked", "viewOnly") SELECT "createdAt", "createdById", "documentId", "expiresAt", "id", "purpose", "recipient", "revoked", "viewOnly" FROM "ShareToken";
DROP TABLE "ShareToken";
ALTER TABLE "new_ShareToken" RENAME TO "ShareToken";
CREATE UNIQUE INDEX "ShareToken_token_key" ON "ShareToken"("token");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
