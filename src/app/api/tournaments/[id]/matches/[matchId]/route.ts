import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { appFactory } from "@/factories/app.factory";
import { BracketRepository } from "@/repositories/bracket.repository";
import { MatchResultRepository } from "@/repositories/matchResult.repository";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; matchId: string }> },
) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const resolvedParams = await params;
    const tournamentId = resolvedParams.id;
    const matchId = resolvedParams.matchId;

    const body = await req.json();
    const { winnerId, score1, score2 } = body;

    if (!winnerId) {
      return NextResponse.json(
        { error: "Faltan datos del ganador" },
        { status: 400 },
      );
    }

    // 1. Verificar el rol. Si es ADMIN o ORGANIZER del torneo, se aprueba directo.
    // Si es un jugador, se deja PENDING_REVIEW.
    // Para simplificar según requerimientos, todo reporte vía este endpoint
    // se ingresará primero a match_results. Si es ADMIN, se aprueba.
    const isDirectApprove =
      user.role === "ADMIN" || (user.role as string) === "ORGANIZER";

    const bracketRepo = new BracketRepository();
    const mrRepo = new MatchResultRepository();

    if (isDirectApprove) {
      // Direct approval behavior (Admin / Organizer)
      await bracketRepo.updateMatchWinner(
        tournamentId,
        matchId,
        winnerId,
        score1,
        score2,
      );

      await appFactory.getEventEmitter().emit("match:resultApproved", {
        matchId,
        tournamentId,
      });

      // Update match_results as well for history
      try {
        const reported = await mrRepo.reportResult(
          matchId,
          score1 || 0,
          score2 || 0,
        );
        await mrRepo.updateStatus(reported.id, "APPROVED");
      } catch (e) {
        console.error("No se pudo registrar en match_results", e);
      }
    } else {
      // User behavior: Goes to pending validation
      // Here score1 should map to participant1, score2 to participant2.
      // We will assume the frontend sends score1 for participant1 and score2 for participant2.
      // If we don't know who is participant1 or participant2 from the request, we must deduce it.
      // Since BracketView passes `winnerId`, we'll generate scores: winner=1, loser=0 if scores are missing.
      await mrRepo.reportResult(matchId, score1 || 1, score2 || 0);
      return NextResponse.json({ success: true, pendingValidation: true });
    }

    // 3. Obtener el bracket actualizado para ver si el torneo ya finalizó (no hay más partidos pendientes)
    // Para simplificar, revisaremos si la final ya tiene ganador, pero lo haremos de forma segura:
    const liveBracketData = await bracketRepo.getLiveBracket(tournamentId);
    if (liveBracketData) {
      const finalRound =
        liveBracketData.bracketData.rounds[
          liveBracketData.bracketData.rounds.length - 1
        ];
      const finalMatch = finalRound?.matches[0];

      // Extendimos la interfaz en getLiveBracket para tener winnerId y status
      if (
        finalMatch &&
        (finalMatch as { status?: string; winnerId?: string }).status ===
          "FINISHED" &&
        (finalMatch as { status?: string; winnerId?: string }).winnerId
      ) {
        const tournamentRepo = appFactory.createTournamentRepository();
        const tournament = await tournamentRepo.getById(tournamentId);

        if (tournament && tournament.status !== "COMPLETED") {
          await tournamentRepo.updateStatus(tournamentId, "COMPLETED");
          appFactory.getEventEmitter().emit("tournament:statusChanged", {
            tournamentId,
            oldStatus: tournament.status,
            newStatus: "COMPLETED",
            userId: user.id,
          });
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Error updating match:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
