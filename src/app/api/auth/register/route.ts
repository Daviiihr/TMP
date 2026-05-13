import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { appFactory } from "@/factories/app.factory";
import { getErrorMessage, hasErrorCode } from "@/lib/errors";

export const runtime = "nodejs";

const validator = appFactory.createAuthValidator();
const userRepo = appFactory.createUserRepository();

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 1. Validar inputs (delegado al servicio)
    const validation = validator.validateRegister(body);
    if (!validation.isValid) {
      return NextResponse.json(
        { ok: false, message: validation.message },
        { status: validation.status },
      );
    }

    // 2. Hash de contraseña
    const passwordHash = await bcrypt.hash(body.password, 12);

    // 3. Crear usuario (delegado al repositorio — CRUD Create)
    const newUser = await userRepo.create({
      username: body.username.trim(),
      email: body.email.trim().toLowerCase(),
      passwordHash,
      region: body.region,
    });

    return NextResponse.json(
      {
        ok: true,
        message: "Cuenta creada exitosamente.",
        user: newUser,
      },
      { status: 201 },
    );
  } catch (error) {
    // Violación de UNIQUE constraint (usuario/correo duplicado)
    if (hasErrorCode(error, "23505")) {
      return NextResponse.json(
        { ok: false, message: "El usuario o correo ya existe." },
        { status: 409 },
      );
    }

    return NextResponse.json(
      {
        ok: false,
        message: "No se pudo crear la cuenta.",
        error: getErrorMessage(error),
      },
      { status: 500 },
    );
  }
}
