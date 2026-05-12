import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { EnrollmentService } from "@/services/enrollment.service";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ ok: false, message: "Sesión no iniciada." }, { status: 401 });
    }

    const body = await request.json();
    const { teamId, tournamentId } = body;

    if (!teamId || !tournamentId) {
      return NextResponse.json({ ok: false, message: "Team ID y Tournament ID son obligatorios." }, { status: 400 });
    }

    const enrollmentService = new EnrollmentService();
    const result = await enrollmentService.enrollTeamInTournament(teamId, tournamentId);

    return NextResponse.json({ ok: true, ...result }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 400 });
  }
}
