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
    const { teamId } = body;

    if (!teamId) {
      return NextResponse.json({ ok: false, message: "Team ID es obligatorio." }, { status: 400 });
    }

    const teamService = new TeamService();
    const result = await teamService.joinTeam(teamId, session.id);

    return NextResponse.json({ ok: true, ...result }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 400 });
  }
}
