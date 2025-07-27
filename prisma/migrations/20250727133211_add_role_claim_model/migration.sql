-- CreateTable
CREATE TABLE "RoleClaim" (
    "id" SERIAL NOT NULL,
    "game_id" INTEGER NOT NULL,
    "gamePlayer_id" INTEGER NOT NULL,
    "roleName" TEXT NOT NULL,
    "phase" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoleClaim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Defense" (
    "id" SERIAL NOT NULL,
    "game_id" INTEGER NOT NULL,
    "finalist_id" INTEGER NOT NULL,
    "defend_id" INTEGER,

    CONSTRAINT "Defense_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "RoleClaim" ADD CONSTRAINT "RoleClaim_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "Game"("game_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleClaim" ADD CONSTRAINT "RoleClaim_gamePlayer_id_fkey" FOREIGN KEY ("gamePlayer_id") REFERENCES "GamePlayer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Defense" ADD CONSTRAINT "Defense_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "Game"("game_id") ON DELETE RESTRICT ON UPDATE CASCADE;
