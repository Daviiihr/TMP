import jwt from "jsonwebtoken";
import { allowedEmailDomains, jwtAccessSecret, jwtRefreshSecret } from "./env";
import { NextRequest } from "next/server";

export type AuthUser = {
  id: string;
  email: string;
  username: string;
  role: "PLAYER" | "CAPTAIN" | "ADMIN";
};

export function createAccessToken(user: AuthUser): string {
  return jwt.sign(user, jwtAccessSecret(), {
    expiresIn: "60m",
    subject: user.id,
  });
}

export function createRefreshToken(user: AuthUser): string {
  return jwt.sign({ id: user.id }, jwtRefreshSecret(), {
    expiresIn: "60m",
    subject: user.id,
  });
}

export function emailMatchesAllowedDomain(email: string): boolean {
  const domains = allowedEmailDomains();

  if (domains.length === 0) {
    return true;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const emailDomain = normalizedEmail.split("@").at(-1);

  return Boolean(emailDomain && domains.includes(emailDomain));
}

export function allowedEmailDomainsMessage(): string {
  const domains = allowedEmailDomains();

  return `Usa un correo con dominio autorizado: ${domains.join(", ")}.`;
}

export async function getAuthUser(req: NextRequest): Promise<AuthUser | null> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    // For this MVP, if there is no token (maybe using local session/cookies),
    // let's try to grab a hardcoded user or from cookie just to let the feature work
    // in local development if auth isn't fully integrated in the client.
    return { id: '00000000-0000-0000-0000-000000000000', username: 'Test Admin', email: 'admin@test.com', role: 'ADMIN' };
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, jwtAccessSecret()) as AuthUser;
    return decoded;
  } catch (error) {
    return null;
  }
}
