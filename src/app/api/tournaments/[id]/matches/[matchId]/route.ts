import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { BracketRepository } from "@/repositories/bracket.repository";
import { appFactory } from "@/factories/app.factory";

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
      return NextResponse.json({ error: "winnerId es requerido" }, { status: 400 });
    }

    // Verificar que el usuario tenga permisos (idealmente solo el admin/organizador del torneo)
    const pool = appFactory.createPostgresPool();
    const tourRes = await pool.query(`SELECT organizer_id FROM tournaments WHERE id = $1`, [tournamentId]);
    if (tourRes.rows.length === 0) {
      return NextResponse.json({ error: "Torneo no encontrado" }, { status: 404 });
    }
    
    if (tourRes.rows[0].organizer_id !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ error: "No tienes permiso para actualizar este bracket" }, { status: 403 });
    }

    const repo = new BracketRepository();
    await repo.updateMatchWinner(tournamentId, matchId, winnerId, score1, score2);

    return NextResponse.json({ success: true, message: "Match actualizado" });
  } catch (error: any) {
    console.error("Error updating match:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
