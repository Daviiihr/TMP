import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getPostgresPool } from "@/lib/database";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ ok: false, message: "Sesión no iniciada." }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    const validStatuses = ["DRAFT", "REGISTRATION", "CANCELLED", "COMPLETED"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { ok: false, message: `Status inválido. Debe ser: ${validStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    const pool = getPostgresPool();

    // Verificar que el torneo pertenece al usuario
    const tournament = await pool.query(
      "SELECT id, organizer_id, status FROM tournaments WHERE id = $1",
      [id]
    );

    if (tournament.rows.length === 0) {
      return NextResponse.json({ ok: false, message: "Torneo no encontrado." }, { status: 404 });
    }

    if (tournament.rows[0].organizer_id !== session.id) {
      return NextResponse.json({ ok: false, message: "No tienes permiso para modificar este torneo." }, { status: 403 });
    }

    // Si se quiere activar (REGISTRATION), verificar que no haya otro activo
    if (status === "REGISTRATION") {
      const active = await pool.query(
        "SELECT id, name FROM tournaments WHERE organizer_id = $1 AND status = 'REGISTRATION' AND id != $2",
        [session.id, id]
      );
      if (active.rows.length > 0) {
        return NextResponse.json(
          { ok: false, message: `Ya tienes un torneo activo: "${active.rows[0].name}". Desactívalo primero.` },
          { status: 409 }
        );
      }
    }

    await pool.query("UPDATE tournaments SET status = $1 WHERE id = $2", [status, id]);

    return NextResponse.json({
      ok: true,
      message: `Torneo actualizado a ${status}.`,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: "Error al actualizar el torneo.", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}
