-- AddForeignKey
ALTER TABLE "Defense" ADD CONSTRAINT "Defense_finalist_id_fkey" FOREIGN KEY ("finalist_id") REFERENCES "GamePlayer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Defense" ADD CONSTRAINT "Defense_defend_id_fkey" FOREIGN KEY ("defend_id") REFERENCES "GamePlayer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
