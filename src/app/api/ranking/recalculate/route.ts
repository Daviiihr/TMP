import { NextResponse } from "next/server";
import { appFactory } from "@/factories/app.factory";
import bcrypt from "bcryptjs";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const rankingService = appFactory.createRankingService();
    const pool = appFactory.createPostgresPool();

    // Comprobar si se solicita sembrar datos
    const { searchParams } = new URL(request.url);
    const seed = searchParams.get("seed") === "true";

    if (seed) {
      console.log("[Seeding] Insertando datos simulados de ranking y partidas...");
      
      // Aseguramos que la conexión a la base de datos y la migración se hayan corrido
      const assertDb = appFactory.createPostgresPool();
      await assertDb.query("SELECT 1");

      const checkUsers = await pool.query("SELECT COUNT(*) FROM users");
      const count = parseInt(checkUsers.rows[0].count);

      // Creamos usuarios si hay muy pocos en la base de datos
      if (count <= 2) {
        const adminHash = await bcrypt.hash("adminpassword", 12);
        const adminRes = await pool.query(
          `INSERT INTO users (username, email, password_hash, role, region, country)
           VALUES ('AdminOrganizador', 'admin@gmail.com', $1, 'ADMIN', 'LATAM', 'Chile')
           ON CONFLICT (email) DO UPDATE SET role = 'ADMIN'
           RETURNING id`,
          [adminHash]
        );
        const adminId = adminRes.rows[0]?.id;

        if (adminId) {
          const players = [
            { username: "Seba_CL", email: "seba.cl@gmail.com", country: "Chile" },
            { username: "Messi_AR", email: "messi.ar@gmail.com", country: "Argentina" },
            { username: "Canelo_MX", email: "canelo.mx@gmail.com", country: "México" },
            { username: "Ibai_ES", email: "ibai.es@gmail.com", country: "España" },
            { username: "James_CO", email: "james.co@gmail.com", country: "Colombia" },
            { username: "Guerrero_PE", email: "guerrero.pe@gmail.com", country: "Perú" },
          ];

          const playerIds: string[] = [];
          for (const p of players) {
            const playerHash = await bcrypt.hash("playerpassword", 12);
            const userRes = await pool.query(
              `INSERT INTO users (username, email, password_hash, role, region, country)
               VALUES ($1, $2, $3, 'PLAYER', 'LATAM', $4)
               ON CONFLICT (email) DO UPDATE SET country = EXCLUDED.country
               RETURNING id`,
              [p.username, p.email, playerHash, p.country]
            );
            if (userRes.rows[0]) {
              playerIds.push(userRes.rows[0].id);
            }
          }

          // Crear Torneo Individual de Prueba
          const tournRes = await pool.query(
            `INSERT INTO tournaments (name, game, region, max_players, type, status, organizer_id)
             VALUES ('Arena de Campeones', 'Super Smash Bros', '{"LATAM"}', 8, 'INDIVIDUAL', 'IN_PROGRESS', $1)
             ON CONFLICT (lower(name)) DO UPDATE SET status = 'IN_PROGRESS'
             RETURNING id`,
            [adminId]
          );
          const tournId = tournRes.rows[0]?.id;

          if (tournId && playerIds.length >= 6) {
            // Inscribir a los usuarios
            for (const pid of playerIds) {
              await pool.query(
                `INSERT INTO individual_enrollments (user_id, tournament_id)
                 VALUES ($1, $2) ON CONFLICT DO NOTHING`,
                [pid, tournId]
              );
            }

            // Crear Partidas
            // Partida 1: Seba_CL (Chile) vs Messi_AR (Argentina)
            const m1Res = await pool.query(
              `INSERT INTO matches (tournament_id, round_number, match_number, participant1_id, participant1_name, participant2_id, participant2_name, winner_id)
               VALUES ($1, 1, 1, $2, 'Seba_CL', $3, 'Messi_AR', $2)
               ON CONFLICT (tournament_id, round_number, match_number) DO UPDATE SET winner_id = EXCLUDED.participant1_id
               RETURNING id`,
              [tournId, playerIds[0], playerIds[1]]
            );
            const m1Id = m1Res.rows[0]?.id;

            // Partida 2: Canelo_MX (México) vs Ibai_ES (España)
            const m2Res = await pool.query(
              `INSERT INTO matches (tournament_id, round_number, match_number, participant1_id, participant1_name, participant2_id, participant2_name, winner_id)
               VALUES ($1, 1, 2, $2, 'Canelo_MX', $3, 'Ibai_ES', $2)
               ON CONFLICT (tournament_id, round_number, match_number) DO UPDATE SET winner_id = EXCLUDED.participant1_id
               RETURNING id`,
              [tournId, playerIds[2], playerIds[3]]
            );
            const m2Id = m2Res.rows[0]?.id;

            // Partida 3: James_CO (Colombia) vs Guerrero_PE (Perú)
            const m3Res = await pool.query(
              `INSERT INTO matches (tournament_id, round_number, match_number, participant1_id, participant1_name, participant2_id, participant2_name, winner_id)
               VALUES ($1, 1, 3, $2, 'James_CO', $3, 'Guerrero_PE', $3)
               ON CONFLICT (tournament_id, round_number, match_number) DO UPDATE SET winner_id = EXCLUDED.participant2_id
               RETURNING id`,
              [tournId, playerIds[4], playerIds[5]]
            );
            const m3Id = m3Res.rows[0]?.id;

            // Resultados de Partida (Aprobados)
            if (m1Id) {
              await pool.query(
                `INSERT INTO match_results (match_id, score_participant1, score_participant2, status)
                 VALUES ($1, 2, 1, 'APPROVED')
                 ON CONFLICT (match_id) DO UPDATE SET status = 'APPROVED', score_participant1 = 2, score_participant2 = 1`,
                [m1Id]
              );
            }
            if (m2Id) {
              await pool.query(
                `INSERT INTO match_results (match_id, score_participant1, score_participant2, status)
                 VALUES ($1, 3, 0, 'APPROVED')
                 ON CONFLICT (match_id) DO UPDATE SET status = 'APPROVED', score_participant1 = 3, score_participant2 = 0`,
                [m2Id]
              );
            }
            if (m3Id) {
              await pool.query(
                `INSERT INTO match_results (match_id, score_participant1, score_participant2, status)
                 VALUES ($1, 1, 2, 'APPROVED')
                 ON CONFLICT (match_id) DO UPDATE SET status = 'APPROVED', score_participant1 = 1, score_participant2 = 2`,
                [m3Id]
              );
            }
          }
        }
      }
    }

    // Gatillar recalculo
    await rankingService.recalculateAllRankings();

    return NextResponse.json({
      ok: true,
      message: "Rankings actualizados correctamente" + (seed ? " (con semillas de prueba)" : ""),
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[Recalculate API Error]:", error);
    return NextResponse.json(
      { ok: false, message: "Error al recalcular rankings", error: errorMessage },
      { status: 500 }
    );
  }
}
