import jwt from "jsonwebtoken";
import { jwtAccessSecret, jwtRefreshSecret } from "./env";

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
