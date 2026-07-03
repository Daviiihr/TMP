import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { MatchResultRepository } from "@/repositories/matchResult.repository";

export async function GET() {
  try {
    const user = await getSession();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const repository = new MatchResultRepository();
    const pendingValidations = await repository.getPendingResults();

    return NextResponse.json({ validations: pendingValidations });
  } catch (error: unknown) {
    console.error("Error fetching validations:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
