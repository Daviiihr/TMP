import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { createAccessToken, createRefreshToken, type AuthUser } from "@/lib/auth";
import { getRedisClient } from "@/lib/redis";
import { UserRepository, type UserRow } from "@/repositories/user.repository";

export class AuthService {
  constructor(private userRepo: UserRepository) {}

  /**
   * Verifica la contraseña del usuario.
   * Si falla, incrementa los intentos y bloquea si excede el límite.
   * Si es correcta, resetea los intentos.
   */
  async verifyPassword(user: UserRow, password: string): Promise<{ ok: boolean; message: string; status: number }> {
    // Verificar si la cuenta está bloqueada
    if (user.locked_until && user.locked_until > new Date()) {
      return { ok: false, message: "Cuenta bloqueada temporalmente. Intenta mas tarde.", status: 423 };
    }

    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      await this.handleFailedAttempt(user);
      return { ok: false, message: "Credenciales invalidas.", status: 401 };
    }

    // Contraseña correcta → resetear intentos
    await this.userRepo.resetLoginAttempts(user.id);
    return { ok: true, message: "OK", status: 200 };
  }

  /**
   * Incrementa el contador de intentos fallidos.
   * Si llega a 5, bloquea la cuenta por 15 minutos.
   */
  private async handleFailedAttempt(user: UserRow): Promise<void> {
    const attempts = user.failed_login_attempts + 1;
    const lockedUntil = attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;
    await this.userRepo.updateLoginAttempts(user.id, attempts, lockedUntil);
  }

  /**
   * Crea una sesión completa: genera tokens JWT, guarda refresh en Redis
   * y devuelve la respuesta HTTP con cookies configuradas.
   */
  async createSession(user: UserRow): Promise<NextResponse> {
    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    };

    const accessToken = createAccessToken(authUser);
    const refreshToken = createRefreshToken(authUser);

    // Guardar refresh token en Redis
    const redis = getRedisClient();
    if (redis.status === "wait" || redis.status === "end") {
      await redis.connect();
    }
    await redis.set(`refresh:${user.id}`, refreshToken, "EX", 7 * 24 * 60 * 60);

    // Armar respuesta con cookies
    const response = NextResponse.json({
      ok: true,
      message: "Sesion iniciada.",
      user: authUser,
      accessToken,
      redirect: "/dashboard",
    });

    response.cookies.set("tmp_refresh_token", refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    response.cookies.set("accessToken", accessToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 15 * 60,
    });

    return response;
  }
}
