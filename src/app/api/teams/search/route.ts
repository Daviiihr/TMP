import { NextResponse } from "next/server";
import { TeamService } from "@/services/team.service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query) {
      return NextResponse.json({ ok: false, message: "El término de búsqueda es obligatorio." }, { status: 400 });
    }

    const teamService = new TeamService();
    const teams = await teamService.searchTeams(query);

    return NextResponse.json({ ok: true, teams }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  }
}
