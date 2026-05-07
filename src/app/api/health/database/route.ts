import { NextResponse } from "next/server";
import { assertDatabaseConnection } from "@/lib/database";

export const runtime = "nodejs";

export async function GET() {
  try {
    const database = await assertDatabaseConnection();

    return NextResponse.json({
      ok: true,
      service: "postgres",
      database,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        service: "postgres",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 503 },
    );
  }
}
