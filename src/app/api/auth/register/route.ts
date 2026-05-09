import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { getPostgresPool } from "@/lib/database";
import { formatAllowedEmailDomains, isAllowedEmailDomain } from "@/lib/email-domain";

export const runtime = "nodejs";

const VALID_REGIONS = new Set(["NA", "EU", "LATAM", "ASIA"]);

type RegisterBody = {
  username?: string;
  email?: string;
  password?: string;
  region?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RegisterBody;
    const username = body.username?.trim();
    const email = body.email?.trim().toLowerCase();
    const password = body.password;
    const region = body.region;

    if (!username || username.length < 3 || username.length > 40) {
      return NextResponse.json(
        { ok: false, message: "El nombre de usuario debe tener entre 3 y 40 caracteres." },
        { status: 400 },
      );
    }

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { ok: false, message: "Ingresa un correo valido." },
        { status: 400 },
      );
    }

    if (!isAllowedEmailDomain(email)) {
      return NextResponse.json(
        {
          ok: false,
          message: `Solo se permiten correos de estos dominios: ${formatAllowedEmailDomains()}.`,
        },
        { status: 403 },
      );
    }

    if (!password || password.length < 8) {
      return NextResponse.json(
        { ok: false, message: "La contrasena debe tener al menos 8 caracteres." },
        { status: 400 },
      );
    }

    if (!region || !VALID_REGIONS.has(region)) {
      return NextResponse.json(
        { ok: false, message: "Selecciona una region valida." },
        { status: 400 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await getPostgresPool().query<{
      id: string;
      username: string;
      email: string;
      role: "PLAYER";
      region: string;
    }>(
      `
        INSERT INTO users (username, email, password_hash, region)
        VALUES ($1, $2, $3, $4)
        RETURNING id, username, email, role, region
      `,
      [username, email, passwordHash, region],
    );

    return NextResponse.json(
      {
        ok: true,
        message: "Cuenta creada exitosamente.",
        user: result.rows[0],
      },
      { status: 201 },
    );
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23505"
    ) {
      return NextResponse.json(
        { ok: false, message: "El usuario o correo ya existe." },
        { status: 409 },
      );
    }

    return NextResponse.json(
      {
        ok: false,
        message: "No se pudo crear la cuenta.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
