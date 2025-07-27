/*
  Warnings:

  - You are about to drop the column `roleName` on the `RoleClaim` table. All the data in the column will be lost.
  - Added the required column `role_id` to the `RoleClaim` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "RoleClaim" DROP COLUMN "roleName",
ADD COLUMN     "isDeny" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "role_id" INTEGER NOT NULL,
ADD COLUMN     "showText" TEXT;

-- AddForeignKey
ALTER TABLE "RoleClaim" ADD CONSTRAINT "RoleClaim_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "Role"("role_id") ON DELETE RESTRICT ON UPDATE CASCADE;
