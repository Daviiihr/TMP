import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { TeamService } from "@/services/team.service";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ ok: false, message: "Sesión no iniciada." }, { status: 401 });
    }

    const body = await request.json();
    const { name, size } = body;

    if (!name || !size) {
      return NextResponse.json({ ok: false, message: "Nombre y tamaño son obligatorios." }, { status: 400 });
    }

    const teamService = new TeamService();
    const team = await teamService.createTeam(name, session.id, parseInt(size));

    return NextResponse.json({ ok: true, message: "Equipo creado exitosamente.", team }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  }
}
