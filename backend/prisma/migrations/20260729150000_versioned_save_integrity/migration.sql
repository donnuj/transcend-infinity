ALTER TABLE "SaveData"
ADD COLUMN "schemaVersion" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "revision" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "checksum" TEXT;

UPDATE "SaveData"
SET "checksum" = encode(sha256(convert_to("data", 'UTF8')), 'hex');

ALTER TABLE "SaveData"
ALTER COLUMN "checksum" SET NOT NULL;

CREATE TABLE "SaveAudit" (
    "id" SERIAL NOT NULL,
    "playerId" INTEGER NOT NULL,
    "revision" INTEGER NOT NULL,
    "checksum" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SaveAudit_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SaveAudit_playerId_revision_key"
ON "SaveAudit"("playerId", "revision");

CREATE INDEX "SaveAudit_playerId_idx" ON "SaveAudit"("playerId");

ALTER TABLE "SaveAudit"
ADD CONSTRAINT "SaveAudit_playerId_fkey"
FOREIGN KEY ("playerId") REFERENCES "Player"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
