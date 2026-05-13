import { NextResponse } from "next/server";
import { appFactory } from "@/factories/app.factory";

export const runtime = "nodejs";

const validator = appFactory.createAuthValidator();
const userRepo = appFactory.createUserRepository();
const authService = appFactory.createAuthService();

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 1. Validar inputs (delegado al servicio)
    const validation = validator.validateLogin(body);
    if (!validation.isValid) {
      return NextResponse.json(
        { ok: false, message: validation.message },
        { status: validation.status },
      );
    }

    // 2. Buscar usuario (delegado al repositorio — CRUD Read)
    const email = body.email.trim().toLowerCase();
    const user = await userRepo.findByEmail(email);
    if (!user) {
      return NextResponse.json(
        { ok: false, message: "Credenciales invalidas." },
        { status: 401 },
      );
    }

    // 3. Verificar contraseña (delegado al servicio)
    const passwordResult = await authService.verifyPassword(user, body.password);
    if (!passwordResult.ok) {
      return NextResponse.json(
        { ok: false, message: passwordResult.message },
        { status: passwordResult.status },
      );
    }

    // 4. Crear sesión (delegado al servicio)
    return authService.createSession(user);
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
