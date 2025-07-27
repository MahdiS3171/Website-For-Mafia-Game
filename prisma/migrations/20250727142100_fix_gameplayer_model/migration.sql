/*
  Warnings:

  - Made the column `won` on table `GamePlayer` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "GamePlayer" ALTER COLUMN "won" SET NOT NULL,
ALTER COLUMN "won" SET DEFAULT false;
