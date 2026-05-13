import { NextResponse } from "next/server";
import { appFactory } from "@/factories/app.factory";
import { getSession } from "@/lib/session";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ ok: false, message: "Sesión no iniciada." }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    const tournamentService = appFactory.createTournamentService();
    const result = await tournamentService.changeStatus(id, status, session.id);

    return NextResponse.json({
      ok: true,
      message: result.message,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: "Error al actualizar el torneo.", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}
