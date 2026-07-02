import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { UserRepository } from "@/repositories/user.repository";

export async function GET(req: NextRequest) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";

    const repo = new UserRepository();
    const users = await repo.searchUsers(query);

    return NextResponse.json({
      users: users.map((u) => ({ id: u.id, name: u.username })),
    });
  } catch (error: unknown) {
    console.error("Error searching users:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 },
    );
  }
}
