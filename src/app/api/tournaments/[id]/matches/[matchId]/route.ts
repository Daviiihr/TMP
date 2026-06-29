import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { appFactory } from "@/factories/app.factory";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; matchId: string }> }
) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const resolvedParams = await params;
    const tournamentId = resolvedParams.id;
    const matchId = resolvedParams.matchId;

    const body = await req.json();
    const { winnerId, winnerName, nextMatchId, nextMatchSlot } = body;

    if (!winnerId || !winnerName) {
      return NextResponse.json({ error: "Faltan datos del ganador" }, { status: 400 });
    }

    const matchRepo = appFactory.createMatchRepository();
    
    // 1. Marcar el partido actual como FINISHED
    await matchRepo.updateMatchStatus(matchId, "FINISHED");

    // 2. Avanzar al jugador si hay un siguiente partido
    if (nextMatchId && nextMatchSlot) {
      await matchRepo.updateNextMatchParticipant(nextMatchId, nextMatchSlot, winnerId, winnerName);
    }

    // 3. Emitir evento de partido completado para ranking y logs
    await appFactory.getEventEmitter().emit("match:resultApproved", {
      matchId,
      tournamentId
    });

    // 4. Si no hay siguiente partido, el torneo ha terminado
    if (!nextMatchId) {
      const tournamentRepo = appFactory.createTournamentRepository();
      const tournament = await tournamentRepo.getById(tournamentId);
      if (tournament && tournament.status !== 'COMPLETED') {
        await tournamentRepo.updateStatus(tournamentId, 'COMPLETED');
        appFactory.getEventEmitter().emit("tournament:statusChanged", {
          tournamentId,
          oldStatus: tournament.status,
          newStatus: 'COMPLETED',
          userId: user.id
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error updating match:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
