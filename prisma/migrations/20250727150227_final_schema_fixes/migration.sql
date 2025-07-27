/*
  Warnings:

  - The `targets` column on the `ActionLog` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "ActionLog" DROP COLUMN "targets",
ADD COLUMN     "targets" JSONB;
