import prisma from "../../config/db";

interface NightActions {
  godfatherShot?: number | null;
  godfatherSuggest?: number | null;
  punisherTarget?: number | null;
  attorneyTarget?: number | null;
  ordinaryCitizenSuggest?: number | null;
  killerShot?: number | null;
  sniperShot?: number | null;
  doctorHeals?: number[]; // 1 or 2 targets depending on killer alive
  boozerTarget?: number | null;
  nofaceTarget?: number | null;
}

export async function executeNightPhase(gameId: number, actions: NightActions) {
  // --- 1. Get active game state
  const gamePlayers = await prisma.gamePlayer.findMany({
    where: { game_id: gameId, alive: true },
    include: { role: true },
  });

  const deaths: number[] = [];
  const protectedPlayers: number[] = [];

  // --- 2. Apply Doctor Heals
  if (actions.doctorHeals && actions.doctorHeals.length > 0) {
    protectedPlayers.push(...actions.doctorHeals);
  }

  // --- 3. Handle Godfather Shot
  if (actions.godfatherShot) {
    if (!protectedPlayers.includes(actions.godfatherShot)) {
      deaths.push(actions.godfatherShot);
    }
  }

  // --- 4. Handle Killer Shot
  if (actions.killerShot) {
    if (!protectedPlayers.includes(actions.killerShot)) {
      deaths.push(actions.killerShot);
    }
  }

  // --- 5. Handle Sniper Shot
  if (actions.sniperShot) {
    const sniper = gamePlayers.find(p => p.role.name === "sniper");
    if (sniper) {
      const target = await prisma.gamePlayer.findUnique({
        where: { id: actions.sniperShot },
        include: { role: true },
      });

      const isCitizenTarget =
        target?.role.tag === "citizen" && target.role.name !== "sniper";

      // If sniper targets citizen, increment counter
      if (isCitizenTarget) {
        await prisma.gamePlayer.update({
          where: { id: sniper.id },
          data: { sniperCitizenKills: { increment: 1 } },
        });

        const updatedSniper = await prisma.gamePlayer.findUnique({
          where: { id: sniper.id },
        });

        // If sniper killed 2 citizens -> sniper dies
        if (updatedSniper && updatedSniper.sniperCitizenKills >= 2) {
          deaths.push(sniper.id);
        }
      }

      // Apply sniper shot if target not protected
      if (!protectedPlayers.includes(actions.sniperShot)) {
        deaths.push(actions.sniperShot);
      }
    }
  }

  // --- 6. Handle Boozer
  if (actions.boozerTarget) {
    const boozer = gamePlayers.find(p => p.role.name === "boozer");
    const godfather = gamePlayers.find(p => p.role.name === "godfather");
    const killer = gamePlayers.find(p => p.role.name === "killer");

    // If Boozer targeted GF or Killer and they targeted Boozer back → Boozer dies (unless protected)
    if (
      (actions.boozerTarget === godfather?.id && actions.godfatherShot === boozer?.id) ||
      (actions.boozerTarget === killer?.id && actions.killerShot === boozer?.id)
    ) {
      if (!protectedPlayers.includes(boozer!.id)) {
        deaths.push(boozer!.id);
      }
    }
  }

  // --- 7. Apply Punisher, Attorney, NoFace logic (record but no kills yet)
  // Punisher disables night action → you can store as an ActionLog
  // Attorney marks someone defended → can log for later use
  // NoFace checks roles → can log results for UI

  // Log actions (for transparency in ActionLog)
  await prisma.actionLog.create({
    data: {
      game_id: gameId,
      gamePlayer_id: gamePlayers[0].id, // system log (could create special user/system id)
      actionType_id: 0, // system placeholder
      day: 0,
      phase: "night",
      targets: JSON.stringify(actions),
      notes: "Night summary actions",
    },
  });

  // --- 8. Mark deaths
  const uniqueDeaths = [...new Set(deaths)];
  if (uniqueDeaths.length > 0) {
    await prisma.gamePlayer.updateMany({
      where: { id: { in: uniqueDeaths } },
      data: { alive: false, removedAt: `Night ${new Date().toISOString()}` },
    });
  }

  return {
    message: "Night phase executed",
    deaths: uniqueDeaths,
    protected: protectedPlayers,
  };
}
