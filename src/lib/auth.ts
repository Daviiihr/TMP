import jwt from "jsonwebtoken";
import { allowedEmailDomains, jwtAccessSecret, jwtRefreshSecret } from "./env";

export type AuthUser = {
  id: string;
  email: string;
  username: string;
  role: "PLAYER" | "CAPTAIN" | "ADMIN";
};

export function createAccessToken(user: AuthUser): string {
  return jwt.sign(user, jwtAccessSecret(), {
    expiresIn: "15m",
    subject: user.id,
  });
}

export function createRefreshToken(user: AuthUser): string {
  return jwt.sign({ id: user.id }, jwtRefreshSecret(), {
    expiresIn: "7d",
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
