/*
  Warnings:

  - Added the required column `side` to the `GamePlayer` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "GamePlayer" ADD COLUMN     "removedAt" TEXT,
ADD COLUMN     "side" TEXT NOT NULL,
ADD COLUMN     "won" BOOLEAN;
