import { NextResponse } from "next/server";
import { assertRedisConnection } from "@/lib/redis";

export const runtime = "nodejs";

export async function GET() {
  try {
    const redis = await assertRedisConnection();

    return NextResponse.json({
      ok: true,
      service: "redis",
      redis,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        service: "redis",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 503 },
    );
  }
}
