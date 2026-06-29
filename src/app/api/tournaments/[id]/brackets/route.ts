import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { BracketRepository } from "@/repositories/bracket.repository";
import { generateBracket, Participant } from "@/lib/algorithms/brackets";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(req);
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

    return NextResponse.json({ success: true, bracketId, bracketData });
  } catch (error: any) {
    console.error("Error generating bracket:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
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
    const activeBracket = await repo.getActiveBracket(tournamentId);

    if (!activeBracket) {
      return NextResponse.json({ bracketData: null });
    }

    return NextResponse.json({ 
      bracketData: activeBracket.bracket_data,
      eliminationMode: activeBracket.elimination_mode 
    });
  } catch (error: any) {
    console.error("Error fetching bracket:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
