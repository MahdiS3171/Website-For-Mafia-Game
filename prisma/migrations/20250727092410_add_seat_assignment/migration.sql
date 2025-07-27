-- CreateTable
CREATE TABLE "SeatAssignment" (
    "id" SERIAL NOT NULL,
    "game_id" INTEGER NOT NULL,
    "gamePlayer_id" INTEGER NOT NULL,
    "day" INTEGER NOT NULL,
    "phase" TEXT NOT NULL,
    "seatNumber" INTEGER NOT NULL,

    CONSTRAINT "SeatAssignment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SeatAssignment" ADD CONSTRAINT "SeatAssignment_gamePlayer_id_fkey" FOREIGN KEY ("gamePlayer_id") REFERENCES "GamePlayer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeatAssignment" ADD CONSTRAINT "SeatAssignment_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "Game"("game_id") ON DELETE RESTRICT ON UPDATE CASCADE;
