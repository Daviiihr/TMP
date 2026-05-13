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
    const { tournamentId } = body;

    if (!tournamentId) {
      return NextResponse.json({ ok: false, message: "Tournament ID es obligatorio." }, { status: 400 });
    }

    const enrollmentService = appFactory.createEnrollmentService();
    const result = await enrollmentService.enrollPlayerInTournament(session.id, tournamentId);

    return NextResponse.json({ ok: true, ...result }, { status: 200 });
  } catch (error: unknown) {
    return NextResponse.json({ ok: false, message: getErrorMessage(error) }, { status: 400 });
  }
}
