-- AlterTable
ALTER TABLE "Game" ADD COLUMN     "currentDay" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "currentPhase" TEXT NOT NULL DEFAULT 'day';

-- AlterTable
ALTER TABLE "GamePlayer" ADD COLUMN     "cause" TEXT;
