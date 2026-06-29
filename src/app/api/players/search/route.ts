import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { UserRepository } from "@/repositories/user.repository";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";

    if (!query || query.length < 1) {
      return NextResponse.json({ users: [] });
    }

    const repo = new UserRepository();
    const users = await repo.searchUsers(query);

    return NextResponse.json({ users: users.map(u => ({ id: u.id, name: u.username })) });
  } catch (error: any) {
    console.error("Error searching users:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
