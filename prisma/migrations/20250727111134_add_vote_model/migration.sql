-- CreateTable
CREATE TABLE "Vote" (
    "id" SERIAL NOT NULL,
    "game_id" INTEGER NOT NULL,
    "round" TEXT NOT NULL,
    "voter_id" INTEGER NOT NULL,
    "target_id" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vote_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "Game"("game_id") ON DELETE RESTRICT ON UPDATE CASCADE;
