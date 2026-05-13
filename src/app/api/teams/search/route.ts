import { NextResponse } from "next/server";
import { appFactory } from "@/factories/app.factory";
import { getErrorMessage } from "@/lib/errors";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query) {
      return NextResponse.json({ ok: false, message: "El término de búsqueda es obligatorio." }, { status: 400 });
    }

    const teamService = appFactory.createTeamService();
    const teams = await teamService.searchTeams(query);

    return NextResponse.json({ ok: true, teams }, { status: 200 });
  } catch (error: unknown) {
    return NextResponse.json({ ok: false, message: getErrorMessage(error) }, { status: 500 });
  }
}
