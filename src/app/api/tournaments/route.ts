import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getPostgresPool } from "@/lib/database";

export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { ok: false, message: "Sesión no iniciada." },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    
    const name = formData.get("name") as string;
    const game = formData.get("game") as string;
    const regionsString = formData.get("regions") as string;
    const type = formData.get("type") as string || "INDIVIDUAL";
    const maxPlayers = parseInt(formData.get("max_players") as string);
    const playersPerTeam = parseInt(formData.get("players_per_team") as string) || null;
    const startDate = formData.get("start_date") as string;
    const endDate = formData.get("end_date") as string;
    const registrationClosesAt = formData.get("registration_closes_at") as string;

    if (!name || !game || !regionsString || isNaN(maxPlayers)) {
      return NextResponse.json(
        { ok: false, message: "Faltan campos obligatorios o el formato es incorrecto." },
        { status: 400 }
      );
    }

    const regions = regionsString.split(",").map(r => r.trim());

    const pool = getPostgresPool();
    await pool.query(
      `INSERT INTO tournaments 
       (name, game, region, max_players, type, min_players_per_team, max_players_per_team, start_date, end_date, registration_closes_at, status, organizer_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [name, game, regions, maxPlayers, type, playersPerTeam, playersPerTeam, startDate, endDate, registrationClosesAt, 'REGISTRATION', session.id]
    );

    return NextResponse.redirect(new URL("/dashboard", request.url));
  } catch (error) {
    console.error("Tournament creation error:", error);
    return NextResponse.json(
      { 
        ok: false, 
        message: "Error interno al crear el torneo.",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 },
    );
  }
}
