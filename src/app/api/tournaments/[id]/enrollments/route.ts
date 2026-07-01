import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { TournamentRepository } from "@/repositories/tournament.repository";

const tournamentRepo = new TournamentRepository();

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    
    // Verify tournament exists and belongs to the organizer
    const tournament = await tournamentRepo.getById(id);
    if (!tournament) {
      return NextResponse.json({ error: "Torneo no encontrado" }, { status: 404 });
    }

    if (tournament.organizer_id !== session.id) {
      return NextResponse.json({ error: "No tienes permiso para ver esto" }, { status: 403 });
    }

    let participants = [];
    if (tournament.type === "INDIVIDUAL") {
      participants = await tournamentRepo.getEnrolledPlayers(id);
    } else {
      participants = await tournamentRepo.getEnrolledTeams(id);
    }

    // El frontend espera { players: [...] } por compatibilidad, 
    // pero internamente son participantes (ya sea jugadores o equipos)
    return NextResponse.json({ players: participants });
  } catch (error) {
    console.error("Error fetching enrolled players:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
