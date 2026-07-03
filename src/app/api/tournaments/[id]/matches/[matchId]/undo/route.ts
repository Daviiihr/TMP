import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { BracketRepository } from "@/repositories/bracket.repository";
import { appFactory } from "@/factories/app.factory";

export async function POST(
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

    const pool = appFactory.createPostgresPool();
    const tourRes = await pool.query(
      `SELECT organizer_id FROM tournaments WHERE id = $1`,
      [tournamentId],
    );

    if (tourRes.rows.length === 0) {
      return NextResponse.json(
        { error: "Torneo no encontrado" },
        { status: 404 },
      );
    }

    if (tourRes.rows[0].organizer_id !== user.id && user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "No tienes permiso para modificar este bracket" },
        { status: 403 },
      );
    }

    const repo = new BracketRepository();
    await repo.undoMatchWinner(tournamentId, matchId);

    return NextResponse.json({
      success: true,
      message: "Resultado deshecho exitosamente",
    });
  } catch (error: unknown) {
    console.error("Error undoing match:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
