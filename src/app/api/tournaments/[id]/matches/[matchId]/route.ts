import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { appFactory } from "@/factories/app.factory";
import { BracketRepository } from "@/repositories/bracket.repository";

export async function PUT(
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
    const { winnerId, score1, score2 } = body;

    if (!winnerId) {
      return NextResponse.json({ error: "Faltan datos del ganador" }, { status: 400 });
    }

    const bracketRepo = new BracketRepository();
    
    // 1. Actualizar el partido actual usando el repositorio robusto del bracket
    await bracketRepo.updateMatchWinner(tournamentId, matchId, winnerId, score1, score2);

    // 2. Emitir evento de partido completado para ranking y logs
    await appFactory.getEventEmitter().emit("match:resultApproved", {
      matchId,
      tournamentId
    });

    // 3. Obtener el bracket actualizado para ver si el torneo ya finalizó (no hay más partidos pendientes)
    // Para simplificar, revisaremos si la final ya tiene ganador, pero lo haremos de forma segura:
    const liveBracketData = await bracketRepo.getLiveBracket(tournamentId);
    if (liveBracketData) {
      const finalRound = liveBracketData.bracketData.rounds[liveBracketData.bracketData.rounds.length - 1];
      const finalMatch = finalRound?.matches[0];
      
      // Extendimos la interfaz en getLiveBracket para tener winnerId y status
      if (finalMatch && (finalMatch as any).status === 'FINISHED' && (finalMatch as any).winnerId) {
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
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error updating match:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
