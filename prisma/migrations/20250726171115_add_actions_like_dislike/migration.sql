-- CreateTable
CREATE TABLE "ActionType" (
    "action_id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "phase" TEXT NOT NULL,
    "role_id" INTEGER,
    "description" TEXT,

    CONSTRAINT "ActionType_pkey" PRIMARY KEY ("action_id")
);

-- CreateTable
CREATE TABLE "ActionLog" (
    "log_id" SERIAL NOT NULL,
    "game_id" INTEGER NOT NULL,
    "gamePlayer_id" INTEGER NOT NULL,
    "actionType_id" INTEGER NOT NULL,
    "day" INTEGER NOT NULL,
    "phase" TEXT NOT NULL,
    "targets" TEXT NOT NULL,
    "notes" TEXT,

    CONSTRAINT "ActionLog_pkey" PRIMARY KEY ("log_id")
);

-- AddForeignKey
ALTER TABLE "ActionType" ADD CONSTRAINT "ActionType_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "Role"("role_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionLog" ADD CONSTRAINT "ActionLog_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "Game"("game_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionLog" ADD CONSTRAINT "ActionLog_gamePlayer_id_fkey" FOREIGN KEY ("gamePlayer_id") REFERENCES "GamePlayer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionLog" ADD CONSTRAINT "ActionLog_actionType_id_fkey" FOREIGN KEY ("actionType_id") REFERENCES "ActionType"("action_id") ON DELETE RESTRICT ON UPDATE CASCADE;
