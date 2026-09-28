-- Existing refresh tokens cannot be converted safely because they were stored
-- in plaintext. Recreating the table intentionally revokes every old session.
DROP TABLE "RefreshToken";

CREATE TABLE "RefreshToken" (
    "id" SERIAL NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "accountId" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");
CREATE INDEX "RefreshToken_accountId_idx" ON "RefreshToken"("accountId");
CREATE INDEX "RefreshToken_familyId_idx" ON "RefreshToken"("familyId");

ALTER TABLE "RefreshToken"
ADD CONSTRAINT "RefreshToken_accountId_fkey"
FOREIGN KEY ("accountId") REFERENCES "Account"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
