import { NextResponse } from "next/server";
import { appFactory } from "@/factories/app.factory";
import { getErrorMessage } from "@/lib/errors";
import { getSession } from "@/lib/session";

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

    const teamService = appFactory.createTeamService();
    const team = await teamService.createTeam(name, session.id, parseInt(size));

    return NextResponse.json({ ok: true, message: "Equipo creado exitosamente.", team }, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json({ ok: false, message: getErrorMessage(error) }, { status: 500 });
  }
}
