-- AlterTable
ALTER TABLE "ActionType" ADD COLUMN     "maxTargets" INTEGER,
ADD COLUMN     "minTargets" INTEGER,
ADD COLUMN     "requiresRoleGuess" BOOLEAN NOT NULL DEFAULT false;
