import { NextResponse } from "next/server";
import { appFactory } from "@/factories/app.factory";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get("country") || undefined;
    const rankingRepo = appFactory.createRankingRepository();
    const rankings = await rankingRepo.getRankingsByCountry(country);
    return NextResponse.json({ ok: true, rankings });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { ok: false, message: "Error al obtener rankings", error: errorMessage },
      { status: 500 }
    );
  }
}
