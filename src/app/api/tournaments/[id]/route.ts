import { NextResponse } from "next/server";
import { appFactory } from "@/factories/app.factory";
import { assertAdminAccess } from "@/domain/tournament.rules";
import { getSession } from "@/lib/session";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    assertAdminAccess(session);

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
    const message = error instanceof Error ? error.message : "Unknown";
    const status = message.includes("Sesion no iniciada") ? 401 : message.includes("administradores") ? 403 : 500;

    return NextResponse.json(
      { ok: false, message: "Error al actualizar el torneo.", details: message },
      { status }
    );
  }
}
