import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { BracketRepository } from "@/repositories/bracket.repository";
import { generateBracket, Participant } from "@/lib/algorithms/brackets";
import { appFactory } from "@/factories/app.factory";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const resolvedParams = await params;
    const tournamentId = resolvedParams.id;
    const body = await req.json();
    const { participants, eliminationMode } = body as { participants: Participant[], eliminationMode: 'SINGLE_ELIMINATION' | 'DOUBLE_ELIMINATION' };

    if (!participants || participants.length < 2) {
      return NextResponse.json({ error: "Se requieren al menos 2 participantes" }, { status: 400 });
    }

    // Generar bracket en memoria
    const bracketData = generateBracket(participants, eliminationMode);

    // Guardar en DB
    const repo = new BracketRepository();
    const bracketId = await repo.saveBracket(tournamentId, user.id, bracketData, eliminationMode);

    // Actualizar estado del torneo a IN_PROGRESS
    const tournamentRepo = appFactory.createTournamentRepository();
    const tournament = await tournamentRepo.getById(tournamentId);
    if (tournament && tournament.status === 'DRAFT') {
      await tournamentRepo.updateStatus(tournamentId, 'IN_PROGRESS');
      appFactory.getEventEmitter().emit("tournament:statusChanged", {
        tournamentId,
        oldStatus: 'DRAFT',
        newStatus: 'IN_PROGRESS',
        userId: user.id
      });
    }

    return NextResponse.json({ success: true, bracketId, bracketData });
  } catch (error: unknown) {
    console.error("Error generating bracket:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const tournamentId = resolvedParams.id;
    
    const repo = new BracketRepository();
    const liveBracket = await repo.getLiveBracket(tournamentId);

    if (!liveBracket) {
      return NextResponse.json({ bracketData: null });
    }

    return NextResponse.json({ 
      bracketData: liveBracket.bracketData,
      eliminationMode: liveBracket.eliminationMode 
    });
  } catch (error: unknown) {
    console.error("Error fetching bracket:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
