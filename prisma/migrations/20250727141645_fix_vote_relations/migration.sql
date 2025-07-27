/*
  Warnings:

  - You are about to drop the column `createdAt` on the `Vote` table. All the data in the column will be lost.
  - You are about to drop the column `round` on the `Vote` table. All the data in the column will be lost.
  - Added the required column `phase` to the `Vote` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Vote" DROP COLUMN "createdAt",
DROP COLUMN "round",
ADD COLUMN     "phase" TEXT NOT NULL,
ALTER COLUMN "target_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_voter_id_fkey" FOREIGN KEY ("voter_id") REFERENCES "GamePlayer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "GamePlayer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
