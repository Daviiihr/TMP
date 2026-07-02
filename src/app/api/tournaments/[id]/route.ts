import { NextResponse } from "next/server";
import { appFactory } from "@/factories/app.factory";
import { assertAdminAccess } from "@/domain/tournament.rules";
import { getSession } from "@/lib/session";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
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
    const status = message.includes("Sesion no iniciada")
      ? 401
      : message.includes("administradores")
        ? 403
        : 500;

    return NextResponse.json(
      {
        ok: false,
        message: "Error al actualizar el torneo.",
        details: message,
      },
      { status },
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const tournamentRepo = appFactory.createTournamentRepository();
    const tournament = await tournamentRepo.getById(id);

    if (!tournament) {
      return NextResponse.json(
        { ok: false, message: "Torneo no encontrado." },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true, tournament });
  } catch (_error) {
    return NextResponse.json(
      { ok: false, message: "Error al obtener el torneo." },
      { status: 500 },
    );
  }
}
