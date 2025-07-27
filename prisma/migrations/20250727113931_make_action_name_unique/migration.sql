/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `ActionType` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ActionType_name_key" ON "ActionType"("name");
