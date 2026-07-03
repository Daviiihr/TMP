import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { MatchResultRepository } from "@/repositories/matchResult.repository";
import { appFactory } from "@/factories/app.factory";
import { BracketRepository } from "@/repositories/bracket.repository";
import { getPostgresPool } from "@/lib/database";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getSession();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id: validationId } = await params;
    const body = await req.json();
    const { status, rejectionReason } = body;

    if (!["APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
    }

    const repository = new MatchResultRepository();
    const pool = getPostgresPool();

    // Obtener detalles para poder emitir el evento y actualizar el bracket
    const mrRes = await pool.query(
      `SELECT mr.match_id, mr.score_participant1, mr.score_participant2, m.tournament_id, m.participant1_id, m.participant2_id
       FROM match_results mr
       JOIN matches m ON mr.match_id = m.id
       WHERE mr.id = $1`,
      [validationId]
    );

    if (mrRes.rows.length === 0) {
      return NextResponse.json({ error: "Validación no encontrada" }, { status: 404 });
    }

    const matchData = mrRes.rows[0];

    const updated = await repository.updateStatus(validationId, status, rejectionReason);

    if (status === "APPROVED") {
      // Determinar ganador
      let winnerId = null;
      if (matchData.score_participant1 > matchData.score_participant2) {
        winnerId = matchData.participant1_id;
      } else if (matchData.score_participant2 > matchData.score_participant1) {
        winnerId = matchData.participant2_id;
      } else {
        // En caso de empate, si las reglas del negocio lo prohíben esto no debería ocurrir.
        // Asignaremos null o devolveremos error.
        return NextResponse.json({ error: "Empate no soportado para definir ganador" }, { status: 400 });
      }

      if (winnerId) {
        const bracketRepo = new BracketRepository();
        await bracketRepo.updateMatchWinner(
          matchData.tournament_id,
          matchData.match_id,
          winnerId,
          matchData.score_participant1,
          matchData.score_participant2
        );

        await appFactory.getEventEmitter().emit("match:resultApproved", {
          matchId: matchData.match_id,
          tournamentId: matchData.tournament_id,
        });
      }
    }

    return NextResponse.json({ success: true, validation: updated });
  } catch (error: any) {
    console.error("Error updating validation status:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
