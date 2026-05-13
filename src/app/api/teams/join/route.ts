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
    const { teamId } = body;

    if (!teamId) {
      return NextResponse.json({ ok: false, message: "Team ID es obligatorio." }, { status: 400 });
    }

    const teamService = appFactory.createTeamService();
    const result = await teamService.joinTeam(teamId, session.id);

    return NextResponse.json({ ok: true, ...result }, { status: 200 });
  } catch (error: unknown) {
    return NextResponse.json({ ok: false, message: getErrorMessage(error) }, { status: 400 });
  }
}
