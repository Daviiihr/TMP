import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { createAccessToken, createRefreshToken, type AuthUser } from "@/lib/auth";
import { getPostgresPool } from "@/lib/database";
import { getRedisClient } from "@/lib/redis";

export const runtime = "nodejs";

type LoginBody = {
  email?: string;
  password?: string;
};

type UserRow = AuthUser & {
  password_hash: string;
  failed_login_attempts: number;
  locked_until: Date | null;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as LoginBody;
    const email = body.email?.trim().toLowerCase();
    const password = body.password;

    if (!email || !password) {
      return NextResponse.json(
        { ok: false, message: "Correo y contrasena son obligatorios." },
        { status: 400 },
      );
    }

    const pool = getPostgresPool();
    const result = await pool.query<UserRow>(
      `
        SELECT id, username, email, password_hash, role, failed_login_attempts, locked_until
        FROM users
        WHERE email = $1
      `,
      [email],
    );

    const user = result.rows[0];

    if (!user) {
      return NextResponse.json(
        { ok: false, message: "Credenciales invalidas." },
        { status: 401 },
      );
    }

    if (user.locked_until && user.locked_until > new Date()) {
      return NextResponse.json(
        { ok: false, message: "Cuenta bloqueada temporalmente. Intenta mas tarde." },
        { status: 423 },
      );
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      const attempts = user.failed_login_attempts + 1;
      const lockedUntil = attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;

      await pool.query(
        `
          UPDATE users
          SET failed_login_attempts = $2,
              locked_until = $3
          WHERE id = $1
        `,
        [user.id, attempts, lockedUntil],
      );

      return NextResponse.json(
        { ok: false, message: "Credenciales invalidas." },
        { status: 401 },
      );
    }

    await pool.query(
      `
        UPDATE users
        SET failed_login_attempts = 0,
            locked_until = NULL
        WHERE id = $1
      `,
      [user.id],
    );

    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    };
    const accessToken = createAccessToken(authUser);
    const refreshToken = createRefreshToken(authUser);
    const redis = getRedisClient();

    if (redis.status === "wait" || redis.status === "end") {
      await redis.connect();
    }

    await redis.set(`refresh:${user.id}`, refreshToken, "EX", 7 * 24 * 60 * 60);

    const response = NextResponse.json({
      ok: true,
      message: "Sesion iniciada.",
      user: authUser,
      accessToken,
    });

    response.cookies.set("tmp_refresh_token", refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: "No se pudo iniciar sesion.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
