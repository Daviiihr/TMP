import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { jwtAccessSecret } from "./env";
import { AuthUser } from "./auth";

export async function getSession(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;

  if (!token) return null;

  try {
    const decoded = jwt.verify(token, jwtAccessSecret()) as AuthUser;
    return decoded;
  } catch {
    return null;
  }
}
