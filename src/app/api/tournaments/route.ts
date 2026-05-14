import { NextResponse } from "next/server";
import { appFactory } from "@/factories/app.factory";
import { assertAdminAccess } from "@/domain/tournament.rules";
import { hasErrorCode } from "@/lib/errors";
import { getSession } from "@/lib/session";

export async function GET() {
  try {
    const pool = appFactory.createPostgresPool();
    const result = await pool.query(
      `SELECT count(*) as count FROM tournaments WHERE status IN ('REGISTRATION', 'IN_PROGRESS')`
    );
    const count = parseInt(result.rows[0].count);
    return NextResponse.json({ ok: true, count });
  } catch (error) {
    console.error("Error fetching active tournaments count:", error);
    return NextResponse.json(
      { ok: false, message: "Error al obtener la cantidad de torneos." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();

    assertAdminAccess(session);

    const formData = await request.formData();
    
    const name = formData.get("name") as string;
    const game = formData.get("game") as string;
    const regionsString = formData.get("regions") as string;
    const type = formData.get("type") as string || "INDIVIDUAL";
    const eliminationMode = formData.get("elimination_mode") as string;
    const maxPlayers = parseInt(formData.get("max_players") as string);
    const playersPerTeam = parseInt(formData.get("players_per_team") as string) || null;
    const startDate = formData.get("start_date") as string;
    const endDate = formData.get("end_date") as string;
    const registrationClosesAt = formData.get("registration_closes_at") as string;

    const regions = regionsString?.split(",").map(r => r.trim()).filter(Boolean) ?? [];

    const tournamentService = appFactory.createTournamentService();
    await tournamentService.createTournament({
      name,
      game,
      regions,
      type,
      eliminationMode,
      maxPlayers,
      playersPerTeam,
      startDate,
      endDate,
      registrationClosesAt,
      organizerId: session.id,
    });

    return NextResponse.redirect(new URL("/dashboard", request.url));
  } catch (error) {
    console.error("Tournament creation error:", error);

    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message.includes("Sesion no iniciada")
      ? 401
      : message.includes("administradores")
        ? 403
        : hasErrorCode(error, "23505") || message.includes("Ya existe un torneo")
          ? 409
          : 400;

    return NextResponse.json(
      { 
        ok: false, 
        message: status === 409 ? "Ya existe un torneo con ese nombre." : "No se pudo crear el torneo.",
        details: message
      },
      { status },
    );
  }
}
