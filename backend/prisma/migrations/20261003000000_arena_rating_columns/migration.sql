-- AddColumn: arena rating and defender hero extracted from save blob for efficient querying
ALTER TABLE "Player" ADD COLUMN "arenaRating" INTEGER NOT NULL DEFAULT 1000;
ALTER TABLE "Player" ADD COLUMN "arenaDefenderHeroId" TEXT;
CREATE INDEX "Player_arenaRating_idx" ON "Player"("arenaRating");
