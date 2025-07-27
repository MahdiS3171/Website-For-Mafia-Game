/*
  Warnings:

  - Made the column `targets` on table `ActionLog` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "ActionLog" ALTER COLUMN "targets" SET NOT NULL;
