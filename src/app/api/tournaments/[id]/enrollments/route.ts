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

    if (tournament.type !== "INDIVIDUAL") {
      return NextResponse.json({ error: "Este endpoint es solo para torneos individuales" }, { status: 400 });
    }

    const players = await tournamentRepo.getEnrolledPlayers(id);

    return NextResponse.json({ players });
  } catch (error) {
    console.error("Error fetching enrolled players:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
